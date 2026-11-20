# Platform targets

Atlas distinguishes the operating system where commands execute from the host that contains that environment.

## Native targets

Existing configurations remain valid. If `target.environment` is omitted, Atlas treats the target as native.

```yaml
schemaVersion: 1
target:
  os: linux
  distro: ubuntu
  arch: x64
capabilities:
  - id: git.git
```

## Windows Subsystem for Linux

For WSL, `target.os` describes the Linux guest where tools execute. The Windows host and WSL generation are explicit fields; the Linux distribution remains required.

```yaml
schemaVersion: 1
target:
  os: linux
  distro: ubuntu
  arch: x64
  environment: wsl
  hostOS: windows
  wslVersion: 2
capabilities:
  - id: git.git
```

Supported WSL versions in the configuration contract are `1` and `2`. This is a declarative target only: Atlas does not detect local WSL installations, inspect distro instances, install packages, or modify Windows/WSL settings. Provider selection uses the Linux guest distribution. Windows host integration is not inferred.

The capability registry is shared across native Linux and WSL. Provider selection follows the execution OS, not the host OS.
