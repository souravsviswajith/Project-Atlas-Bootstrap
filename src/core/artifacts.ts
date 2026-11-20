/**
 * Artifact presets are requirement hints, not install bundles.
 * Only the minimum language/runtime capability is selected by each preset.
 * Build systems, package managers, SDKs, and cross-linkers remain opt-in
 * unless the artifact manifest declares them.
 */
export const ARTIFACT_PROFILES = [
  { id: "rust-cli", label: "Rust CLI / application", capabilityIds: ["rust.rustup", "rust.stable"] },
  { id: "c-native", label: "C native application", capabilityIds: ["c.compiler"] },
  { id: "cpp-native", label: "C++ native application", capabilityIds: ["cpp.compiler"] },
  { id: "java-app", label: "Java application", capabilityIds: ["java.jdk"] },
  { id: "dotnet-app", label: ".NET / C# application", capabilityIds: ["csharp.dotnet"] },
  { id: "python-app", label: "Python application", capabilityIds: ["python.cpython"] },
  { id: "php-app", label: "PHP application", capabilityIds: ["php.runtime"] },
  { id: "php-composer-app", label: "PHP project using Composer", capabilityIds: ["php.runtime", "php.composer"] },
  { id: "typescript-app", label: "TypeScript application", capabilityIds: ["javascript.node", "javascript.typescript"] },
  { id: "sql-lint", label: "SQL lint / formatting", capabilityIds: ["sql.fluff"] },
  { id: "cmake-native", label: "CMake-based native project", capabilityIds: ["cpp.compiler", "cpp.cmake"] },
  { id: "assembly-x64", label: "x86-64 Assembly artifact", capabilityIds: ["hardware.assembly"] },
  { id: "assembly-arm64", label: "AArch64 Assembly artifact", capabilityIds: ["hardware.assembly.arm64"] },
] as const;

export type ArtifactProfileId = (typeof ARTIFACT_PROFILES)[number]["id"];

export function getArtifactProfile(id: ArtifactProfileId) {
  return ARTIFACT_PROFILES.find((profile) => profile.id === id)!;
}
