# Atlas Compatibility Engine

**Status:** Partially implemented; remaining work is tracked below  
**Parent contract:** Portable Runtime  
**Last reviewed:** 2026-11-21

## 1. Objective

The compatibility engine determines whether a selected set of packages, SDKs, languages, runtimes, and workspace requirements can coexist on one explicit target.

It must resolve the complete selection before installation begins. It must not install a partial selection merely because individual packages appear installable.

The existing planner's dependency traversal and cycle detection are useful foundations. They do not constitute a complete package solver.

## Current implementation boundary

The current branch now includes a deterministic constraint evaluator for declared capability metadata:

- Numeric semantic-version comparisons, conjunctions, caret ranges, tilde ranges, and prerelease ordering.
- Explicit capability conflict declarations.
- Capability metadata is expressed through optional `conflicts`, SemVer-only `dependencyConstraints`, and `supportedArchitectures` fields. Registry integrity checks validate references and range satisfiability.
- Dependency version constraints and detection of incompatible intersections.
- Architecture restrictions when a capability explicitly declares them.
- Structured error and warning diagnostics surfaced in the plan preview.
- Plans containing hard compatibility errors are blocked from authorization. Unresolved dependency versions also block authorization even though they are displayed as warnings, because the planner cannot safely invent a candidate version.

The current range evaluator is deliberately limited to SemVer-style numeric versions. Python/PEP 440, Debian, RPM, Maven, Conda, and other ecosystem version schemes must be handled by their ecosystem adapters; do not feed those versions into the SemVer evaluator.

This is not yet a complete package resolver. The existing catalogue does not provide authoritative version candidate sets, per-version architecture/ABI matrices, or verified provider availability. When a dependency constraint exists but no exact dependency version is pinned, Atlas emits a warning rather than pretending it has resolved a candidate. Provider mappings remain candidate metadata and no package manager is invoked.


## 2. Separate catalogue facts from executable providers

A catalogue entry describes a capability. A provider is a verified implementation that can perform a specific operation for that capability on a specific target.

Do not infer provider availability from a catalogue entry or a candidate provider mapping.

A capability record should carry, at minimum:

- Stable capability ID and display name
- Capability kind: language, compiler, runtime, SDK, package, service, tool, or workspace component
- Supported version expressions and release channels
- Supported OS and distribution constraints
- Supported CPU architectures
- ABI and runtime constraints where relevant
- Dependencies and optional dependencies
- Conflicts and mutually exclusive alternatives
- provides and replaces relationships where applicable
- Required privileges and reboot/service side effects
- License identifier and source provenance
- Provider references, each with its own verified support matrix
- Verification strategy and expected postconditions

Unknown support is not equivalent to supported.

## 3. Compatibility dimensions

The solver evaluates the following dimensions together:

1. Operating system and version
2. Distribution and distribution version
3. CPU architecture
4. ABI and binary format
5. Runtime prerequisites
6. Requested package version and release channel
7. Dependency constraints
8. Explicit conflicts and replacement rules
9. Existing observed installations
10. Provider capability and provider version
11. Privilege and system-feature prerequisites
12. Workspace isolation and environment constraints

A package can be valid on an OS but invalid for the selected architecture or ABI. A package can be installable by a provider but incompatible with another selected package. The engine must preserve these distinctions in diagnostics.

## 4. Solver architecture

Use a global compatibility orchestrator with ecosystem-specific resolution adapters.

The global layer owns target facts and policy, cross-ecosystem capability relationships, global conflicts and shared-runtime constraints, the final combined plan, and deterministic diagnostics.

Ecosystem adapters own the rules of their package ecosystems and delegate to upstream solvers when practical. Examples include native OS package managers, Conda, npm, Cargo, and Python environment tooling.

Do not create one home-grown version solver that attempts to replace every ecosystem's semantics. Do not shell out to package managers during preview unless their documented operation is explicitly read-only and its effects are understood.

Candidate solver libraries may be evaluated in focused spikes. No library is selected by this contract.

## 5. Resolution algorithm

1. Normalize user selections into capability constraints.
2. Load and validate the target's observed facts.
3. Reject unsupported or unknown target/package combinations.
4. Expand required dependencies and preserve optional dependencies as explicit choices.
5. Query ecosystem adapters for candidate versions and provider plans.
6. Apply version, architecture, ABI, runtime, and distribution constraints.
7. Apply explicit conflicts, replacement rules, and singleton constraints.
8. Reconcile cross-ecosystem shared requirements.
9. Detect unsatisfied constraints and dependency cycles.
10. Produce a deterministic solution or a structured conflict report.
11. Generate a plan with exact package versions, providers, sources, and actions.
12. Require a separate authorization and execution phase.

The solver must not silently remove a user-selected top-level package to make the remainder solvable. It should report the minimal actionable conflict set where feasible and ask the user to change the selection.

## 6. Version semantics

Version constraints are ecosystem-specific. Do not compare versions as arbitrary strings.

The adapter must declare the version scheme it uses and normalize candidate versions without losing upstream semantics. Where a package uses calendar versions, epochs, build metadata, prerelease identifiers, or distribution revisions, preserve those fields.

A floating channel such as latest, stable, or lts must resolve to a concrete version before a lockfile is written. Record the channel and the resolved version.

## 7. Lockfile and reproducibility

A generated lockfile must record schema version, Atlas version, target fingerprint and target identity, requested top-level capabilities, exact resolved package identities and versions, provider and provider version, source repository or artifact URL, artifact digest and signature/provenance data where available, dependency edges, relevant environment variables excluding secrets, resolution timestamp and solver metadata, and user-selected policy and optional-feature decisions.

Do not store credentials, tokens, private keys, or secret environment values in the lockfile.

Lockfile replay must fail with a clear diagnostic when the target or required artifact is incompatible. It must not silently re-resolve to newer versions unless the user explicitly requests an update.

## 8. Conflict report

Every failed resolution must return structured diagnostics, not just a generic error.

A conflict should identify the affected selected capabilities, incompatible constraints, source of each constraint, whether the conflict is hard or policy-based, a safe remediation if known, and whether the conflict can be resolved by changing version, provider, target, or optional-feature selection.

## 9. Required tests

- Dependency cycle detection
- Missing dependency
- Conflicting version ranges
- Architecture mismatch
- OS and distribution mismatch
- ABI/runtime mismatch
- Explicit package conflict
- Replacement/provides behavior
- Optional dependency selection
- Multiple ecosystems with a shared runtime constraint
- Floating channel resolved to a pinned version
- Lockfile deterministic replay
- Lockfile target mismatch
- Provider unavailable or unverified
- Unsupported target fails closed
- No mutation occurs during resolution

## 10. Non-goals

- Replacing every upstream package manager
- Guessing package versions or download URLs
- Installing packages during planning
- Treating a successful plan as proof of installation
- Silently changing user selections to force a solution
