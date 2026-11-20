import type { Architecture, Capability, CompatibilityIssue } from "./types";

interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease: string[];
}

type ComparatorOperator = ">" | ">=" | "<" | "<=" | "=";
interface Comparator {
  operator: ComparatorOperator;
  version: ParsedVersion;
}

export interface CompatibilityRequest {
  id: string;
  version?: string;
}


function parseVersion(value: string): ParsedVersion | undefined {
  const match = /^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/.exec(value.trim());
  if (!match) return undefined;
  const major = Number(match[1]);
  const minor = Number(match[2] ?? 0);
  const patch = Number(match[3] ?? 0);
  if (![major, minor, patch].every(Number.isSafeInteger)) return undefined;
  return { major, minor, patch, prerelease: match[4] ? match[4].split(".") : [] };
}

function compareVersions(left: ParsedVersion, right: ParsedVersion): number {
  for (const key of ["major", "minor", "patch"] as const) {
    if (left[key] !== right[key]) return left[key] < right[key] ? -1 : 1;
  }
  if (left.prerelease.length === 0 && right.prerelease.length === 0) return 0;
  if (left.prerelease.length === 0) return 1;
  if (right.prerelease.length === 0) return -1;
  const count = Math.max(left.prerelease.length, right.prerelease.length);
  for (let index = 0; index < count; index += 1) {
    const a = left.prerelease[index];
    const b = right.prerelease[index];
    if (a === undefined) return -1;
    if (b === undefined) return 1;
    if (a === b) continue;
    const aNumeric = /^\d+$/.test(a);
    const bNumeric = /^\d+$/.test(b);
    if (aNumeric && bNumeric) return Number(a) < Number(b) ? -1 : 1;
    if (aNumeric !== bNumeric) return aNumeric ? -1 : 1;
    return a < b ? -1 : 1;
  }
  return 0;
}

function upperBound(operator: "^" | "~", version: ParsedVersion, source: string): ParsedVersion {
  const result: ParsedVersion = { major: version.major, minor: version.minor, patch: version.patch, prerelease: [] };
  const componentCount = source.replace(/^v/, "").split(/[+-]/)[0].split(".").length;
  if (operator === "~") {
    if (componentCount === 1) { result.major += 1; result.minor = 0; }
    else result.minor += 1;
    result.patch = 0;
  } else if (result.major > 0 || componentCount === 1) {
    result.major += 1; result.minor = 0; result.patch = 0;
  } else if (result.minor > 0 || componentCount === 2) {
    result.minor += 1; result.patch = 0;
  } else {
    result.patch += 1;
  }
  return result;
}

function parseRange(range: string): Comparator[] | undefined {
  const normalized = range.trim().replace(/(>=|>|<=|<|=|\^|~)\s+/g, "$1");
  const terms = normalized.split(/\s+/).filter(Boolean);
  if (!terms.length) return undefined;
  const comparators: Comparator[] = [];
  for (const term of terms) {
    const match = /^(>=|>|<=|<|=|\^|~)?(v?\d+(?:\.\d+){0,2}(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?)$/.exec(term);
    if (!match) return undefined;
    const version = parseVersion(match[2]);
    if (!version) return undefined;
    const operator = match[1] ?? "=";
    if (operator === "^" || operator === "~") {
      comparators.push({ operator: ">=", version });
      comparators.push({ operator: "<", version: upperBound(operator, version, match[2]) });
    } else {
      comparators.push({ operator: operator as ComparatorOperator, version });
    }
  }
  return comparators;
}

function satisfiesComparators(version: ParsedVersion, comparators: Comparator[]): boolean {
  return comparators.every(({ operator, version: boundary }) => {
    const comparison = compareVersions(version, boundary);
    switch (operator) {
      case ">": return comparison > 0;
      case ">=": return comparison >= 0;
      case "<": return comparison < 0;
      case "<=": return comparison <= 0;
      case "=": return comparison === 0;
    }
  });
}

/** Evaluates numeric semantic versions against a conjunction of supported range terms. */
export function satisfiesVersion(version: string, range: string): boolean {
  const parsed = parseVersion(version);
  const comparators = parseRange(range);
  return Boolean(parsed && comparators && satisfiesComparators(parsed, comparators));
}

/** Returns false only when the declared comparator bounds cannot overlap. */
export function versionConstraintsOverlap(ranges: readonly string[]): boolean {
  const comparators = ranges.flatMap((range) => parseRange(range) ?? []);
  if (comparators.length === 0) return ranges.length === 0;
  if (ranges.some((range) => !parseRange(range))) return false;

  let lower: { version: ParsedVersion; exclusive: boolean } | undefined;
  let upper: { version: ParsedVersion; exclusive: boolean } | undefined;
  let exact: ParsedVersion | undefined;

  for (const comparator of comparators) {
    const { operator, version } = comparator;
    if (operator === "=") {
      if (exact && compareVersions(exact, version) !== 0) return false;
      exact = version;
    } else if (operator === ">" || operator === ">=") {
      if (!lower || compareVersions(version, lower.version) > 0 ||
        (compareVersions(version, lower.version) === 0 && operator === ">")) {
        lower = { version, exclusive: operator === ">" };
      }
    } else if (!upper || compareVersions(version, upper.version) < 0 ||
      (compareVersions(version, upper.version) === 0 && operator === "<")) {
      upper = { version, exclusive: operator === "<" };
    }
  }

  if (exact) {
    if (lower && (compareVersions(exact, lower.version) < 0 ||
      (compareVersions(exact, lower.version) === 0 && lower.exclusive))) return false;
    if (upper && (compareVersions(exact, upper.version) > 0 ||
      (compareVersions(exact, upper.version) === 0 && upper.exclusive))) return false;
    return true;
  }
  if (!lower || !upper) return true;
  const comparison = compareVersions(lower.version, upper.version);
  return comparison < 0 || (comparison === 0 && !lower.exclusive && !upper.exclusive);
}

export function evaluateCompatibility(
  orderedIds: readonly string[],
  requests: readonly CompatibilityRequest[],
  registry: ReadonlyArray<Capability>,
  architecture: Architecture,
): CompatibilityIssue[] {
  const byId = new Map(registry.map((capability) => [capability.id, capability]));
  const selected = new Set(orderedIds);
  const requestById = new Map(requests.map((request) => [request.id, request]));
  const issues: CompatibilityIssue[] = [];
  const issueKeys = new Set<string>();
  const conflictPairs = new Set<string>();
  const addIssue = (issue: CompatibilityIssue) => {
    const key = [issue.code, ...[...issue.capabilityIds].sort(), issue.message].join("|");
    if (!issueKeys.has(key)) { issueKeys.add(key); issues.push(issue); }
  };

  for (const id of orderedIds) {
    const capability = byId.get(id);
    if (!capability) continue;

    if (capability.supportedArchitectures && !capability.supportedArchitectures.includes(architecture)) {
      addIssue({
        code: "unsupported-architecture",
        severity: "error",
        capabilityIds: [id],
        message: `${capability.name} does not declare support for ${architecture}.`,
        remediation: "Choose a supported target architecture or a provider with an explicit architecture mapping.",
      });
    }

    for (const conflictId of capability.conflicts ?? []) {
      const pairKey = [id, conflictId].sort().join("|");
      if (selected.has(conflictId) && !conflictPairs.has(pairKey)) {
        conflictPairs.add(pairKey);
        const other = byId.get(conflictId);
        addIssue({
          code: "declared-conflict",
          severity: "error",
          capabilityIds: [id, conflictId],
          message: `${capability.name} conflicts with ${other?.name ?? conflictId}.`,
          remediation: "Remove one conflicting selection or choose an alternative provider/profile.",
        });
      }
    }

    for (const dependencyId of capability.dependencies) {
      const constraint = capability.dependencyConstraints?.[dependencyId];
      if (!constraint) continue;
      const dependencyRequest = requestById.get(dependencyId);
      if (!dependencyRequest?.version) {
        addIssue({
          code: "version-unresolved",
          severity: "warning",
          capabilityIds: [id, dependencyId],
          message: `${capability.name} requires ${dependencyId} ${constraint}, but no exact dependency version is pinned.`,
          remediation: "Pin a compatible dependency version after a provider supplies verified version candidates.",
        });
      } else if (!satisfiesVersion(dependencyRequest.version, constraint)) {
        addIssue({
          code: "dependency-version-mismatch",
          severity: "error",
          capabilityIds: [id, dependencyId],
          message: `${capability.name} requires ${dependencyId} ${constraint}; requested ${dependencyRequest.version}.`,
          remediation: `Select a ${dependencyId} version satisfying ${constraint} or change the dependent capability.`,
        });
      }
    }
  }

  const constraintsByDependency = new Map<string, Array<{ owner: string; range: string }>>();
  for (const id of orderedIds) {
    const capability = byId.get(id);
    if (!capability) continue;
    for (const [dependencyId, range] of Object.entries(capability.dependencyConstraints ?? {})) {
      if (!capability.dependencies.includes(dependencyId)) continue;
      const constraints = constraintsByDependency.get(dependencyId) ?? [];
      constraints.push({ owner: id, range });
      constraintsByDependency.set(dependencyId, constraints);
    }
  }

  for (const [dependencyId, constraints] of constraintsByDependency) {
    const ranges = constraints.map((item) => item.range);
    if (!versionConstraintsOverlap(ranges)) {
      const owners = [...new Set(constraints.map((item) => item.owner))];
      addIssue({
        code: "unsatisfiable-version-constraints",
        severity: "error",
        capabilityIds: [...owners, dependencyId],
        message: `Selected capabilities impose incompatible version constraints on ${dependencyId}: ${ranges.join(" and ")}.`,
        remediation: "Choose compatible capability versions or remove one of the selections.",
      });
    }
  }

  return issues;
}
