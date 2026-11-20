# Atlas core build and artifact toolchains

**Status:** architecture contract and planning metadata. Native provisioning is not implemented.

## 1. Atlas application build stack

Atlas's own implementation stack is separate from the toolchains it provisions for user projects.

| Layer | Technology | Responsibility | Current status |
|---|---|---|---|
| Native core | Rust | CLI, native engine, platform adapters, compatibility, execution boundary | Target architecture; native core not yet present in this frontend-only branch |
| Application UI | TypeScript | Typed UI, frontend and application orchestration | Current Vite/React frontend |
| Persistence | SQL | Relational workspace state, metadata, manifests and migrations | Target architecture; database adapter and schema migration runtime not yet implemented |

SQL is the persistence/query contract, not a database server. The concrete embedded/database engine is deliberately not selected by this profile. A local-first embedded engine can be evaluated separately; it must not be mistaken for the SQL language itself.

The Atlas core profile is not an end-user install pack. Selecting or building Atlas must not cause unrelated C, C++, Java, Python, PHP or Assembly SDKs to be installed globally.

## 2. Artifact-driven toolchain provisioning

Toolchains are requested by an artifact or workspace manifest. A profile represents minimum known requirements, not an unconditional complete build environment.

| Artifact profile | Minimum declared capabilities | Not automatically included |
|---|---|---|
| Rust CLI/application | rustup, Rust stable/Cargo | Cross-linker, target SDK, C compiler unless target requires it |
| C native application | C compiler | CMake, Ninja, debugger, SDK unless declared |
| C++ native application | C++ compiler | CMake, Ninja, debugger, SDK unless declared |
| Java application | JDK | Maven/Gradle unless project uses them; project wrapper takes precedence |
| .NET/C# application | .NET SDK | Additional workloads and target packs unless required |
| Python application | CPython | uv, Conda, pip/venv separately when bundled or project manifest requires them |
| PHP application | PHP CLI | Composer unless project uses it |
| PHP + Composer | PHP CLI, Composer | Web server and extensions unless declared |
| TypeScript application | Node.js, TypeScript | Other package managers unless package.json selects them |
| SQL lint/format | SQLFluff | Python isolated runtime and dialect support resolved by its provider adapter; no database server |
| CMake native project | C++ compiler, CMake | Ninja is independent and only selected when the project requests it |
| x86-64 Assembly | NASM | Linker, SDK and execution target are separate |
| AArch64 Assembly | LLVM integrated assembler | Linker, SDK and execution target are separate |

Profiles are starting points. Project manifests, lockfiles, build scripts, target triples and declared SDK requirements are authoritative. Atlas must add only the transitive dependencies actually required by the selected artifact.

## 3. Capability inventory versus install selection

The capability registry is an inventory of what Atlas may be able to provision. It is not an install bundle. The UI must not provide a one-click “install every language” action.

- Artifact profile selection adds only its declared minimum capabilities.
- Users can explicitly add optional build tools, package managers, debuggers, database clients and SDKs.
- Bundled components (for example, pip/venv with a CPython distribution, or npm with a Node distribution) must not be treated as independent global installs without evidence that the selected provider separates them.
- Maven and Gradle are independent alternatives; project wrappers take precedence.
- Ninja is independent of CMake. A project may use Ninja without CMake or CMake with another generator.
- SQLFluff is a SQL linter/formatter, not a database engine or SQL runtime.
- PHP is conservatively x64-only in the current global architecture model. Official PHP documentation states that Windows PHP does not currently run on Windows on ARM; ARM64 support must not be inferred for Windows. Enable ARM64 for other operating systems only after replacing the global architecture flag with a provider/OS-specific support matrix.
- Assembly is a hardware/toolchain capability selected for an explicit architecture and object format.

## 4. Resolution and execution contract

Before provisioning, Atlas must:

1. Identify the artifact type and read its native manifest/build configuration.
2. Separate build host, installation target and compiler output target.
3. Resolve OS release, architecture, ABI/libc, target triple, compiler, linker, SDK and object format where applicable.
4. Query ecosystem-specific resolvers (Cargo, NuGet, Maven/Gradle, PyPI/Conda, Composer, Conan/vcpkg, etc.) instead of imposing one universal version solver.
5. Resolve exact versions and transitive dependency closure; preserve native lockfiles.
6. Validate provider identity, release support, artifact hash, signature/provenance, license and privilege requirements.
7. Produce a deterministic plan and preflight report before any host mutation.
8. Require explicit approval for privileged operations and host-wide environment changes.
9. Verify installed paths/versions and build a minimal fixture in an isolated workspace.
10. Support offline replay from a content-addressed cache of verified artifacts.

A plan-only catalogue entry must never be treated as an executable provider. The current branch remains preview-only and does not download, install, sign-verify, probe or mutate the host.

## 5. Hardware and cross-compilation

Assembly support is not implied by the host architecture. The artifact must identify assembler family/syntax, output architecture, target triple, ABI, relocation model, object format and linker.

- NASM entry: x86-64 only in the current catalogue.
- LLVM integrated assembler entry: AArch64/ARM64 with explicit target triple.
- 16-bit DOS remains deferred from the current Atlas V1 scope.
- Rust cross-compilation requires the target standard library plus a compatible linker and target SDK; adding a Rust target alone is insufficient.
- C/C++ cross-compilation requires a matching compiler, sysroot/toolchain file, linker and SDK.

## 6. Current implementation boundary

This PR updates the capability model, artifact presets and UI selection semantics only. It does not add the Rust native runtime, SQL migration engine, native package providers, artifact cache, installer, code signing or release pipeline. The checked-in application remains a TypeScript/Vite frontend.

Provider package names and architecture claims remain provisional until verified against upstream platform/release matrices. Do not report a capability as installed, detected or verified based on a preview plan.
