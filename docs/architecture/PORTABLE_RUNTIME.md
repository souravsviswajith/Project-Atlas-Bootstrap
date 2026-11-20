# Atlas Portable Runtime Contract

**Status:** Proposed implementation contract for review  
**Scope:** Project Atlas Bootstrap only  
**Last reviewed:** 2026-11-21

## 1. Product boundary

Atlas is a standalone, local-first workstation bootstrap application. It combines device and host inventory, package and SDK selection, dependency and compatibility planning, workspace creation and management, and authorized provisioning, verification, and recovery.

These are capabilities of one Atlas application, not separate products.

Atlas must start and provide its local planning and workspace functionality without Cloud107, a remote account, or a hosted control plane. Cloud107 integration is optional and must use a versioned, documented contract. Atlas must not import Cloud107 runtime code or become dependent on Cloud107 services.

The current React/Vite application and planner remain in place. This contract extends them; it does not authorize a replacement scaffold or a UI rewrite.

## 2. Runtime boundaries

| Boundary | Responsibility | Trust level |
| --- | --- | --- |
| UI | Collect intent, show inventory and plans, request approvals, display operation results | Untrusted input |
| Application service | Validate requests, coordinate planning and operations, maintain lifecycle | Trusted application logic |
| Platform adapter | Read host facts and expose narrowly scoped OS operations | Privileged boundary |
| Provider adapter | Translate typed package operations to a native ecosystem manager | External-tool boundary |
| Compatibility engine | Evaluate OS, distribution, architecture, ABI, runtime, versions, dependencies and conflicts | Deterministic policy engine |
| Artifact/cache service | Store package metadata and verified artifacts for online/offline use | Integrity boundary |
| Workspace service | Create and manage isolated, reproducible development environments | Filesystem boundary |

The UI must never construct arbitrary shell commands. Platform and provider adapters accept typed requests and validate every field before invoking an operating-system API or external package manager.

## 3. Target model

A target is an explicit execution environment, not merely the machine's marketing name.

Required target attributes:

- os: windows, linux, macos, or a specifically researched Unix target
- architecture: x86, x64, arm32, or arm64
- distribution and distributionVersion, when applicable
- abi and runtime constraints, when relevant
- executionEnvironment: native, WSL, container, or another explicitly supported environment
- environmentId: stable identifier for a named guest environment where applicable

The model must distinguish a Windows host from each WSL distribution running on it. A Windows package provider must never be selected for a Linux guest target, or vice versa.

A WSL target includes host requirements and guest requirements. WSL availability, version, distribution identity, guest architecture, and lifecycle state must be observed before operations are planned. Export/import of a distribution does not make the WSL host runtime portable to arbitrary operating systems.

## 4. Architecture support policy

Atlas records requested architecture coverage separately from verified release coverage.

| Architecture | Product intent | Release policy |
| --- | --- | --- |
| x86 (32-bit) | In scope | Enable only where OS, runtime, and selected package support are verified |
| x64 | In scope | Primary baseline for initial implementation |
| ARM32 | In scope | Enable only for tested OS/toolchain combinations |
| ARM64 | In scope | Enable only for tested OS/toolchain combinations |
| 16-bit x86 | Deferred | Separate DOS/legacy compatibility scope; not part of the current native runtime contract |

Never infer that an architecture is supported merely because the application frontend can be compiled for it. Native host bindings, package providers, dependencies, signing, and release artifacts all require target-specific validation.

## 5. Process and privilege model

- Start the application as the invoking user.
- Read-only inventory, plan generation, diagnostics, and UI startup must not require administrator/root privileges.
- Elevate only the individual operation that requires it.
- The approval screen must identify the target, exact operation, provider, package/version, privilege requirement, and expected impact.
- Do not retain elevated privileges after the operation.
- Never run a package manager with user-controlled command fragments.
- Do not disable Defender, firewall, BitLocker, Gatekeeper, SELinux, AppArmor, or other security controls as an installation convenience.
- Do not enable services, scheduled tasks, SSH servers, self-hosted runners, or network listeners unless explicitly selected and approved.

## 6. Operation lifecycle

Every mutation is represented as a durable operation with a stable operation ID and explicit target.

Minimum states:

1. created
2. validated
3. awaiting_authorization
4. authorized
5. running
6. verifying
7. succeeded
8. failed
9. cancel_requested
10. cancelled
11. recovery_required
12. recovered

A state transition must be recorded with timestamps and structured diagnostics. A provider must not report success solely because its process exited with code zero; the declared postcondition must be checked.

Operations must define idempotency behavior. If an operation cannot safely be retried, that limitation must be declared before execution. Cancellation is best-effort and must not be represented as rollback.

## 7. Artifact and offline model

- Use a content-addressed cache for downloaded artifacts.
- Verify cryptographic hashes before use.
- Verify publisher signatures or trusted repository metadata where the upstream ecosystem supports them.
- Record source URL/repository, package identity, version, architecture, digest, signature-verification result, and retrieval time.
- Distinguish integrity verification from publisher authenticity.
- Offline mode may use only cached artifacts and metadata whose integrity and trust policy can still be verified.
- Never silently substitute an unverified mirror or a different package version.

## 8. Application packaging

The application must support a portable distribution mode alongside OS-native installation packages.

Initial requested output formats include Windows .exe and .msi, and Linux .deb. Additional formats such as RPM, AppImage, Flatpak, macOS .app/.dmg/.pkg are separate target deliverables and require their own build, signing, installation, and upgrade tests.

A portable bundle must not depend on a globally installed Node.js runtime merely to launch the released application. The current development workflow may continue to use Node.js and Vite.

No native shell framework is selected by this document. Evaluate candidate shells against x86, x64, ARM32, and ARM64 feasibility; Windows, Linux, macOS, and WSL interaction boundaries; offline operation and portable mode; code signing and notarization; native dependency footprint; update and recovery strategy; accessibility and integration with the existing React UI.

## 9. License boundary

Atlas is Apache-2.0. Cloud107 is AGPL-3.0. Atlas must not copy or link Cloud107 implementation code into its distributable runtime until a documented compatibility and rights review approves that use. Architectural ideas and independently specified interfaces may be implemented clean-room in Atlas. Optional integration must remain contract-based.

## 10. Acceptance criteria

The portable runtime foundation is not complete until tests demonstrate:

- UI and planning start without admin/root.
- Target identity distinguishes host OS and named WSL guest environments.
- A Windows target cannot accidentally select a Linux guest provider, and the reverse.
- Every operation has a target, typed request, preflight, authorization decision, lifecycle, and verification result.
- Untrusted UI values cannot become arbitrary process arguments or shell fragments.
- Unsupported OS/architecture combinations fail closed with actionable diagnostics.
- Offline artifact use validates digests and trust metadata.
- Atlas can run its local planning and workspace features without Cloud107 connectivity.
