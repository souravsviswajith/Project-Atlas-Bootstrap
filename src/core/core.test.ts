import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { parseAtlasConfig, ConfigValidationError } from "./config";
import { authorizePlan, createPlan, executePlan } from "./planner";
import { assertRegistryIntegrity, capabilityRegistry } from "./registry";
import { createEvidenceReport, initialEvidence, sanitizeDiagnostic, verifyEvidenceReport } from "./evidence";
import type { AtlasConfig, Capability } from "./types";

const yaml = (body: string) => `schemaVersion: 1\ntarget:\n  os: linux\n  distro: ubuntu\n  arch: x64\ncapabilities:\n${body}`;

describe("Atlas configuration", () => {
  it("parses schema v1 and defaults to explicit preview/authorization", () => {
    const config = parseAtlasConfig(yaml("  - id: javascript.typescript\n    version: '>=5.0 <6.0'\n  - id: javascript.node\n    version: lts\n"));
    expect(config.policy).toEqual({ mode: "preview", requireAuthorization: true });
    expect(config.verification.required).toBe(true);
    expect(config.capabilities[0].optional).toBe(false);
  });

  it("rejects unknown, stale, duplicate, malformed and conflicting configuration", () => {
    expect(() => parseAtlasConfig("schemaVersion: 2\ntarget: {}\ncapabilities: []\n" )).toThrow(ConfigValidationError);
    expect(() => parseAtlasConfig(yaml("  - id: old.capability\n"))).toThrow(/unknown capability/);
    expect(() => parseAtlasConfig(yaml("  - id: javascript.node\n    version: '20.x'\n"))).toThrow(/version/);
    expect(() => parseAtlasConfig(yaml("  - id: javascript.node\n  - id: javascript.node\n    version: '24'\n"))).toThrow(/conflicting duplicate/);
    expect(() => parseAtlasConfig("schemaVersion: 1\ntarget:\n  os: linux\n  arch: x64\ncapabilities: []\n")).toThrow(/target.distro/);
  });

  it("accepts the checked-in example contract and rejects impossible version ranges", () => {
    const sample = readFileSync(new URL("../../config/atlas.example.yaml", import.meta.url), "utf8");
    expect(parseAtlasConfig(sample).capabilities.length).toBeGreaterThan(10);
    expect(() => parseAtlasConfig(yaml("  - id: java.jdk\n    version: '>=22 <21'\n"))).toThrow(/version/);
  });

  it("rejects mutation policy and unknown fields rather than silently ignoring them", () => {
    expect(() => parseAtlasConfig("schemaVersion: 1\ntarget: {os: windows, arch: x64}\ncapabilities: []\npolicy: {mode: apply}\n")).toThrow(/only preview/);
    expect(() => parseAtlasConfig("schemaVersion: 1\ntarget: {os: windows, arch: x64}\ncapabilities: []\nwat: true\n")).toThrow(/unknown field/);
  });
});

describe("capability registry and planning", () => {
  it("contains unique, well-formed entries with resolved dependencies", () => {
    expect(() => assertRegistryIntegrity()).not.toThrow();
    expect(new Set(capabilityRegistry.map((item) => item.id)).size).toBe(capabilityRegistry.length);
    expect(capabilityRegistry.length).toBeGreaterThanOrEqual(35);
    expect(capabilityRegistry.every((item) => item.implementation === "catalogued-plan-only")).toBe(true);
  });

  it("explicitly catalogs every required language and core-tool family", () => {
    const ids = new Set(capabilityRegistry.map((item) => item.id));
    for (const id of ["python.cpython", "python.launcher", "python.pip", "python.venv", "python.uv", "python.conda", "java.jdk", "java.maven", "java.gradle", "javascript.node", "javascript.npm", "javascript.corepack", "javascript.typescript", "cpp.compiler", "cpp.cmake", "cpp.ninja", "cpp.debugger", "rust.rustup", "rust.stable", "dart.sdk", "flutter.sdk", "kotlin.compiler", "database.mysql-client", "database.postgresql-client", "shell.powershell7", "shell.windows-powershell", "shell.bash", "shell.zsh", "config.formats", "git.git", "github.cli", "editor.vscode", "container.docker", "container.compose", "kubernetes.kubectl", "kubernetes.helm", "iac.terraform", "cloud.aws-cli", "cloud.gcloud", "mobile.android-studio", "database.mysql-server", "database.postgresql-server", "database.mongodb-server", "database.redis-server"]) {
      expect(ids.has(id), `missing registry capability ${id}`).toBe(true);
    }
  });

  it("orders dependencies before requested capabilities and chooses Linux providers deterministically", () => {
    const config = parseAtlasConfig(yaml("  - id: javascript.typescript\n"));
    const plan = createPlan(config, new Date("2026-01-02T03:04:05.000Z"));
    const ids = plan.steps.map((step) => step.capabilityId);
    expect(ids).toEqual(["javascript.node", "javascript.npm", "javascript.typescript"]);
    expect(plan.steps.map((step) => step.provider?.manager)).toEqual(["apt", "apt", "apt"]);
    expect(plan.steps[2].reason).toContain("Explicitly requested");
    expect(plan.hasMutations).toBe(false);
    expect(plan.generatedAt).toBe("2026-01-02T03:04:05.000Z");
  });

  it("detects cycles rather than producing a partial plan", () => {
    const cycle: Capability[] = [
      { ...capabilityRegistry[0], id: "test.a", dependencies: ["test.b"] },
      { ...capabilityRegistry[0], id: "test.b", dependencies: ["test.a"] },
    ];
    const config: AtlasConfig = { schemaVersion: 1, target: { os: "windows", arch: "x64" }, capabilities: [{ id: "test.a", optional: false }], policy: { mode: "preview", requireAuthorization: true }, verification: { required: true }, reporting: { format: "json" } };
    expect(() => createPlan(config, new Date(), cycle)).toThrow(/Dependency cycle/);
  });

  it("selects OS-specific provider families without implying they were executed", () => {
    const config = parseAtlasConfig(yaml("  - id: git.git\n"));
    const windows = createPlan({ ...config, target: { os: "windows", arch: "x64" } });
    const macos = createPlan({ ...config, target: { os: "macos", arch: "arm64" } });
    expect(windows.steps[0].provider?.manager).toBe("winget");
    expect(macos.steps[0].provider?.manager).toBe("homebrew");
    expect(windows.steps[0].state).toBe("planned");
    expect(capabilityRegistry.every((item) => item.implementation === "catalogued-plan-only")).toBe(true);
  });

  it("marks platform-unsupported requests unavailable rather than asserting support", () => {
    const config = parseAtlasConfig(yaml("  - id: shell.zsh\n"));
    const plan = createPlan({ ...config, target: { os: "windows", arch: "x64" } });
    expect(plan.steps[0]).toMatchObject({ capabilityId: "shell.zsh", state: "unavailable" });
  });

  it("propagates optionality through prerequisites unless another required root needs the same capability", () => {
    const optionalPlan = createPlan(parseAtlasConfig(yaml("  - id: javascript.typescript\n    optional: true\n")));
    expect(optionalPlan.steps.every((step) => step.optional)).toBe(true);
    const mixed = createPlan(parseAtlasConfig(yaml("  - id: javascript.typescript\n    optional: true\n  - id: javascript.node\n    optional: false\n")));
    expect(mixed.steps.find((step) => step.capabilityId === "javascript.node")?.optional).toBe(false);
  });

  it("can be previewed without invoking any executor", () => {
    const plan = createPlan(parseAtlasConfig(yaml("  - id: rust.stable\n")));
    expect(plan.steps.map((step) => step.capabilityId)).toEqual(["rust.rustup", "rust.stable"]);
    expect(plan.hasMutations).toBe(false);
  });

  it("keeps preview non-mutating, rejects unapproved or unavailable apply requests, and gates executor calls", async () => {
    const plan = createPlan(parseAtlasConfig(yaml("  - id: git.git\n")));
    const executor = { execute: vi.fn().mockResolvedValue({ ok: true }) };
    expect(() => authorizePlan(plan, { approved: false })).toThrow(/denied/);
    expect(executor.execute).not.toHaveBeenCalled();
    const request = authorizePlan(plan, { approved: true, confirmationText: "APPLY ATLAS PLAN" }, new Date("2026-03-01T00:00:00.000Z"));
    expect(request).toMatchObject({ mode: "apply", hasMutations: true, authorizedAt: "2026-03-01T00:00:00.000Z" });
    await expect(executePlan(request, executor)).resolves.toEqual({ ok: true });
    expect(executor.execute).toHaveBeenCalledOnce();
    await expect(executePlan(plan as never, executor)).rejects.toThrow(/non-apply/);
    const unsupportedConfig = parseAtlasConfig(yaml("  - id: shell.zsh\n"));
    const unsupported = createPlan({ ...unsupportedConfig, target: { os: "windows", arch: "x64" } });
    expect(() => authorizePlan(unsupported, { approved: true, confirmationText: "APPLY ATLAS PLAN" })).toThrow(/unavailable or blocked/);
    expect(executor.execute).toHaveBeenCalledOnce();
  });
});

describe("evidence and verification state", () => {
  it("keeps execution and verification separate, validates planned IDs and redacts diagnostics", async () => {
    const plan = createPlan(parseAtlasConfig(yaml("  - id: java.jdk\n")));
    const entries = initialEvidence(plan);
    expect(entries.every((entry) => entry.execution === "not-run" && entry.verification === "not-run")).toBe(true);
    const report = await createEvidenceReport(plan, [{ capabilityId: "java.jdk", execution: "succeeded", verification: "failed", observedVersion: "21", diagnostics: "token=secret123" }], undefined, new Date("2026-02-01T00:00:00Z"));
    expect(report.entries[0]).toMatchObject({ execution: "succeeded", verification: "failed", diagnostics: "token=[REDACTED]" });
    expect(report.integrity.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(await verifyEvidenceReport(report)).toBe(true);
    expect(await verifyEvidenceReport({ ...report, entries: [{ ...report.entries[0], observedVersion: "tampered" }] })).toBe(false);
    await expect(createEvidenceReport(plan, [{ capabilityId: "not-planned", execution: "failed", verification: "not-run" }])).rejects.toThrow(/not present/);
  });

  it("redacts common credential patterns and bounds diagnostic length", () => {
    expect(sanitizeDiagnostic("Authorization: Bearer abc.def token=private")).not.toContain("abc.def");
    expect(sanitizeDiagnostic("x".repeat(4500))).toHaveLength(4000);
  });
});
