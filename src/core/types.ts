export const TARGET_OS = ["windows", "macos", "linux"] as const;
export type TargetOS = (typeof TARGET_OS)[number];
export type Architecture = "x86" | "x64" | "arm32" | "arm64";
export type ExecutionEnvironment = "native" | "wsl";

export interface TargetHost {
  os: TargetOS;
  arch: Architecture;
  osVersion?: string;
}
export type LinuxDistro = "debian" | "ubuntu" | "fedora" | "rhel" | "arch";
export type PackageManager = "winget" | "homebrew" | "apt" | "dnf" | "pacman" | "manual";

export interface TargetPlatform {
  os: TargetOS;
  arch: Architecture;
  /** Defaults to native. WSL targets represent a Linux guest hosted by Windows. */
  executionEnvironment?: ExecutionEnvironment;
  /** Stable guest identity, required for WSL targets (for example, Ubuntu-24.04). */
  environmentId?: string;
  /** WSL generation; required when executionEnvironment is wsl. */
  wslVersion?: 1 | 2;
  /** Host facts for a guest target. Required for WSL and must identify Windows. */
  host?: TargetHost;
  /** Required for Linux to avoid assuming a package manager from the kernel alone. */
  distro?: LinuxDistro;
  /** Optional OS release/feature-version constraint; not yet checked against a live host. */
  osVersion?: string;
  /** Optional Linux release constraint; not yet checked against a live host. */
  distroVersion?: string;
}

export interface ProviderOption {
  manager: PackageManager;
  package: string;
  rationale: string;
}

export type CapabilityCategory = "language" | "runtime" | "package-manager" | "toolchain" | "editor" | "cloud" | "container" | "database" | "shell" | "configuration" | "mobile" | "hardware";
export type CapabilityPack = "core-languages" | "hardware";

export interface Capability {
  id: string;
  name: string;
  category: CapabilityCategory;
  /** Optional pack membership for curated install bundles; independent of capability category. */
  pack?: CapabilityPack;
  language?: string;
  description: string;
  platforms: Partial<Record<TargetOS, ProviderOption[]>>;
  dependencies: string[];
  /** SemVer-only constraints keyed by dependency capability ID; other schemes belong to ecosystem adapters. */
  dependencyConstraints?: Record<string, string>;
  /** Explicit mutual-exclusion metadata; absent means no conflict is asserted. */
  conflicts?: string[];
  /** Declared architecture support; absent means the catalogue has not constrained it. */
  supportedArchitectures?: Architecture[];
  versionPolicy: "stable" | "lts" | "user-selected" | "bundled" | "system";
  detection: { executable: string; versionArgs: string[] };
  verification: string;
  environment?: string[];
  implementation: "catalogued-plan-only";
}

export interface AtlasConfig {
  schemaVersion: 1;
  target: TargetPlatform;
  capabilities: Array<{ id: string; version?: string; optional: boolean }>;
  policy: { mode: "preview"; requireAuthorization: true };
  verification: { required: boolean };
  reporting: { format: "json" | "json-and-html" };
}

export type PlanState = "planned" | "unavailable" | "blocked";
export interface PlanStep {
  capabilityId: string;
  name: string;
  state: PlanState;
  provider?: ProviderOption;
  requestedVersion?: string;
  reason: string;
  dependencies: string[];
  optional: boolean;
  verification: string;
}

export interface CompatibilityIssue {
  code: "declared-conflict" | "dependency-version-mismatch" | "unsatisfiable-version-constraints" | "version-unresolved" | "unsupported-architecture";
  severity: "error" | "warning";
  capabilityIds: string[];
  message: string;
  remediation: string;
}

export interface AtlasPlan {
  schemaVersion: 1;
  mode: "preview";
  target: TargetPlatform;
  generatedAt: string;
  steps: PlanStep[];
  errors: string[];
  compatibilityIssues: CompatibilityIssue[];
  hasMutations: false;
}
