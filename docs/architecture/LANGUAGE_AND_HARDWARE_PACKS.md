# Core language and hardware packs

**Status:** catalogued capability contracts; provider execution remains unimplemented.

## Core Languages pack

The curated pack includes:

| Language / toolchain | Atlas capability |
|---|---|
| C | `c.compiler` |
| C++ | `cpp.compiler` |
| Java | `java.jdk`, `java.maven`, `java.gradle` |
| C# | `csharp.dotnet` |
| SQL | `sql.fluff` |
| Python | `python.cpython`, `python.pip`, `python.venv`, `python.uv`, `python.conda` |
| Rust | `rust.rustup`, `rust.stable` |
| CMake | `cpp.cmake` |
| PHP | `php.runtime`, `php.composer` |

CMake is a build-system generator, not a programming language. It is included in the curated pack because it is a core native build tool. SQLFluff provides SQL linting/formatting; database engines, servers, clients, and drivers remain separate capabilities. Java build tools are optional prerequisites, not forced global installs.

## Hardware layer

Assembly is a hardware/toolchain capability, not part of the general-purpose language runtime pack:

- `hardware.assembly`: NASM for x86-family source targeting x64. It does not claim 16-bit DOS support.
- `hardware.assembly.arm64`: LLVM integrated assembler tooling for AArch64/ARM64.

Assembler syntax, target triple, ABI, relocation model, and object format must be explicit. NASM, GNU as, MASM, and LLVM integrated assembler are not interchangeable. A source file that assembles for one target does not imply portability to another.

## Portability and installation contract

A language pack is a selection bundle, not a universal binary. Atlas must resolve every selected capability against the explicit target OS, distribution, architecture, ABI, runtime, and requested version. It must reject unsupported combinations before producing an install plan.

For a portable Atlas application artifact:

1. Ship the Atlas application runtime and its own dependencies in the application bundle; do not assume a globally installed Node.js runtime.
2. Keep language SDKs/toolchains as separately versioned, target-specific payloads. Do not bundle every compiler into the base application.
3. Publish only artifacts built and smoke-tested for their declared OS/architecture. Include checksums, signed provenance, SBOM, and release attestations.
4. Support offline use through a content-addressed cache of verified artifacts and metadata. Report cache misses; never silently fall back to network access.
5. Preserve project-native manifests and lockfiles. Resolve ecosystem-specific version schemes with ecosystem-specific adapters rather than coercing all versions into SemVer.
6. Verify installed compiler/runtime paths and versions with non-mutating probes, then compile/build a minimal fixture in an isolated workspace.
7. Require explicit approval for privileged operations and host-wide environment changes.

## Current implementation boundary

These entries are capability catalogue and preview-plan metadata only. The current Atlas branch does not download or install these toolchains, verify publisher signatures, detect live host architecture/ABI, or execute compile probes. Provider names are candidates and must be verified against upstream release matrices before any native adapter is enabled.

The current planner intentionally fails closed for x86 and ARM32 because there is no verified per-capability 32-bit provider matrix. 16-bit DOS remains deferred. The two Assembly entries currently declare x64 and ARM64 separately; neither implies support for other architectures.
