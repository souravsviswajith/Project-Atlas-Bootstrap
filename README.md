# 🚀 Project Atlas Bootstrap

> **Automate your Windows developer workstation.**
>
> Project Atlas Bootstrap is a production-quality, modular, configuration-driven Windows setup framework that provisions a fresh Windows 11 installation into a fully configured development environment with minimal manual intervention.

---

# ✨ Features

* 🖥 Windows optimization
* ⚡ Ultimate Performance configuration
* 🛠 Developer Mode configuration
* 🐧 WSL2 + Ubuntu setup
* 🐳 Docker Desktop
* ☸ Kubernetes tooling
* ☁ AWS, Azure & Google Cloud SDKs
* 📱 Flutter & Android Studio
* ☕ Java 21
* 🐍 Python + Miniconda + uv
* 🟢 Node.js (nvm)
* 📦 Git & GitHub CLI
* 🔒 Windows security configuration
* 📂 Automatic workspace creation
* 📋 Verification reports
* 📝 Detailed logging
* 🔄 Safe to rerun
* ⚙ Configuration-driven
* 🧩 Modular architecture

---

# Project Goals

Project Atlas Bootstrap aims to provide:

* Reproducible workstation provisioning
* Infrastructure-as-Code for Windows
* Consistent developer environments
* Fast onboarding
* Easy maintenance
* Extensible modules
* Enterprise-grade reliability

---

# Repository Structure

```text
Project-Atlas-Bootstrap/
│
├── Setup.ps1
├── Update.ps1
├── Verify.ps1
├── Repair.ps1
├── Cleanup.ps1
├── Uninstall.ps1
│
├── config/
│   ├── atlas.yaml
│   └── packages.yaml
│
├── scripts/
│   ├── 01-System.ps1
│   ├── 02-Debloat.ps1
│   ├── 03-Folders.ps1
│   ├── 04-WindowsFeatures.ps1
│   ├── 05-CoreApps.ps1
│   ├── 06-WSL.ps1
│   ├── 07-Git.ps1
│   ├── 08-VSCode.ps1
│   ├── 09-Languages.ps1
│   ├── 10-Android.ps1
│   ├── 11-Cloud.ps1
│   ├── 12-MachineLearning.ps1
│   ├── 13-Docker.ps1
│   ├── 14-Verification.ps1
│   └── 99-Reboot.ps1
│
├── configs/
├── docs/
├── assets/
├── logs/
└── reports/
```

---

# Installation

## Prerequisites

* Windows 11 (22H2 or newer recommended)
* Administrator privileges
* Internet connection
* Winget installed
* At least 40 GB free disk space

---

## Clone Repository

```bash
git clone https://github.com/<your-username>/Project-Atlas-Bootstrap.git
cd Project-Atlas-Bootstrap
```

---

## Allow Script Execution

Open PowerShell as Administrator.

```powershell
Set-ExecutionPolicy Bypass -Scope Process
```

---

## Start Installation

```powershell
.\Setup.ps1
```

The installer automatically:

* Verifies system requirements
* Configures Windows
* Installs software
* Applies settings
* Generates reports

---

# Installation Phases

## Phase 1 — System Preparation

* Administrator verification
* Internet connectivity
* Winget verification
* PowerShell verification
* Disk space verification
* System restore point

---

## Phase 2 — Windows Optimization

Configure:

* Ultimate Performance
* Developer Mode
* Explorer preferences
* Taskbar
* Clipboard History
* Long Paths
* Storage Sense

Disable:

* Consumer Experience
* Suggested Apps
* Welcome Experience
* Tips
* Advertising ID
* Feedback requests
* Automatic consumer apps
* Copilot
* Widgets
* Chat
* News Feed
* Bing Search
* Xbox Game Bar auto-start

---

## Phase 3 — Workspace

Creates:

```text
D:\
├── Workspace
├── Android
├── Flutter
├── Docker
├── Kubernetes
├── Datasets
├── Downloads
├── Games
├── Scripts
├── Backups
└── ISO
```

---

## Phase 4 — Windows Features

Enable:

* WSL2
* Hyper-V
* Virtual Machine Platform
* Windows Hypervisor Platform
* Developer Mode

---

## Phase 5 — Core Applications

Installs:

* PowerShell 7
* Windows Terminal
* Git
* GitHub CLI
* VS Code
* PowerToys
* Everything
* 7-Zip
* VLC
* Notepad++
* Obsidian

---

## Phase 6 — WSL

Installs:

* Ubuntu

Configures:

* Default user
* Package updates
* Common utilities

---

## Phase 7 — Git

Configures:

* Username
* Email
* SSH keys
* GitHub authentication
* Git Credential Manager
* Git LFS
* Default branch
* Useful aliases

---

## Phase 8 — VS Code

Configures:

* Settings Sync
* Auto Save
* Format on Save
* Default Formatter
* Integrated Terminal
* UTF-8
* Git settings

> **Extensions are intentionally not installed automatically.**

---

## Phase 9 — Programming Languages

Installs:

### Python

* Python
* Miniconda
* uv
* JupyterLab

### Java

* JDK 21 LTS

### Node.js

* nvm-windows
* Latest LTS
* npm
* pnpm
* Yarn

### Flutter

* Flutter SDK
* Dart SDK

### Go

* Latest stable release

---

## Phase 10 — Android Development

Installs:

* Android Studio

Moves:

* SDK → `D:\Android\SDK`
* AVDs → `D:\Android\AVD`

Runs:

```text
flutter doctor
```

Automatically fixes common configuration issues where possible.

---

## Phase 11 — Cloud & DevOps

Installs:

* AWS CLI
* AWS SAM CLI
* AWS CDK
* Azure CLI
* Google Cloud CLI
* Terraform
* kubectl
* Helm
* kind
* k9s

Verifies every tool after installation.

---

## Phase 12 — Machine Learning

Installs:

* Miniconda
* JupyterLab

Creates isolated Conda environments:

* tensorflow
* pytorch
* opencv
* llm

CUDA Toolkit is installed only when:

* An NVIDIA GPU is detected
* CUDA installation is enabled in the configuration

---

## Phase 13 — Docker Services

Installs:

* Docker Desktop

Provides ready-to-use Docker Compose stacks for:

* PostgreSQL
* MySQL
* MongoDB
* Redis

No database servers are installed directly on Windows.

---

## Phase 14 — Verification

Runs verification for every installed component.

Generates:

* HTML report
* JSON report

---

# Configuration

Project Atlas is fully configuration-driven.

All options are stored in:

```text
config/atlas.yaml
```

Example:

```yaml
windows:
  optimize: true
  developerMode: true

languages:
  python: true
  java: true
  flutter: true

cloud:
  aws: true
  azure: true
  gcp: true

docker:
  enabled: true

machineLearning:
  cuda: auto
```

---

# Logs

Installer logs are stored in:

```text
logs/
```

Reports are generated in:

```text
reports/
```

---

# Updating

```powershell
.\Update.ps1
```

---

# Verification

```powershell
.\Verify.ps1
```

---

# Repair

```powershell
.\Repair.ps1
```

---

# Cleanup

```powershell
.\Cleanup.ps1
```

---

# Uninstall

```powershell
.\Uninstall.ps1
```

---

# Design Principles

* Modular
* Idempotent
* Configuration-driven
* Safe to rerun
* Enterprise-ready
* Open-source friendly
* Easy to maintain
* Well documented

---

# Contributing

Contributions are welcome.

Please:

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Submit a Pull Request.

---

# Roadmap

Future plans include:

* Atlas CLI (`atlas install`, `atlas update`, `atlas verify`)
* GUI dashboard
* Plugin system
* Package profiles
* Offline installer
* Chocolatey/Scoop support
* CI/CD validation
* Automated testing
* Cross-machine synchronization

---

# License

Choose an open-source license that fits your goals (MIT, Apache 2.0, or GPL).

---

# Disclaimer

Project Atlas Bootstrap modifies Windows configuration, installs software, and changes system settings. Review the configuration before running it in production environments. While the project is designed to be safe and idempotent, you should always maintain backups of important data before provisioning or modifying a system.
