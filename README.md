# Project Atlas Bootstrap

Project Atlas is a React 19, TypeScript, and Vite application for expressing and previewing developer-workstation setup intent. The repository is evolving from a Windows-oriented checklist toward a cross-platform, declarative provisioning and verification system.

> **Current implementation status (2026-10-24): preview and checklist only.** This checkout has no native installer, detector, operating-system provider, or system mutation runtime. The planner does not install software. Catalog entries and package names are candidates, not proof of platform compatibility or support. A `planned` state means “included in this preview,” never installed, detected, or verified.

## What exists

- Existing phases 7–13 checklist remains available as a user-controlled reference.
- A typed, versioned capability catalog describes core languages and developer tools.
- `atlas.yaml` version 1 parsing validates inputs, rejects unknown/stale capability IDs, and defaults to preview-only policy.
- A deterministic dependency-first preview selects a candidate package-manager/provider by declared target OS and Linux distribution.
- Plan steps distinguish planned, unavailable, and blocked. Requested versions and provider rationale are shown.
- Explicit authorization and executor interfaces define a future native-runtime boundary; no executor is connected to the UI.
- A structured evidence/report type separates execution status from verification status, redacts common secret patterns, and can hash-chain reports with SHA-256. This is tamper-evident, not immutable, and no machine execution report is currently produced.
- Browser checklist progress is versioned, migrated from the old key, runtime-validated, and filtered against current checklist IDs. It records user checklist state only, not installed software state.

## Start and check

Node.js 22.12+ is recommended for the Vite 7 toolchain.

```bash
npm ci
npm run dev
npm run typecheck
npm test
npm run build
```

The build is a static single-file frontend. It does not expose a local or remote provisioning service. No package installation on the host is performed by these checks.

## Declarative configuration

See [`config/atlas.example.yaml`](config/atlas.example.yaml) and [`config/atlas.schema.json`](config/atlas.schema.json). The current parser accepts schema version 1 only. Linux targets require a distro family (`debian`, `ubuntu`, `fedora`, `rhel`, or `arch`); architecture is `x64` or `arm64`. Each requested capability may specify an exact version, comparison range, or selection policy such as `lts`. Defaults are preview mode, explicit authorization required, and verification expected. Unsupported fields and capability IDs are errors, not silently ignored.

Example:

```yaml
schemaVersion: 1
target:
  os: linux
  arch: x64
  distro: ubuntu
capabilities:
  - id: javascript.node
    version: lts
    optional: false
  - id: javascript.typescript
    optional: true
policy:
  mode: preview
  requireAuthorization: true
verification:
  required: true
reporting:
  format: json
```

The configuration describes desired state only. It is not an observed-state record. The UI currently builds an equivalent in-memory configuration; file upload/import and native CLI support are not implemented.

## Capability inventory and honest status

The registry includes Python/CPython, pip, venv, the Windows Python launcher/version selector, uv, Conda/Miniconda; Java/JDK, Maven and Gradle; Node.js, npm, Corepack/package-manager workflows and TypeScript; C/C++ compiler, CMake, Ninja and debugger; rustup and stable Rust/Cargo; Dart and Flutter; Kotlin; Go (carried forward from the checklist); PowerShell 7+ and Windows PowerShell 5.1; Bash/POSIX shell and Zsh; YAML/JSON/TOML tooling; Git/GitHub CLI; VS Code; Docker/Compose; kubectl/Helm; Terraform; AWS, Azure and Google Cloud CLIs (Azure retained from the old checklist), AWS SAM/CDK; Android Studio/SDK; MySQL/PostgreSQL clients and optional MySQL, PostgreSQL, MongoDB and Redis-compatible local service capabilities.

**Every registry entry is currently `catalogued-plan-only`.** It contains detection/version-command metadata and a verification description for a future provider, but Atlas does not execute those checks. Provider package names are illustrative candidates and require package-identity, distro/version, architecture, licensing, privilege, and install-behavior validation before implementation. Linux resolution distinguishes apt, dnf, and pacman. A chosen `x64`/`arm64` value is intent only: the planner does not filter candidates against an architecture support matrix. Windows, macOS, and Linux have different runtime/service requirements; no OS is claimed to have been integration-tested.

## Architecture boundary

```text
React UI → validated Atlas config → typed capability registry
         → dependency planner → provider/OS candidate preview
         → [future authorization boundary]
         → [future native Rust runtime and platform adapters]
         → observed state, verification, structured evidence
```

The browser UI never executes shell commands. The existing checklist displays selected command references for human review, but marking an item done changes only local browser checklist progress. No frontend-only behavior is represented as successful provisioning. Windows PowerShell, CMD, WSL Bash, Conda, and container contexts must be modeled as distinct execution environments by any future provider. In particular, Windows `setx` changes future processes, not the current shell.

Execution implementation is intentionally deferred until providers can be safely validated and tested on real platform runners. It must not bypass OS policy, silently elevate privileges, expose database services, or log secrets. Docker database services require explicit local-only port/volume/security configuration and user-managed credentials.

## Research record and compatibility

Official sources, date checked, and implementation implications are in [`docs/RESEARCH.md`](docs/RESEARCH.md). The registry adopts version-selection policies rather than pinning a guessed “latest” release. Vendor compatibility changes over time; provider selection must re-check the official support matrix at execution time. As of the recorded research, Node.js production guidance favors Active/Maintenance LTS, PowerShell 7 is side-by-side with inbox Windows PowerShell, Flutter setup has OS-specific prerequisites, and Windows/Mac/Linux container or Android virtualization requirements differ. Those facts explain why registry names are not equivalent to support claims.

## Verification status

- Locally available checks: typecheck, deterministic unit tests, and static Vite build.
- Mocked: provider/executor authorization boundary and evidence generation.
- Not run: any real installation; native executable detection; Windows 11, macOS, Fedora/RHEL, Arch, or cross-platform integration tests; accessibility automation; OS-specific provider execution.
- CI runs Node checks on Ubuntu only. This is not evidence of other-OS support.

## Existing checklist

The checklist still represents historical phases 7–13: Git, VS Code, programming languages, Android, cloud/DevOps, machine learning, and databases. Some instructions remain Windows-specific and require personal judgement. Review commands and vendor documentation before manually running them. Never use checklist completion as evidence that a tool was installed or passed verification.

## Next high-value iteration

Implement and test a Rust CLI/native-runtime skeleton for configuration loading, platform fact detection, capability detection, plan serialization, authorization, and structured reports. Then deliver one narrowly scoped, non-privileged package provider per OS behind an injected provider interface, with mocks and Windows/macOS/Linux CI. Do not wire execution into the UI until authorization, cancellation, partial-failure recovery, redaction, and real installation verification are in place.

## License

Apache License 2.0. See [LICENSE](LICENSE).
