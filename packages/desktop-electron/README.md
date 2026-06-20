# Zingpop Desktop

Zingpop desktop app, built with Electron around the existing web workbench and embedded opencode server.

## Development

From the repo root:

```bash
bun install
bun --cwd packages/desktop-electron dev
```

## Build

To create a production renderer/main build:

```bash
bun --cwd packages/desktop-electron build
```

To create a Windows installer:

```bash
bun --cwd packages/desktop-electron package:win:prod
```

To smoke-test the built desktop app five times with isolated user data:

```bash
bun --cwd packages/desktop-electron smoke:5
```

## Release

Before calling the desktop app a formal Windows release, run:

```bash
bun scripts/verify-zingpop-desktop-release.mjs --require-github-secrets
```

The formal release path is GitHub Actions only: merge the desktop release PR to `main`, configure Azure Trusted
Signing secrets in GitHub, then run `Zingpop Desktop Release`. A local Windows build can prove packaging behavior, but
it is not a formal release because it is unsigned and does not publish update metadata.

## Prerequisites

Packaging requires Electron Builder dependencies for the target platform. The app starts the embedded opencode server locally and loads the Zingpop web workbench inside the native shell.
