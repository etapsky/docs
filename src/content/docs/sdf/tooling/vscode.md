---
title: "VS Code Extension"
description: "The official SDF extension for Visual Studio Code — inspect, validate, and preview .sdf files."
sidebar:
  label: "VS Code"
  order: 1
---

The **SDF** extension by Etapsky brings first-class `.sdf` file support to Visual Studio Code.

## Installation

**From the marketplace:** Open the Extensions panel (`Ctrl+Shift+X` / `Cmd+Shift+X`), search for **SDF Etapsky**, and click Install.

**From the CLI:**

```bash
code --install-extension etapsky.sdf-vscode
```

## Commands

Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and type **SDF** to see all available commands.

| Command | Description |
|---------|-------------|
| `SDF: Inspect` | Open an inspection panel showing `meta.json`, `data.json`, `schema.json`, and signature status for the active `.sdf` file |
| `SDF: Validate` | Validate the active `.sdf` file and display results in the Output panel |
| `SDF: Preview PDF` | Open the visual layer (`visual.pdf`) in VS Code's built-in PDF viewer |

## Features

### Syntax highlighting

`.sdf` files open with syntax highlighting for the embedded JSON layers. The extension registers the `.sdf` file association automatically — no manual language mode selection required.

### Schema hover

Hover over any field in `data.json` to see its JSON Schema description, type, and constraints from the bundled `schema.json`.

### Inline validation

The extension runs validation in the background as you work. Schema violations appear as **red underlines** on the offending fields in `data.json`. Hover over an underlined field to see the violation message, which matches the SDF error code from the validator.

### Tree view sidebar

A dedicated **SDF** panel in the Activity Bar shows a tree view of the open `.sdf` archive:

```
invoice.sdf
├── meta.json          ← document_id, document_type, sdf_version
├── data.json          ← invoice_number, issuer, recipient, totals
├── schema.json        ← validation rules
├── visual.pdf         ← visual layer
└── signature.sig  ✓  ← signature present and valid
```

## Requirements

- Visual Studio Code 1.85 or later
- The `sdf-cli` binary is optional but recommended. If installed, the extension delegates validation to `sdf validate` for consistent results with CI.

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `sdf.cliPath` | `sdf` | Path to the `sdf` binary. Set this if `sdf` is not on your `PATH`. |
| `sdf.validateOnSave` | `true` | Run validation automatically when you save a `.sdf` file. |
| `sdf.showTreeView` | `true` | Show the SDF sidebar panel. |

Configure these in VS Code settings (`Ctrl+,` / `Cmd+,`), under the **SDF** section.
