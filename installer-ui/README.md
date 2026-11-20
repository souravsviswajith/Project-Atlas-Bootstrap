# Atlas static installer UI prototype

This directory contains the first plain HTML/CSS/vanilla JavaScript interface prototype for the Atlas native setup workflow.

## Run locally

Open `index.html` in a modern browser, or serve this directory with any static HTTP server. The eventual native bootstrap will serve these files from a loopback-only localhost endpoint and open the browser only after its privilege and hardware checks succeed.

No Node.js, React, Vite, Tailwind, CDN, or remote asset is required by this UI.

## Current behavior

- Navigate between Overview, Hardware, Software Catalogue, Technology Stacks, Checklist, Review & Install, and Documentation.
- Select individual catalogue items.
- Add editable technology-stack presets.
- Search and filter the catalogue.
- Preview the selected software list.
- Choose Windows, Linux, macOS, or WSL target metadata.

## Explicit limitations

This is a frontend prototype, not a working installer.

- Hardware values are not detected or fabricated.
- Administrator/root privileges are not checked by the browser.
- No package manager or native provider is invoked.
- The installation button is intentionally disabled.
- Checklist toggles are local UI state and are not evidence of successful machine checks.
- The UI does not start a localhost service or elevate privileges.

The native bootstrap and local execution service must be implemented separately. They must enforce privilege checks, bind only to loopback, validate every request, and require explicit user approval before executing allowlisted operations.

## Design reference

The layout takes general dashboard UI conventions from [Tabler](https://github.com/tabler/tabler). No Tabler source files or third-party plugins are bundled in this prototype. The interface assets here are original project code.
