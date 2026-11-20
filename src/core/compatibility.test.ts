import { describe, expect, it } from "vitest";
import { capabilityRegistry } from "./registry";
import { createPlan } from "./planner";
import { satisfiesVersion, versionConstraintsOverlap } from "./compatibility";
import type { AtlasConfig, Capability } from "./types";

const base = capabilityRegistry.find((item) => item.id === "git.git")!;
const dependency: Capability = { ...base, id: "test.shared-runtime", name: "Shared runtime", dependencies: [], conflicts: undefined, dependencyConstraints: undefined };
const makeCapability = (id: string, options: Partial<Capability> = {}): Capability => ({
  ...base,
  id,
  name: id,
  dependencies: [],
  conflicts: undefined,
  dependencyConstraints: undefined,
  ...options,
});

const makeConfig = (capabilities: AtlasConfig["capabilities"]): AtlasConfig => ({
  schemaVersion: 1,
  target: { os: "linux", distro: "ubuntu", arch: "x64" },
  capabilities,
  policy: { mode: "preview", requireAuthorization: true },
  verification: { required: true },
  reporting: { format: "json" },
});

describe("semantic version constraints", () => {
  it("evaluates exact versions and comparison conjunctions", () => {
    expect(satisfiesVersion("20.11.1", ">=20 <21")).toBe(true);
    expect(satisfiesVersion("21.0.0", ">=20 <21")).toBe(false);
    expect(satisfiesVersion("v20.11", "20.11.0")).toBe(true);
  });

  it("implements caret and tilde upper bounds", () => {
    expect(satisfiesVersion("1.9.0", "^1.2.3")).toBe(true);
    expect(satisfiesVersion("2.0.0", "^1.2.3")).toBe(false);
    expect(satisfiesVersion("0.2.9", "^0.2.3")).toBe(true);
    expect(satisfiesVersion("0.3.0", "^0.2.3")).toBe(false);
    expect(satisfiesVersion("1.2.9", "~1.2")).toBe(true);
    expect(satisfiesVersion("1.3.0", "~1.2")).toBe(false);
  });

  it("compares prerelease versions before stable releases", () => {
    expect(satisfiesVersion("2.0.0-rc.1", "<2.0.0")).toBe(true);
    expect(satisfiesVersion("2.0.0", ">=2.0.0-rc.1")).toBe(true);
  });

  it("detects incompatible intersections, including exclusive boundaries", () => {
    expect(versionConstraintsOverlap([">=2 <4", ">=3 <5"])).toBe(true);
    expect(versionConstraintsOverlap([">=3", "<2"])).toBe(false);
    expect(versionConstraintsOverlap([">2", "<=2"])).toBe(false);
    expect(versionConstraintsOverlap(["^1.2.0", ">=1.8 <2"])).toBe(true);
    expect(versionConstraintsOverlap(["^1.2.0", ">=2"])).toBe(false);
  });
});

describe("package compatibility planning", () => {
  it("blocks both sides of a declared package conflict", () => {
    const first = makeCapability("test.first");
    const second = makeCapability("test.second", { conflicts: ["test.first"] });
    const plan = createPlan(makeConfig([
      { id: first.id, optional: false },
      { id: second.id, optional: false },
    ]), new Date("2026-11-21T00:00:00.000Z"), [first, second]);

    expect(plan.steps.map((step) => step.state)).toEqual(["blocked", "blocked"]);
    expect(plan.compatibilityIssues).toContainEqual(expect.objectContaining({
      code: "declared-conflict",
      severity: "error",
      capabilityIds: ["test.first", "test.second"],
    }));
  });

  it("blocks a dependent when an explicitly pinned dependency version violates its range", () => {
    const app = makeCapability("test.app", {
      dependencies: [dependency.id],
      dependencyConstraints: { [dependency.id]: ">=2 <3" },
    });
    const plan = createPlan(makeConfig([
      { id: app.id, optional: false },
      { id: dependency.id, version: "1.9.9", optional: false },
    ]), new Date(), [app, dependency]);

    expect(plan.steps.find((step) => step.capabilityId === app.id)?.state).toBe("blocked");
    expect(plan.compatibilityIssues).toContainEqual(expect.objectContaining({
      code: "dependency-version-mismatch",
      severity: "error",
    }));
  });

  it("reports unresolved dependency versions without pretending to resolve them", () => {
    const app = makeCapability("test.app", {
      dependencies: [dependency.id],
      dependencyConstraints: { [dependency.id]: ">=2 <3" },
    });
    const plan = createPlan(makeConfig([{ id: app.id, optional: false }]), new Date(), [app, dependency]);

    expect(plan.steps.every((step) => step.state === "planned")).toBe(true);
    expect(plan.compatibilityIssues).toContainEqual(expect.objectContaining({
      code: "version-unresolved",
      severity: "warning",
    }));
  });

  it("blocks selections whose combined dependency ranges have no intersection", () => {
    const first = makeCapability("test.first", {
      dependencies: [dependency.id],
      dependencyConstraints: { [dependency.id]: ">=3" },
    });
    const second = makeCapability("test.second", {
      dependencies: [dependency.id],
      dependencyConstraints: { [dependency.id]: "<2" },
    });
    const plan = createPlan(makeConfig([
      { id: first.id, optional: false },
      { id: second.id, optional: false },
    ]), new Date(), [first, second, dependency]);

    expect(plan.compatibilityIssues).toContainEqual(expect.objectContaining({
      code: "unsatisfiable-version-constraints",
      severity: "error",
    }));
    expect(plan.steps.every((step) => step.state === "blocked")).toBe(true);
  });

  it("enforces declared architecture support", () => {
    const armOnly = makeCapability("test.arm-only", { supportedArchitectures: ["arm64"] });
    const plan = createPlan(makeConfig([{ id: armOnly.id, optional: false }]), new Date(), [armOnly]);
    expect(plan.steps[0].state).toBe("blocked");
    expect(plan.compatibilityIssues[0]).toMatchObject({ code: "unsupported-architecture", severity: "error" });
  });
});
