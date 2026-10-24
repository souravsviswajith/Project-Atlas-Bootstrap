import { parseDocument } from "yaml";
import { TARGET_OS, type AtlasConfig, type Architecture, type LinuxDistro } from "./types";
import { capabilityById } from "./registry";

const DISTROS: readonly LinuxDistro[] = ["debian", "ubuntu", "fedora", "rhel", "arch"];
const ARCHES: readonly Architecture[] = ["x64", "arm64"];
const VERSION_CONSTRAINT = /^(?:stable|lts|current|latest|system|v?\d+(?:\.\d+){0,2}(?:[-+][0-9A-Za-z.-]+)?|(?:>=|>|<=|<|=|\^|~)\s*v?\d+(?:\.\d+){0,2}(?:\s+(?:>=|>|<=|<|=|\^|~)\s*v?\d+(?:\.\d+){0,2})*)$/;

function compareVersion(a: number[], b: number[]): number {
  for (let index = 0; index < 3; index += 1) {
    const difference = (a[index] ?? 0) - (b[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

function contradictoryRange(value: string): boolean {
  const terms = [...value.matchAll(/(>=|>|<=|<|=|\^|~)\s*v?(\d+(?:\.\d+){0,2})/g)];
  if (!terms.length) return false;
  let lower: { version: number[]; exclusive: boolean } | undefined;
  let upper: { version: number[]; exclusive: boolean } | undefined;
  const applyLower = (version: number[], exclusive: boolean) => {
    if (!lower || compareVersion(version, lower.version) > 0 || (compareVersion(version, lower.version) === 0 && exclusive)) lower = { version, exclusive };
  };
  const applyUpper = (version: number[], exclusive: boolean) => {
    if (!upper || compareVersion(version, upper.version) < 0 || (compareVersion(version, upper.version) === 0 && exclusive)) upper = { version, exclusive };
  };
  for (const term of terms) {
    const operator = term[1];
    const original = term[2];
    const version = original.split(".").map(Number);
    if (operator === ">" || operator === ">=") applyLower(version, operator === ">");
    else if (operator === "<" || operator === "<=") applyUpper(version, operator === "<");
    else if (operator === "=") { applyLower(version, false); applyUpper(version, false); }
    else {
      applyLower(version, false);
      const padded = [...version, 0, 0].slice(0, 3);
      if (operator === "~") padded[1] += 1;
      else if (padded[0] > 0) padded[0] += 1;
      else if (padded[1] > 0) padded[1] += 1;
      else padded[2] += 1;
      if (operator === "~" && original.split(".").length === 1) { padded[0] = version[0] + 1; padded[1] = 0; padded[2] = 0; }
      applyUpper(padded, true);
    }
  }
  if (!lower || !upper) return false;
  const comparison = compareVersion(lower.version, upper.version);
  return comparison > 0 || (comparison === 0 && (lower.exclusive || upper.exclusive));
}

export class ConfigValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super(`Invalid Atlas configuration: ${issues.join("; ")}`);
    this.name = "ConfigValidationError";
  }
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function rejectUnknownKeys(value: Record<string, unknown>, allowed: string[], path: string, issues: string[]) {
  for (const key of Object.keys(value)) if (!allowed.includes(key)) issues.push(`${path}.${key}: unknown field`);
}

/** Parses the versioned YAML contract and applies conservative defaults. No installation is performed. */
export function parseAtlasConfig(source: string): AtlasConfig {
  const issues: string[] = [];
  if (source.length > 256_000) throw new ConfigValidationError(["configuration exceeds 256 KB"]);
  const document = parseDocument(source, { uniqueKeys: true, prettyErrors: true });
  if (document.errors.length) throw new ConfigValidationError(document.errors.map((error) => error.message));
  const raw: unknown = document.toJS({ maxAliasCount: 20 });
  if (!record(raw)) throw new ConfigValidationError(["root must be a mapping"]);
  rejectUnknownKeys(raw, ["schemaVersion", "target", "capabilities", "policy", "verification", "reporting"], "config", issues);
  if (raw.schemaVersion !== 1) issues.push("schemaVersion: expected 1 (migrate older documents explicitly)");

  const target = record(raw.target) ? raw.target : {};
  rejectUnknownKeys(target, ["os", "arch", "distro", "osVersion", "distroVersion"], "target", issues);
  if (!TARGET_OS.includes(target.os as (typeof TARGET_OS)[number])) issues.push("target.os: expected windows, macos, or linux");
  if (!ARCHES.includes(target.arch as Architecture)) issues.push("target.arch: expected x64 or arm64");
  if (target.os === "linux" && !DISTROS.includes(target.distro as LinuxDistro)) {
    issues.push("target.distro: Linux targets require debian, ubuntu, fedora, rhel, or arch");
  }
  if (target.os !== "linux" && target.distro !== undefined) issues.push("target.distro: only valid for Linux targets");
  if (target.osVersion !== undefined && (typeof target.osVersion !== "string" || !/^\d+(?:\.\d+){0,2}$/.test(target.osVersion))) issues.push("target.osVersion: expected a numeric release such as 11 or 15.6");
  if (target.distroVersion !== undefined && (target.os !== "linux" || typeof target.distroVersion !== "string" || !/^\d+(?:\.\d+){0,2}$/.test(target.distroVersion))) issues.push("target.distroVersion: valid only on Linux and must be a numeric release such as 24.04");

  const requested = raw.capabilities === undefined ? [] : raw.capabilities;
  const parsedCapabilities: AtlasConfig["capabilities"] = [];
  if (!Array.isArray(requested)) issues.push("capabilities: expected a list");
  else {
    const seen = new Map<string, string | undefined>();
    requested.forEach((entry, index) => {
      const path = `capabilities[${index}]`;
      if (!record(entry)) { issues.push(`${path}: expected a mapping`); return; }
      rejectUnknownKeys(entry, ["id", "version", "optional"], path, issues);
      if (typeof entry.id !== "string" || !capabilityById.has(entry.id)) {
        issues.push(`${path}.id: unknown capability '${String(entry.id)}'`);
        return;
      }
      const version = entry.version;
      if (version !== undefined && (typeof version !== "string" || !VERSION_CONSTRAINT.test(version.trim()) || contradictoryRange(version.trim()))) {
        issues.push(`${path}.version: expected an exact version or supported comparison range`);
      }
      if (entry.optional !== undefined && typeof entry.optional !== "boolean") issues.push(`${path}.optional: expected true or false`);
      if (seen.has(entry.id)) {
        if (seen.get(entry.id) !== version) issues.push(`${path}.version: conflicting duplicate request for '${entry.id}'`);
        else issues.push(`${path}.id: duplicate capability '${entry.id}'`);
        return;
      }
      seen.set(entry.id, typeof version === "string" ? version.trim() : undefined);
      parsedCapabilities.push({ id: entry.id, ...(typeof version === "string" ? { version: version.trim() } : {}), optional: entry.optional === true });
    });
  }

  const policy = raw.policy === undefined ? {} : record(raw.policy) ? raw.policy : {};
  if (raw.policy !== undefined && !record(raw.policy)) issues.push("policy: expected a mapping");
  rejectUnknownKeys(policy, ["mode", "requireAuthorization"], "policy", issues);
  if (policy.mode !== undefined && policy.mode !== "preview") issues.push("policy.mode: only preview is available in this release");
  if (policy.requireAuthorization !== undefined && policy.requireAuthorization !== true) issues.push("policy.requireAuthorization: must remain true");

  const verification = raw.verification === undefined ? {} : record(raw.verification) ? raw.verification : {};
  if (raw.verification !== undefined && !record(raw.verification)) issues.push("verification: expected a mapping");
  rejectUnknownKeys(verification, ["required"], "verification", issues);
  if (verification.required !== undefined && typeof verification.required !== "boolean") issues.push("verification.required: expected true or false");

  const reporting = raw.reporting === undefined ? {} : record(raw.reporting) ? raw.reporting : {};
  if (raw.reporting !== undefined && !record(raw.reporting)) issues.push("reporting: expected a mapping");
  rejectUnknownKeys(reporting, ["format"], "reporting", issues);
  if (reporting.format !== undefined && reporting.format !== "json" && reporting.format !== "json-and-html") {
    issues.push("reporting.format: expected json or json-and-html");
  }
  if (issues.length) throw new ConfigValidationError(issues);

  return {
    schemaVersion: 1,
    target: { os: target.os as AtlasConfig["target"]["os"], arch: target.arch as Architecture,
      ...(target.os === "linux" ? { distro: target.distro as LinuxDistro } : {}),
      ...(typeof target.osVersion === "string" ? { osVersion: target.osVersion } : {}),
      ...(typeof target.distroVersion === "string" ? { distroVersion: target.distroVersion } : {}) },
    capabilities: parsedCapabilities,
    policy: { mode: "preview", requireAuthorization: true },
    verification: { required: verification.required !== false },
    reporting: { format: reporting.format === "json-and-html" ? "json-and-html" : "json" },
  };
}
