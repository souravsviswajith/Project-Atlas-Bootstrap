# 🚀 Project Atlas Bootstrap

> **Set up a developer workstation without having to figure everything out from scratch.**

Project Atlas is a guided workspace setup project. It helps you choose the developer tools you need, see a setup plan, and work through a checklist.

The long-term goal is to make setting up a new computer easier and more consistent on **Windows, macOS, and Linux**.

## ⚠️ Read this first: what works today?

The project is still being built. The current version is a web-based checklist and setup-plan preview.

| You can do this today | Not available yet |
| --- | --- |
| Open the Atlas web app | Automatically install software |
| Browse the developer setup checklist | Automatically detect everything on your computer |
| Mark checklist items as complete | Automatically fix system problems |
| Keep checklist progress in your browser | Run a native Atlas installer |
| Create and preview a setup plan | Apply the plan to Windows, macOS, or Linux |
| Review the example setup configuration | Import a YAML file through the app |

**Important:** Atlas does not currently install, remove, or change software on your computer. A plan is a preview of what a future installer could do. A checked box only means that you marked a task as complete; it does not prove that the software is installed.

The PowerShell installer commands and folder layout described in some older project material are part of the original plan. They are not available as working installer scripts in this repository yet.

---

## 🌟 What is Atlas for?

Setting up a development computer can take hours. You may need to install programming languages, editors, cloud tools, containers, mobile development tools, and databases.

Atlas is intended to put those tasks in one organized place.

The project covers:

- **Programming:** Python, Java, JavaScript, TypeScript, C/C++, Rust, Go, Kotlin, Dart and Flutter.
- **Editors and everyday tools:** Git, GitHub CLI, Visual Studio Code and terminal tools.
- **Cloud and DevOps:** AWS CLI, Google Cloud CLI, Azure CLI, Docker, Kubernetes tools and Terraform.
- **Mobile development:** Android Studio and Android SDK tools.
- **Data and databases:** Python data tools, database clients and optional local database services.
- **Machine learning:** Python environments and tools used for machine-learning development.

The list is a catalogue of tools Atlas is being prepared to support. It does not mean that Atlas can install every item today.

## 🖥️ Try Atlas on your computer

You need:

- A computer running Windows, macOS, or Linux.
- An internet connection.
- **Node.js 22.12 or newer.**
- Git, to download the project.
- A terminal. You do not need administrator access just to run the current web app.

### Step 1 — Install Node.js

If Node.js is not already installed:

1. Open the official [Node.js website](https://nodejs.org/).
2. Download the current **LTS** version.
3. Run the installer and follow its instructions.
4. Close and reopen your terminal.

Check that it is installed:

```bash
node --version
npm --version
```

You should see version numbers. If the terminal says that `node` or `npm` cannot be found, reopen the terminal or check the Node.js installation.

### Step 2 — Download Atlas

Open a terminal and run:

```bash
git clone https://github.com/souravsviswajith/Project-Atlas-Bootstrap.git
cd Project-Atlas-Bootstrap
```

This downloads the project and moves your terminal into its folder.

### Step 3 — Install the project dependencies

Run:

```bash
npm ci
```

Wait for it to finish. This downloads the libraries needed to run Atlas.

If this step fails, check your internet connection and confirm that you are inside the `Project-Atlas-Bootstrap` folder.

### Step 4 — Start Atlas

Run:

```bash
npm run dev
```

The terminal will show a local web address, usually:

```text
http://localhost:5173/
```

Open that address in your browser.

**Keep the terminal window open while you use Atlas.** Closing it stops the local development server.

### Step 5 — Stop Atlas

When you are finished, return to the terminal and press:

```text
Ctrl + C
```

That stops the local server. It does not uninstall anything from your computer.

---

## 📋 Using the checklist

The checklist is a guide to the work involved in preparing a development computer.

1. Open a phase.
2. Read what the task is asking you to do.
3. Follow the linked official instructions where provided.
4. Complete the task on your computer yourself.
5. Mark the task as complete in Atlas when you have finished it.

Your checklist progress is saved in your browser.

**A reminder:** Atlas does not check your computer when you tick a box. Only mark a task complete after you have actually done it and, where appropriate, checked that it works.

Some checklist instructions were originally written for Windows. Read the instructions carefully before using them on macOS or Linux.

## 🧭 What does the setup-plan preview do?

Atlas also contains a catalogue of developer tools and their relationships.

You can use it to describe the computer you want to prepare and the tools you want on it. Atlas then creates a preview showing which requested tools have a candidate setup method and which ones need attention.

Think of it as a shopping list and preparation plan — **not an installer**.

The preview may show that an item is:

- **Planned:** Atlas has included it in the proposed plan.
- **Unavailable:** Atlas does not currently have a suitable setup option for the selected target.
- **Blocked:** Something required by that item is missing or cannot be planned.

These labels describe the preview only. They do not mean that Atlas has checked or changed your computer.

### Example configuration

The repository includes an example file at [config/atlas.example.yaml](config/atlas.example.yaml).

It shows how a setup request can be written down:

```yaml
schemaVersion: 1

target:
  os: windows
  arch: x64

capabilities:
  - id: python.cpython
    version: "3.12"
    optional: false
  - id: javascript.node
    version: lts
    optional: false
  - id: editor.vscode
    optional: true

policy:
  mode: preview
  requireAuthorization: true

verification:
  required: true

reporting:
  format: json
```

In plain English, this example describes a 64-bit Windows computer and requests Python, Node.js and optionally Visual Studio Code.

You do not need to edit this file just to start the current web app. File import and a native command-line installer are not available yet.

---

## 🛠️ Useful commands

Run these commands from the project folder.

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts Atlas on your computer. |
| `npm run typecheck` | Checks the TypeScript code for type errors. |
| `npm test` | Runs the automated tests. |
| `npm run build` | Builds the web app for release. |
| `npm run preview` | Opens a local preview of the built web app. |

To check the project before submitting a change, run:

```bash
npm run typecheck
npm test
npm run build
```

If all three commands finish successfully, the available code checks and production build have passed on your machine.

## 📁 Where things are

You do not need to understand the source code to use Atlas. These are the main places you may see in the repository:

| Folder or file | What it is for |
| --- | --- |
| `src/` | The web application. |
| `src/data/phases.ts` | The checklist tasks and phases. |
| `src/components/` | Reusable parts of the screen. |
| `src/hooks/` | Shared application behaviour, including checklist progress. |
| `config/` | Example setup configuration and its validation rules. |
| `docs/` | Additional project notes and research. |
| `package.json` | Project commands and required libraries. |

## 🔒 Safety

Atlas is designed around a simple rule: **show the user what is planned before anything is allowed to change the computer.**

The current web app is preview-only:

- It does not run installation commands.
- It does not change Windows, macOS, or Linux settings.
- It does not install or remove packages.
- It does not start database services.
- It does not verify that software is installed on the host.

Never copy and run a command just because it appears in a checklist. Read it first and check the official documentation, especially if it asks for administrator access, changes security settings, deletes files, or opens a network port.

## 🗺️ Project roadmap

The work is being developed in stages:

1. **Guided checklist** — organize the setup tasks and make them easy to follow.
2. **Setup planning** — describe the computer and tools you want, then preview the plan.
3. **Computer checks** — safely identify the operating system and tools already installed.
4. **Native setup engine** — add a separate program that can perform approved setup tasks.
5. **Verification and reports** — check the results and explain what succeeded or needs attention.
6. **Cross-platform support** — test and support Windows, macOS and Linux properly.

These are project goals, not promises that every stage is already complete. The current implementation status is described at the top of this page.

## 🤝 Contributing

Contributions are welcome.

1. Fork this repository.
2. Create a branch for your change.
3. Make and test your changes.
4. Open a pull request and explain what you changed.

Please keep the documentation understandable to someone who is new to the project. Explain unfamiliar terms when they are first used.

## 📄 License

Project Atlas Bootstrap is licensed under the [Apache License 2.0](LICENSE).

## ❗ Disclaimer

The current web app is a checklist and planning preview. It is not a system installer.

When future versions gain the ability to change a computer, users must be shown what will happen and asked for permission before those changes are made. Always keep backups of important files before making major changes to a development machine.
