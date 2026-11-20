import { capabilityRegistry } from "./registry";
import { evaluateCompatibility } from "./compatibility";
import type { AtlasConfig, AtlasPlan, Capability, PlanStep, ProviderOption, TargetPlatform } from "./types";

export class PlanningError extends Error {
  constructor(public readonly issues: string[]) {
    super(issues.join("; "));
    this.name = "PlanningError";
  }
}

function providerFor(capability: Capability, target: TargetPlatform): ProviderOption | undefined {
  // No per-capability 32-bit provider matrix has been verified yet. Accept these
  // target architectures in config, but do not claim catalogue availability.
  if (target.arch === "x86" || target.arch === "arm32") return undefined;
  const options = capability.platforms[target.os] ?? [];
  if (target.os !== "linux") return options[0];
  const manager = target.distro === "debian" || target.distro === "ubuntu" ? "apt"
    : target.distro === "fedora" || target.distro === "rhel" ? "dnf" : target.distro === "arch" ? "pacman" : undefined;
  // Some upstream toolchains are distributed as signed vendor archives rather than through
  // every distro's native package manager. Keep those explicit manual candidates selectable.
  return options.find((option) => option.manager === manager)
    ?? options.find((option) => option.manager === "manual");
}

/** Deterministic topological preview. This function only reads registry/config data. */
export function createPlan(config: AtlasConfig, now: Date = new Date(), registry: ReadonlyArray<Capability> = capabilityRegistry): AtlasPlan {
  const capabilityById = new Map(registry.map((capability) => [capability.id, capability]));
  const roots = new Map(config.capabilities.map((request) => [request.id, request]));
  const errors: string[] = [];
  const order: string[] = [];
  const temporary = new Set<string>();
  const permanent = new Set<string>();

  const visit = (id: string, path: string[]) => {
    if (permanent.has(id)) return;
    if (temporary.has(id)) {
      errors.push(`Dependency cycle: ${[...path, id].join(" → ")}`);
      return;
    }
    const capability = capabilityById.get(id);
    if (!capability) { errors.push(`Unknown capability '${id}'`); return; }
    temporary.add(id);
    for (const dependency of [...capability.dependencies].sort()) visit(dependency, [...path, id]);
    temporary.delete(id);
    permanent.add(id);
    order.push(id);
  };

  for (const id of [...roots.keys()].sort()) visit(id, []);
  if (errors.length) throw new PlanningError(errors);

  const compatibilityIssues = evaluateCompatibility(order, config.capabilities, registry, config.target.arch);
  const blockingIssuesByCapability = new Map<string, string[]>();
  for (const issue of compatibilityIssues) {
    if (issue.severity !== "error") continue;
    for (const id of issue.capabilityIds) {
      const messages = blockingIssuesByCapability.get(id) ?? [];
      messages.push(issue.message);
      blockingIssuesByCapability.set(id, messages);
    }
  }

  const requiredIds = new Set<string>();
  const markRequired = (id: string) => {
    if (requiredIds.has(id)) return;
    requiredIds.add(id);
    for (const dependency of capabilityById.get(id)?.dependencies ?? []) markRequired(dependency);
  };
  for (const request of config.capabilities) if (!request.optional) markRequired(request.id);

  const steps: PlanStep[] = [];
  const stepsById = new Map<string, PlanStep>();
  // Populate in topological order to ensure blocked prerequisites propagate deterministically.
  for (const id of order) {
    const capability = capabilityById.get(id)!;
    const requested = roots.get(id);
    const provider = providerFor(capability, config.target);
    const unavailableDependency = capability.dependencies.find((dependency) => {
      const priorStep = stepsById.get(dependency);
      return priorStep?.state === "unavailable" || priorStep?.state === "blocked";
    });
    const optional = !requiredIds.has(id);
    const blockingIssues = blockingIssuesByCapability.get(id) ?? [];
    const step: PlanStep = unavailableDependency
      ? { capabilityId: id, name: capability.name, state: "blocked", requestedVersion: requested?.version,
          reason: `Blocked because prerequisite '${unavailableDependency}' is unavailable or incompatible.`, dependencies: [...capability.dependencies], optional, verification: capability.verification }
      : blockingIssues.length
        ? { capabilityId: id, name: capability.name, state: "blocked", requestedVersion: requested?.version,
            reason: blockingIssues.join(" "), dependencies: [...capability.dependencies], optional, verification: capability.verification }
        : !provider
          ? { capabilityId: id, name: capability.name, state: "unavailable", requestedVersion: requested?.version,
            reason: (config.target.arch === "x86" || config.target.arch === "arm32")
              ? `No provider has a verified ${config.target.arch} architecture mapping yet.`
              : `No candidate provider is catalogued for ${config.target.os}${config.target.distro ? ` (${config.target.distro})` : ""}.`, dependencies: [...capability.dependencies], optional, verification: capability.verification }
          : { capabilityId: id, name: capability.name, state: "planned", provider, requestedVersion: requested?.version,
            reason: requested ? "Explicitly requested; prerequisites are included first." : `Required prerequisite of ${capability.name}.`, dependencies: [...capability.dependencies], optional, verification: capability.verification };
    steps.push(step);
    stepsById.set(id, step);
  }

  return { schemaVersion: 1, mode: "preview", target: config.target, generatedAt: now.toISOString(), steps, errors, compatibilityIssues, hasMutations: false };
}

export interface ExecutionAuthorization { approved: boolean; confirmationText?: string }
export interface AuthorizedExecutionRequest {
  schemaVersion: 1;
  mode: "apply";
  target: AtlasPlan["target"];
  steps: PlanStep[];
  authorizedAt: string;
  hasMutations: true;
}
export interface Executor { execute(request: AuthorizedExecutionRequest): Promise<unknown> }

/** Converts a non-mutating preview into an explicit apply intent only after affirmative confirmation. */
export function authorizePlan(plan: AtlasPlan, authorization: ExecutionAuthorization, now = new Date(), registry: ReadonlyArray<Capability> = capabilityRegistry): AuthorizedExecutionRequest {
  if (plan.mode !== "preview" || plan.hasMutations !== false) throw new Error("Invalid or unsupported preview plan");
  if (plan.steps.length === 0) throw new Error("Execution denied: empty plans cannot be applied.");
  if (!authorization.approved || authorization.confirmationText !== "APPLY ATLAS PLAN") {
    throw new Error("Execution denied: explicit authorization phrase is required.");
  }
  if (plan.compatibilityIssues.some((issue) => issue.severity === "error" || issue.code === "version-unresolved")) throw new Error("Execution denied: compatibility constraints or version resolution are incomplete.");
  if (plan.steps.some((step) => step.state !== "planned")) throw new Error("Execution denied: plan contains unavailable or blocked capabilities.");
  if (plan.steps.some((step) => registry.find((capability) => capability.id === step.capabilityId)?.implementation !== "verified-provider")) throw new Error("Execution denied: one or more capabilities are catalogue-only and have no verified executable provider.");
  return { schemaVersion: 1, mode: "apply", target: plan.target, steps: plan.steps, authorizedAt: now.toISOString(), hasMutations: true };
}

/** The executor accepts apply intent only. It is an interface contract; Atlas currently wires no runtime. */
export async function executePlan(request: AuthorizedExecutionRequest, executor: Executor): Promise<unknown> {
  if (request.mode !== "apply" || request.hasMutations !== true) throw new Error("Executor rejected non-apply request");
  return executor.execute(request);
}
