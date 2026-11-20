import { describe, expect, it } from "vitest";
import { parseAtlasConfig } from "./config";
import { createPlan } from "./planner";

const config = (target: string) => `schemaVersion: 1
target:
${target}
capabilities:
  - id: git.git
`;

describe("Atlas target identity", () => {
  it("defaults legacy schema-v1 targets to native execution", () => {
    const parsed = parseAtlasConfig(config("  os: linux\n  distro: ubuntu\n  arch: x64"));
    expect(parsed.target.executionEnvironment).toBe("native");
    expect(parsed.target.host).toBeUndefined();
  });

  it("accepts a Windows-hosted WSL guest as a distinct Linux target", () => {
    const parsed = parseAtlasConfig(config(
      "  os: linux\n  distro: ubuntu\n  distroVersion: '24.04'\n  arch: x64\n  executionEnvironment: wsl\n  environmentId: Ubuntu-24.04\n  wslVersion: 2\n  host:\n    os: windows\n    arch: x64\n    osVersion: '11'"
    ));
    expect(parsed.target).toMatchObject({
      os: "linux",
      distro: "ubuntu",
      arch: "x64",
      executionEnvironment: "wsl",
      environmentId: "Ubuntu-24.04",
      wslVersion: 2,
      host: { os: "windows", arch: "x64", osVersion: "11" },
    });
    const plan = createPlan(parsed);
    expect(plan.steps[0].provider?.manager).toBe("apt");
  });

  it("rejects WSL without a Windows host, guest identity, and WSL version", () => {
    const wrongHost = config(
      "  os: linux\n  distro: ubuntu\n  arch: x64\n  executionEnvironment: wsl\n  environmentId: Ubuntu\n  wslVersion: 2\n  host: {os: macos, arch: arm64}"
    );
    expect(() => parseAtlasConfig(wrongHost)).toThrow(/WSL requires Windows host facts/);

    const missingIdentity = config(
      "  os: linux\n  distro: ubuntu\n  arch: x64\n  executionEnvironment: wsl\n  wslVersion: 2\n  host: {os: windows, arch: x64}"
    );
    expect(() => parseAtlasConfig(missingIdentity)).toThrow(/environmentId/);

    const missingVersion = config(
      "  os: linux\n  distro: ubuntu\n  arch: x64\n  executionEnvironment: wsl\n  environmentId: Ubuntu\n  host: {os: windows, arch: x64}"
    );
    expect(() => parseAtlasConfig(missingVersion)).toThrow(/wslVersion/);
  });

  it("rejects guest-only fields on a native target", () => {
    const nativeWithHost = config(
      "  os: windows\n  arch: x64\n  host: {os: windows, arch: x64}"
    );
    expect(() => parseAtlasConfig(nativeWithHost)).toThrow(/only valid for WSL targets/);
  });

  it.each(["x86", "arm32"] as const)("accepts %s target identity but does not claim unverified provider support", (arch) => {
    const parsed = parseAtlasConfig(config(`  os: linux\n  distro: ubuntu\n  arch: ${arch}`));
    expect(parsed.target.arch).toBe(arch);
    const plan = createPlan(parsed);
    expect(plan.steps[0]).toMatchObject({
      state: "unavailable",
      reason: `No provider has a verified ${arch} architecture mapping yet.`,
    });
  });

  it("rejects unknown execution environment values", () => {
    expect(() => parseAtlasConfig(config(
      "  os: linux\n  distro: ubuntu\n  arch: x64\n  executionEnvironment: docker"
    ))).toThrow(/expected native or wsl/);
  });
});
