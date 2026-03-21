---
title: "Installation"
description: "Install @etapsky/sdf-kit, sdf-cli, and the Python SDK on all supported platforms."
sidebar:
  label: "Installation"
  order: 2
---

This page covers all installation methods for the SDF toolchain: the JavaScript/TypeScript library (`@etapsky/sdf-kit`), the command-line tool (`sdf-cli`), and the Python SDK (`etapsky-sdf`).

## sdf-kit (JavaScript / TypeScript)

`@etapsky/sdf-kit` is the core library for producing and consuming `.sdf` files programmatically. Install it as a project dependency:

```bash
npm install @etapsky/sdf-kit
```

The package ships with full TypeScript type declarations. No additional `@types/` package is needed.

For Bun projects:

```bash
bun add @etapsky/sdf-kit
```

`sdf-kit` works in both Node.js and modern browsers. The browser build uses the Web Crypto API for signing operations and the File/Blob APIs for ZIP handling. No Node.js built-ins are required in the browser entry point.

## sdf-cli

`sdf-cli` is the command-line tool for inspecting, validating, signing, and converting `.sdf` files. Four installation methods are available.

### npm (global install)

```bash
npm install -g @etapsky/sdf-cli
```

After installation, the `sdf` command is available globally:

```bash
sdf --version
sdf inspect invoice.sdf
sdf validate invoice.sdf
```

### npx (no installation required)

Run any `sdf-cli` command without a global install:

```bash
npx @etapsky/sdf-cli inspect invoice.sdf
npx @etapsky/sdf-cli validate invoice.sdf
```

This is the recommended approach for CI environments and one-off use. The package is cached locally by npm after the first run.

### Homebrew (macOS and Linux)

```bash
brew install etapsky/tap/sdf
```

After installation, the `sdf` command is available system-wide. Homebrew manages updates:

```bash
brew upgrade etapsky/tap/sdf
```

### Binary download

Pre-built binaries are available on [GitHub Releases](https://github.com/etapsky/sdf/releases) for four platforms:

| Platform | Architecture | Filename |
|---|---|---|
| macOS | arm64 (Apple Silicon) | `sdf-macos-arm64` |
| macOS | x64 (Intel) | `sdf-macos-x64` |
| Linux | x64 | `sdf-linux-x64` |
| Linux | arm64 | `sdf-linux-arm64` |

Download the binary for your platform, make it executable, and move it to a directory on your `PATH`:

```bash
# Example: macOS arm64
curl -Lo sdf https://github.com/etapsky/sdf/releases/latest/download/sdf-macos-arm64
chmod +x sdf
sudo mv sdf /usr/local/bin/sdf
```

Binaries have no runtime dependencies — no Node.js installation required.

## Python SDK

```bash
pip install etapsky-sdf
```

For virtual environment use (recommended):

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install etapsky-sdf
```

The Python SDK depends on `cryptography`, `jsonschema`, and `reportlab`. These are installed automatically by pip.

## Supported Environments

| Environment | sdf-kit | sdf-cli | Python SDK |
|---|---|---|---|
| Node.js 20 LTS | Yes | Yes | — |
| Node.js 22 LTS | Yes | Yes | — |
| Browser (modern) | Yes | — | — |
| Bun 1.3+ | Yes | Yes (binary) | — |
| Python 3.11+ | — | — | Yes |
| macOS arm64 | Yes | Yes | Yes |
| macOS x64 | Yes | Yes | Yes |
| Linux x64 | Yes | Yes | Yes |
| Linux arm64 | Yes | Yes | Yes |

:::note
Windows is supported via the binary distribution for sdf-cli and via Python SDK on Python 3.11+. Native Windows binary downloads (`sdf-windows-x64.exe`) are available on GitHub Releases.
:::

## Verify Installation

After installing, verify each component works correctly.

**sdf-kit** — run this in a Node.js REPL or script:

```typescript
import { buildSDF } from '@etapsky/sdf-kit/producer';
console.log(typeof buildSDF); // 'function'
```

**sdf-cli:**

```bash
sdf --version
# @etapsky/sdf-cli/0.3.0 darwin-arm64 node-v22.x.x
```

**Python SDK:**

```bash
python -c "import sdf; print(sdf.__version__)"
# 0.1.1
```

## Next Steps

- [Quickstart](/sdf/getting-started/quickstart/) — Produce your first `.sdf` file
- [Core Concepts](/sdf/getting-started/concepts/) — Understand the format architecture
- [sdf-kit Reference](/sdf/sdf-kit/) — Full producer, reader, validator, and signer API
- [sdf-cli Reference](/sdf/sdf-cli/) — All CLI commands: inspect, validate, sign, verify, keygen, wrap, convert, schema
