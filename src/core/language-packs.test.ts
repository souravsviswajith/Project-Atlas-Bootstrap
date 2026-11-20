import { describe, expect, it } from "vitest";
import { capabilityRegistry, assertRegistryIntegrity } from "./registry";
import { CORE_LANGUAGE_PACK, HARDWARE_PACK } from "./language-packs";
import { createPlan } from "./planner";

describe("curated language and hardware packs", () => {
  it("registers every core language pack capability exactly once", () => {
    assertRegistryIntegrity();
    const ids = capabilityRegistry.map((capability) => capability.id);
    for (const id of CORE_LANGUAGE_PACK) {
      expect(ids.filter((candidate) => candidate === id)).toHaveLength(1);
      expect(capabilityRegistry.find((capability) => capability.id === id)?.pack).toBe("core-languages");
    }
    expect(CORE_LANGUAGE_PACK).toContain("cpp.cmake");
  });

  it("keeps Assembly in the hardware layer and constrains declared targets", () => {
    for (const id of HARDWARE_PACK) {
      const capability = capabilityRegistry.find((item) => item.id === id);
      expect(capability).toMatchObject({
        category: "hardware",
        pack: "hardware",
        language: "Assembly",
        supportedArchitectures: ["x64", "arm64"],
      });
    }
  });

  it("models SQL tooling separately from database engines and uses Python as its runtime", () => {
    const sql = capabilityRegistry.find((item) => item.id === "sql.fluff");
    expect(sql?.dependencies).toContain("python.cpython");
    expect(sql?.description).toContain("database servers");
    expect(capabilityRegistry.some((item) => item.id === "database.postgresql-server")).toBe(true);
  });

  it("previews C#, PHP, and Assembly as separate target capabilities", () => {
    const plan = createPlan({
      schemaVersion: 1,
      target: { os: "linux", distro: "ubuntu", arch: "x64" },
      capabilities: [
        { id: "csharp.dotnet", optional: false },
        { id: "php.composer", optional: false },
        { id: "hardware.assembly", optional: false },
      ],
      policy: { mode: "preview", requireAuthorization: true },
      verification: { required: true },
      reporting: { format: "json" },
    });
    expect(plan.steps.map((step) => step.capabilityId)).toEqual([
      "csharp.dotnet",
      "hardware.assembly",
      "php.runtime",
      "php.composer",
    ]);
    expect(plan.steps.every((step) => step.state === "planned")).toBe(true);
    expect(plan.hasMutations).toBe(false);
  });
});
