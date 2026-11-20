# Atlas Implementation Sequence

**Status:** Proposed execution sequence  
**Last reviewed:** 2026-11-21

This sequence extends the current React/Vite application and planner. It does not replace the existing UI, discard the capability catalogue, or make Atlas dependent on Cloud107.

## Workstream 0 — Preserve and baseline

- Keep the existing main branch and PR #17 intact.
- Re-run typecheck, tests, and production build against the exact commit being changed.
- Record current planner behavior and existing tests.
- Review PR #17 independently before deciding whether to merge it.
- Correct its privilege-startup proposal: Atlas UI and read-only inventory must start unprivileged; elevate only individual operations that require it.

**Exit gate:** baseline is reproducible and existing user workflows remain intact.

## Workstream 1 — Contracts and data model

- Define target identity, host/guest distinction, OS and architecture enums.
- Define capability metadata separately from provider implementation metadata.
- Define typed operation request, authorization, lifecycle, and verification contracts.
- Define structured compatibility diagnostics.
- Define lockfile schema and versioning policy.

**Exit gate:** schema validation and unit tests cover valid and invalid target/capability/operation records.

## Workstream 2 — Compatibility engine

- Preserve and harden current dependency graph traversal.
- Add ecosystem-specific version semantics.
- Add architecture, OS, distribution, ABI, runtime, and conflict constraints.
- Add deterministic resolution and structured conflict reporting.
- Add lockfile generation and replay tests.

**Exit gate:** multi-package selection either produces a reproducible complete plan or a clear conflict report; no mutation occurs.

## Workstream 3 — Platform inventory adapters

- Start with read-only host detection.
- Add Windows host inventory.
- Add WSL detection and named distribution inventory as a distinct guest target.
- Add Linux and macOS inventory adapters after target-specific research.
- Add architecture and ABI facts based on observed runtime data.

**Exit gate:** inventory is evidence-backed, permission-minimal, and never confuses host and guest state.

## Workstream 4 — Provider adapters and execution

- Implement one narrowly scoped provider end-to-end before broad catalogue coverage.
- Use native package managers through typed, allowlisted adapter interfaces.
- Add explicit preflight, authorization, operation journal, cancellation, and verification.
- Add recovery/compensation only where the provider can define a safe strategy.
- Keep preview mode as the default.

**Exit gate:** one provider can install a test package on a disposable target, verify the postcondition, and produce an auditable report.

## Workstream 5 — Workspace manager

- Define workspace manifest and lockfile contracts.
- Support creation, inspection, export, and import of workspace metadata.
- Add ecosystem-native isolated environments where supported.
- Keep workspace operations separate from machine-wide package installation.
- Test repeatability and non-destructive behavior.

**Exit gate:** a workspace can be recreated from its manifest/lockfile on a compatible test target.

## Workstream 6 — Portable application and release pipeline

- Evaluate native-shell options without prematurely locking a framework.
- Build portable bundles that include the required runtime.
- Build Windows .exe/.msi and Linux .deb artifacts.
- Add platform-specific signing, provenance, SBOM, checksums, and release attestations.
- Add architecture-specific CI runners or reproducible cross-builds, then verify on real target environments.

**Exit gate:** each published artifact launches and passes smoke tests on its declared OS/architecture. Unsupported combinations are not published as supported.

## Workstream 7 — Offline cache and optional integrations

- Add content-addressed package cache and verified metadata.
- Add offline plan/install behavior with explicit cache-miss reporting.
- Add Cloud107 as an optional versioned integration contract only after local functionality works independently.

**Exit gate:** Atlas remains fully usable for local workflows with Cloud107 disconnected.

## Release discipline

- Keep each workstream on a reviewable feature branch.
- Do not merge a workstream based only on documentation or compilation.
- Run npm run typecheck, npm test, and npm run build for frontend/planner changes.
- Add native adapter tests and disposable-machine integration tests before claiming execution support.
- Update README capability claims only after behavior is verified.
- Do not mark an OS/architecture as supported based on a successful compile alone.

## Explicitly deferred

- 16-bit DOS/legacy runtime support
- Universal support for every Unix variant
- A single solver replacing every package ecosystem
- Remote orchestration as a required Atlas service
- Automatic privileged startup
