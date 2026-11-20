import type { Capability } from "./types";

const portableProviders = (artifact: string, rationale: string): Capability["platforms"] => ({
  windows: [{ manager: "manual", package: artifact, rationale: `Official Windows distribution; verify signature, architecture, and supported runtime: ${rationale}` }],
  macos: [{ manager: "manual", package: artifact, rationale: `Official macOS distribution; verify signature, architecture, and supported runtime: ${rationale}` }],
  linux: [{ manager: "manual", package: artifact, rationale: `Use the official distribution or a verified distro-specific package; verify architecture and ABI: ${rationale}` }],
});

const extraCapabilities: Capability[] = [
  {
    id: "c.compiler",
    name: "C compiler toolchain",
    category: "toolchain",
    language: "C",
    description: "Native C compiler and linker. Select MSVC, Clang, or GCC according to the target OS, architecture, ABI, and project requirements.",
    platforms: {
      windows: [{ manager: "manual", package: "MSVC Build Tools or LLVM/Clang", rationale: "MSVC and Clang have distinct ABI/runtime choices; install only the selected toolchain and target components." }],
      macos: [{ manager: "manual", package: "Xcode Command Line Tools / Apple Clang", rationale: "Compiler and SDK compatibility are coupled to the selected Xcode/macOS release." }],
      linux: [
        { manager: "apt", package: "build-essential", rationale: "Debian/Ubuntu C toolchain candidate; verify package architecture and libc/ABI." },
        { manager: "dnf", package: "gcc", rationale: "Fedora/RHEL C compiler candidate; verify target triple and ABI." },
        { manager: "pacman", package: "base-devel", rationale: "Arch build tool group candidate; verify target triple and ABI." },
      ],
    },
    dependencies: [],
    versionPolicy: "user-selected",
    detection: { executable: "cc", versionArgs: ["--version"] },
    verification: "Resolve the selected compiler (cc, clang, gcc, or cl.exe), inspect its target triple, then compile and link a minimal C program for the requested target.",
    supportedArchitectures: ["x64", "arm64"],
    implementation: "catalogued-plan-only",
  },
  {
    id: "csharp.dotnet",
    name: ".NET SDK (C#)",
    category: "runtime",
    language: "C#",
    description: ".NET SDK including the C# compiler, runtime packs, and dotnet CLI. SDK selection must satisfy the project's global.json and target framework.",
    platforms: portableProviders("dotnet-sdk", "Official .NET distributions are architecture- and release-specific; use Microsoft's supported OS/architecture matrix."),
    dependencies: [],
    versionPolicy: "user-selected",
    detection: { executable: "dotnet", versionArgs: ["--version"] },
    verification: "Check dotnet --info, installed SDK/runtime lists, architecture, and global.json selection; build a minimal project without changing global SDK selection.",
    supportedArchitectures: ["x64", "arm64"],
    implementation: "catalogued-plan-only",
  },
  {
    id: "sql.fluff",
    name: "SQLFluff (SQL lint and format)",
    category: "toolchain",
    language: "SQL",
    description: "Dialect-aware SQL linter and formatter. SQL engines, database servers, and client drivers remain separate opt-in capabilities.",
    platforms: portableProviders("sqlfluff", "SQLFluff is a Python-distributed developer tool; use an isolated environment and a project-pinned version."),
    dependencies: ["python.cpython"],
    versionPolicy: "user-selected",
    detection: { executable: "sqlfluff", versionArgs: ["--version"] },
    verification: "Check the selected SQLFluff version and dialect, then lint/format a fixture without connecting to a database.",
    implementation: "catalogued-plan-only",
  },
  {
    id: "php.runtime",
    name: "PHP CLI runtime",
    category: "runtime",
    language: "PHP",
    description: "PHP CLI runtime. Extensions and web-server integration are separate, versioned capabilities.",
    platforms: {
      windows: [{ manager: "manual", package: "PHP for Windows", rationale: "Select the official build matching architecture, thread-safety requirements, and Visual C++ runtime." }],
      macos: [{ manager: "homebrew", package: "php", rationale: "Homebrew package candidate; pin the required PHP major/minor version for each project." }],
      linux: [
        { manager: "apt", package: "php-cli", rationale: "Debian/Ubuntu package candidate; repository release determines PHP version." },
        { manager: "dnf", package: "php-cli", rationale: "Fedora/RHEL package candidate; module streams and repository policy determine PHP version." },
        { manager: "pacman", package: "php", rationale: "Arch package candidate; rolling-release version must be checked against project constraints." },
      ],
    },
    dependencies: [],
    versionPolicy: "user-selected",
    detection: { executable: "php", versionArgs: ["--version"] },
    verification: "Check PHP version, architecture, loaded configuration, and enabled extensions; do not modify php.ini implicitly.",
    supportedArchitectures: ["x64", "arm64"],
    implementation: "catalogued-plan-only",
  },
  {
    id: "php.composer",
    name: "Composer",
    category: "package-manager",
    language: "PHP",
    description: "PHP dependency manager; project composer.lock is authoritative for dependency reproducibility.",
    platforms: portableProviders("composer", "Use the official Composer distribution or a verified OS package; run it with the selected PHP executable."),
    dependencies: ["php.runtime"],
    versionPolicy: "stable",
    detection: { executable: "composer", versionArgs: ["--version"] },
    verification: "Check Composer and PHP executable paths, validate composer.json/lock consistency, and avoid installing project dependencies globally.",
    supportedArchitectures: ["x64", "arm64"],
    implementation: "catalogued-plan-only",
  },
  {
    id: "hardware.assembly",
    name: "Assembly toolchain",
    category: "hardware",
    language: "Assembly",
    description: "NASM assembler for x86-family source and x64 targets. Syntax and object format must be selected explicitly; this entry does not imply ARM or 16-bit DOS support.",
    platforms: {
      windows: [{ manager: "manual", package: "NASM Windows binary", rationale: "Use the official NASM release and select the required Win64 object format." }],
      macos: [{ manager: "manual", package: "NASM macOS binary", rationale: "Use the official NASM release and verify the host architecture." }],
      linux: [
        { manager: "apt", package: "nasm", rationale: "Debian/Ubuntu NASM package candidate; verify version and ELF output support." },
        { manager: "dnf", package: "nasm", rationale: "Fedora/RHEL NASM package candidate; verify version and ELF output support." },
        { manager: "pacman", package: "nasm", rationale: "Arch NASM package candidate; verify version and ELF output support." },
      ],
    },
    dependencies: [],
    versionPolicy: "user-selected",
    detection: { executable: "nasm", versionArgs: ["-v"] },
    verification: "Require explicit x86-64 target and object format, then assemble and inspect a minimal object without executing it.",
    supportedArchitectures: ["x64"],
    implementation: "catalogued-plan-only",
  },
  {
    id: "hardware.assembly.arm64",
    name: "LLVM AArch64 assembler",
    category: "hardware",
    language: "Assembly",
    description: "LLVM integrated assembler tooling for AArch64/ARM64 targets. This is separate from NASM syntax and requires an explicit target triple and object format.",
    platforms: {
      windows: [{ manager: "manual", package: "LLVM Windows distribution", rationale: "Use the official LLVM release and verify llvm-mc includes the AArch64 target." }],
      macos: [{ manager: "manual", package: "Xcode Command Line Tools / LLVM", rationale: "Verify the installed LLVM toolchain exposes the required AArch64 target." }],
      linux: [
        { manager: "apt", package: "llvm", rationale: "Debian/Ubuntu LLVM package candidate; verify llvm-mc target registration." },
        { manager: "dnf", package: "llvm", rationale: "Fedora/RHEL LLVM package candidate; verify llvm-mc target registration." },
        { manager: "pacman", package: "llvm", rationale: "Arch LLVM package candidate; verify llvm-mc target registration." },
      ],
    },
    dependencies: [],
    versionPolicy: "user-selected",
    detection: { executable: "llvm-mc", versionArgs: ["--version"] },
    verification: "Assemble a minimal AArch64 fixture with an explicit target triple and inspect the resulting object; never execute it as part of detection.",
    supportedArchitectures: ["arm64"],
    implementation: "catalogued-plan-only",
  },
];

/** Appends additional capabilities to the inventory without grouping them into an install bundle. */
export function composeCapabilityInventory(existing: Capability[]): Capability[] {
  const existingIds = new Set(existing.map((capability) => capability.id));
  return [...existing, ...extraCapabilities.filter((capability) => !existingIds.has(capability.id))];
}

export const HARDWARE_CAPABILITY_IDS = ["hardware.assembly", "hardware.assembly.arm64"] as const;
