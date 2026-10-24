import { capabilityRegistry } from "./registry";
import type { AtlasConfig, AtlasPlan, Capability, PlanStep, ProviderOption, TargetPlatform } from "./types";

export class PlanningError extends Error {
  constructor(public readonly issues: string[]) {
    super(issues.join("; "));
    this.name = "PlanningError";
  }
}

function providerFor(capability: Capability, target: TargetPlatform): ProviderOption | undefined {
  const options = capability.platforms[target.os] ?? [];
  if (target.os !== "linux") return options[0];
  const manager = target.distro === "debian" || target.distro === "ubuntu" ? "apt"
    : target.distro === "fedora" || target.distro === "rhel" ? "dnf" : target.distro === "arch" ? "pacman" : undefined;
  return options.find((option) => option.manager === manager);
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
    const step: PlanStep = unavailableDependency
      ? { capabilityId: id, name: capability.name, state: "blocked", requestedVersion: requested?.version,
          reason: `Blocked because prerequisite '${unavailableDependency}' is unavailable.`, dependencies: [...capability.dependencies], optional, verification: capability.verification }
      : !provider
        ? { capabilityId: id, name: capability.name, state: "unavailable", requestedVersion: requested?.version,
            reason: `No candidate provider is catalogued for ${config.target.os}${config.target.distro ? ` (${config.target.distro})` : ""}.`, dependencies: [...capability.dependencies], optional, verification: capability.verification }
        : { capabilityId: id, name: capability.name, state: "planned", provider, requestedVersion: requested?.version,
            reason: requested ? "Explicitly requested; prerequisites are included first." : `Required prerequisite of ${capability.name}.`, dependencies: [...capability.dependencies], optional, verification: capability.verification };
    steps.push(step);
    stepsById.set(id, step);
  }

  return { schemaVersion: 1, mode: "preview", target: config.target, generatedAt: now.toISOString(), steps, errors, hasMutations: false };
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
export function authorizePlan(plan: AtlasPlan, authorization: ExecutionAuthorization, now = new Date()): AuthorizedExecutionRequest {
  if (plan.mode !== "preview" || plan.hasMutations !== false) throw new Error("Invalid or unsupported preview plan");
  if (!authorization.approved || authorization.confirmationText !== "APPLY ATLAS PLAN") {
    throw new Error("Execution denied: explicit authorization phrase is required.");
  }
  if (plan.steps.some((step) => step.state !== "planned")) throw new Error("Execution denied: plan contains unavailable or blocked capabilities.");
  return { schemaVersion: 1, mode: "apply", target: plan.target, steps: plan.steps, authorizedAt: now.toISOString(), hasMutations: true };
}

/** The executor accepts apply intent only. It is an interface contract; Atlas currently wires no runtime. */
export async function executePlan(request: AuthorizedExecutionRequest, executor: Executor): Promise<unknown> {
  if (request.mode !== "apply" || request.hasMutations !== true) throw new Error("Executor rejected non-apply request");
  return executor.execute(request);
}
