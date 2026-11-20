import { describe, expect, it } from "vitest";
import { capabilityRegistry, assertRegistryIntegrity } from "./registry";
import { ARTIFACT_PROFILES, getArtifactProfile } from "./artifacts";
import { ATLAS_CORE_BUILD_PROFILE } from "./build-profile";
import { authorizePlan, createPlan } from "./planner";

describe("Atlas core build profile", () => {
  it("separates Atlas implementation technologies from user artifact toolchains", () => {
    expect(ATLAS_CORE_BUILD_PROFILE.rust.role).toBe("native-core");
    expect(ATLAS_CORE_BUILD_PROFILE.typescript.role).toBe("application-ui");
    expect(ATLAS_CORE_BUILD_PROFILE.sql.role).toBe("persistence-contract");
    expect(ATLAS_CORE_BUILD_PROFILE.sql.purpose).toContain("Relational persistence");
    expect(capabilityRegistry.every((capability) => !("pack" in capability))).toBe(true);
  });
});

describe("artifact-driven toolchain profiles", () => {
  it("keeps each profile limited to its minimum declared toolchain requirements", () => {
    expect(getArtifactProfile("rust-cli").capabilityIds).toEqual(["rust.rustup", "rust.stable"]);
    expect(getArtifactProfile("python-app").capabilityIds).toEqual(["python.cpython"]);
    expect(getArtifactProfile("java-app").capabilityIds).toEqual(["java.jdk"]);
    expect(getArtifactProfile("php-app").capabilityIds).toEqual(["php.runtime"]);
    expect(getArtifactProfile("php-composer-app").capabilityIds).toEqual(["php.runtime", "php.composer"]);
  });

  it("does not make optional build tools universal prerequisites", () => {
    expect(getArtifactProfile("cpp-native").capabilityIds).toEqual(["cpp.compiler"]);
    expect(getArtifactProfile("cmake-native").capabilityIds).toEqual(["cpp.compiler", "cpp.cmake"]);
    expect(getArtifactProfile("typescript-app").capabilityIds).toEqual(["javascript.node", "javascript.typescript"]);
    expect(getArtifactProfile("assembly-x64").capabilityIds).toEqual(["hardware.assembly"]);
  });

  it("keeps hardware assembly variants separate and target constrained", () => {
    const x64 = capabilityRegistry.find((item) => item.id === "hardware.assembly");
    const arm64 = capabilityRegistry.find((item) => item.id === "hardware.assembly.arm64");
    expect(x64).toMatchObject({ category: "hardware", language: "Assembly", supportedArchitectures: ["x64"] });
    expect(arm64).toMatchObject({ category: "hardware", language: "Assembly", supportedArchitectures: ["arm64"] });
  });

  it("resolves only the selected artifact profile and its declared dependencies", () => {
    assertRegistryIntegrity();
    const profile = getArtifactProfile("php-composer-app");
    const plan = createPlan({
      schemaVersion: 1,
      target: { os: "linux", distro: "ubuntu", arch: "x64" },
      capabilities: profile.capabilityIds.map((id) => ({ id, optional: false })),
      policy: { mode: "preview", requireAuthorization: true },
      verification: { required: true },
      reporting: { format: "json" },
    });
    expect(plan.steps.map((step) => step.capabilityId)).toEqual(["php.runtime", "php.composer"]);
    expect(plan.steps.every((step) => step.state === "planned")).toBe(true);
    expect(plan.hasMutations).toBe(false);
  });

  it("rejects empty plans even when the confirmation phrase is supplied", () => {
    const plan = createPlan({
      schemaVersion: 1,
      target: { os: "linux", distro: "ubuntu", arch: "x64" },
      capabilities: [],
      policy: { mode: "preview", requireAuthorization: true },
      verification: { required: true },
      reporting: { format: "json" },
    });
    expect(() => authorizePlan(plan, { approved: true, confirmationText: "APPLY ATLAS PLAN" }))
      .toThrow(/empty plans/);
  });

  it("does not authorize catalogue-only capabilities for execution", () => {
    const plan = createPlan({
      schemaVersion: 1,
      target: { os: "linux", distro: "ubuntu", arch: "x64" },
      capabilities: [{ id: "rust.rustup", optional: false }],
      policy: { mode: "preview", requireAuthorization: true },
      verification: { required: true },
      reporting: { format: "json" },
    });
    expect(() => authorizePlan(plan, { approved: true, confirmationText: "APPLY ATLAS PLAN" }))
      .toThrow(/catalogue-only/);
  });

  it("does not make Ninja depend on CMake", () => {
    expect(capabilityRegistry.find((item) => item.id === "cpp.ninja")?.dependencies).toEqual([]);
  });

  it("keeps the capability inventory broader than the available artifact presets", () => {
    const presetIds = new Set(ARTIFACT_PROFILES.flatMap((profile) => profile.capabilityIds));
    expect(capabilityRegistry.some((item) => item.id === "python.conda")).toBe(true);
    expect(presetIds.has("python.conda")).toBe(false);
    expect(presetIds.has("java.maven")).toBe(false);
    expect(presetIds.has("java.gradle")).toBe(false);
  });
});
