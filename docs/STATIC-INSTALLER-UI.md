# Static installer UI and native bootstrap boundary

## Decision

The target-machine interface is a static HTML/CSS frontend with small vanilla JavaScript interactions. It must not require Node.js, React, Vite, a CDN, or an internet connection to render.

The setup launcher is responsible for native startup. It must validate administrator/root privileges before hardware inspection, service startup, or browser launch. If privileges are absent or elevation is cancelled, it must print an actionable message, return a non-zero exit status, and stop.

## Startup sequence

1. User launches the platform-specific setup entry point.
2. Native bootstrap detects platform and checks required administrator/root privileges.
3. If authorization is missing, bootstrap exits without starting a local service or browser.
4. Bootstrap performs hardware and OS inspection.
5. Bootstrap starts the local service on loopback only.
6. Bootstrap waits for a health-ready response.
7. Bootstrap opens the browser at the selected localhost URL.
8. User reviews documentation, selects software/stacks, and reviews the plan.
9. A future execution service validates approval and invokes allowlisted native operations.
10. Results are verified and reported.

## Frontend/native boundary

The browser must never be treated as a privileged execution environment. It communicates with a narrowly scoped local API. The service must validate origin/host, use a per-session capability or equivalent anti-CSRF mechanism, reject arbitrary command strings, and expose only typed operations.

The browser must not be able to request arbitrary PowerShell, Bash, or shell execution. Installation commands are generated from trusted provider metadata and validated server-side.

## Current implementation status

The `installer-ui/` directory is a static prototype only. It demonstrates navigation, selection, stack presets, filtering, target metadata and a review screen. It does not perform hardware inspection, privilege checks, package installation, or localhost service startup.

The existing React/Vite application remains the current planner/checklist prototype. This static UI is isolated so the existing application is not disrupted during the transition.

## Design reference

[Tabler](https://github.com/tabler/tabler) is used as a general dashboard layout reference. Its repository is MIT-licensed. This prototype does not copy or bundle Tabler code, stylesheets, icons, or plugins.
