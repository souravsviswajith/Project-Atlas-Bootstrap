import type { Capability } from "./types";

const portableProviders = (packageName: string, rationale: string): Capability["platforms"] => ({
  windows: [{ manager: "manual", package: packageName, rationale: `Use a verified Windows distribution and match the selected target architecture: ${rationale}` }],
  macos: [{ manager: "manual", package: packageName, rationale: `Use the official macOS distribution or a verified package for the selected architecture: ${rationale}` }],
  linux: [
    { manager: "apt", package: packageName, rationale: `Candidate for Debian/Ubuntu only; verify release and architecture: ${rationale}` },
    { manager: "dnf", package: packageName, rationale: `Candidate for Fedora/RHEL only; verify release and architecture: ${rationale}` },
    { manager: "pacman", package: packageName, rationale: `Candidate for Arch only; verify release and architecture: ${rationale}` },
  ],
});

const extraCapabilities: Capability[] = [
  {
    id: "c.compiler",
    name: "C compiler toolchain",
    category: "toolchain",
    pack: "core-languages",
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
    pack: "core-languages",
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
    pack: "core-languages",
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
    pack: "core-languages",
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
    pack: "core-languages",
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
    pack: "hardware",
    language: "Assembly",
    description: "Architecture-specific assembler toolchain. Select NASM for x86/x64, GNU as/binutils for supported GNU targets, or LLVM integrated assemblers for supported LLVM targets; syntax and object formats are not interchangeable.",
    platforms: {
      windows: [{ manager: "manual", package: "NASM / LLVM / MSVC MASM components", rationale: "Select an assembler for the exact x86/x64/ARM64 target and required COFF object format; MASM availability depends on Visual Studio components." }],
      macos: [{ manager: "manual", package: "Xcode Command Line Tools / LLVM / NASM", rationale: "Apple Clang/LLVM and NASM have different architecture and object-format coverage; verify the requested target." }],
      linux: [
        { manager: "apt", package: "binutils / nasm / llvm", rationale: "Separate assembler packages; select the one matching the target triple and object format." },
        { manager: "dnf", package: "binutils / nasm / llvm", rationale: "Separate assembler packages; select the one matching the target triple and object format." },
        { manager: "pacman", package: "binutils / nasm / llvm", rationale: "Separate assembler packages; select the one matching the target triple and object format." },
      ],
    },
    dependencies: [],
    versionPolicy: "user-selected",
    detection: { executable: "as", versionArgs: ["--version"] },
    verification: "Require an explicit assembler family, target triple, syntax, ABI, and object format; assemble and inspect a minimal object without executing it.",
    supportedArchitectures: ["x64", "arm64"],
    implementation: "catalogued-plan-only",
  },
];

const coreLanguageIds = new Set([
  "c.compiler",
  "cpp.compiler",
  "cpp.cmake",
  "cpp.ninja",
  "java.jdk",
  "java.maven",
  "java.gradle",
  "python.cpython",
  "python.pip",
  "python.venv",
  "python.uv",
  "python.conda",
  "rust.rustup",
  "rust.stable",
]);

/** Adds curated pack membership to existing catalogue entries and appends missing language/hardware capabilities. */
export function composeLanguagePacks(existing: Capability[]): Capability[] {
  const tagged = existing.map((capability) =>
    coreLanguageIds.has(capability.id) && !capability.pack
      ? { ...capability, pack: "core-languages" as const }
      : capability,
  );
  const existingIds = new Set(tagged.map((capability) => capability.id));
  return [...tagged, ...extraCapabilities.filter((capability) => !existingIds.has(capability.id))];
}

export const CORE_LANGUAGE_PACK = [
  "c.compiler",
  "cpp.compiler",
  "cpp.cmake",
  "cpp.ninja",
  "java.jdk",
  "java.maven",
  "java.gradle",
  "csharp.dotnet",
  "sql.fluff",
  "python.cpython",
  "python.pip",
  "python.venv",
  "python.uv",
  "python.conda",
  "rust.rustup",
  "rust.stable",
  "php.runtime",
  "php.composer",
] as const;

export const HARDWARE_PACK = ["hardware.assembly"] as const;
