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

## Prerequisites

Packaging requires Electron Builder dependencies for the target platform. The app starts the embedded opencode server locally and loads the Zingpop web workbench inside the native shell.
