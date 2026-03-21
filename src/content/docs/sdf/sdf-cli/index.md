---
title: "@etapsky/sdf-cli"
description: "Command-line tool for working with SDF files. Inspect, validate, sign, wrap, convert, and manage schemas."
sidebar:
  label: "Overview"
  order: 1
---

`@etapsky/sdf-cli` is the official command-line tool for working with Smart Document Format files. Use it to inspect documents, validate structure, sign and verify authenticity, convert data to `.sdf`, and interact with the schema registry.

**Version:** `0.3.0` &nbsp;·&nbsp; **License:** MIT

## Installation

### npm (global)

```bash title="Terminal"
npm install -g @etapsky/sdf-cli
```

### Homebrew (macOS / Linux)

```bash title="Terminal"
brew tap etapsky/tap
brew install sdf-cli
```

### Direct binary download

Pre-compiled binaries are available on [GitHub Releases](https://github.com/etapsky/sdf/releases) for four platforms:

| Platform | Architecture | Binary |
|----------|-------------|--------|
| macOS | Apple Silicon (arm64) | `sdf-macos-arm64` |
| macOS | Intel (x64) | `sdf-macos-x64` |
| Linux | x64 | `sdf-linux-x64` |
| Linux | arm64 | `sdf-linux-arm64` |

```bash title="Terminal — macOS arm64 example"
curl -L https://github.com/etapsky/sdf/releases/latest/download/sdf-macos-arm64 -o /usr/local/bin/sdf
chmod +x /usr/local/bin/sdf
```

### Bun (project-local)

```bash title="Terminal"
bun add -d @etapsky/sdf-cli
bunx sdf --help
```

## Verify installation

```bash title="Terminal"
sdf --version
# @etapsky/sdf-cli 0.3.0
```

## Commands

| Command | Description |
|---------|-------------|
| [`sdf inspect`](/sdf/sdf-cli/inspect) | Print a full inspection report — meta, schema summary, data tree, and layer sizes |
| [`sdf validate`](/sdf/sdf-cli/validate) | Validate an SDF file. Exits 0 on success, 1 on failure. CI-friendly. |
| [`sdf sign`](/sdf/sdf-cli/sign) | Digitally sign an SDF file using ECDSA P-256 or RSA-2048 |
| [`sdf verify`](/sdf/sdf-cli/verify) | Verify the digital signature of a signed SDF file |
| [`sdf keygen`](/sdf/sdf-cli/keygen) | Generate an ECDSA P-256 or RSA-2048 key pair |
| [`sdf wrap`](/sdf/sdf-cli/wrap) | Wrap an existing PDF into an SDF container |
| [`sdf convert`](/sdf/sdf-cli/convert) | Convert data.json + schema.json into a `.sdf` file with auto-generated PDF |
| [`sdf schema`](/sdf/sdf-cli/schema) | Schema registry operations — list, diff, validate |

## Global flags

These flags are accepted by all commands:

| Flag | Description |
|------|-------------|
| `--json` | Output results as JSON instead of formatted text. Useful for scripting and piping to `jq`. |
| `--no-color` | Disable ANSI color output. Automatically set when stdout is not a TTY. |
| `--help`, `-h` | Print help for the current command and exit. |
| `--version`, `-v` | Print the CLI version and exit. |

## Quick start

```bash title="Terminal"
# Inspect an SDF file
sdf inspect invoice.sdf

# Validate for CI
sdf validate invoice.sdf && echo "Valid"

# Generate a key pair
sdf keygen --algorithm ECDSA-P256 --out keys/

# Sign a document
sdf sign invoice.sdf --key keys/private.pem --out invoice-signed.sdf

# Verify the signature
sdf verify invoice-signed.sdf --key keys/public.pem

# Convert JSON data to SDF
sdf convert data.json schema.json \
  --output invoice.sdf \
  --issuer "Acme GmbH" \
  --type invoice

# Wrap an existing PDF
sdf wrap invoice.pdf \
  --data data.json \
  --schema schema.json \
  --output invoice.sdf
```
