---
title: "sdf wrap"
description: "Wrap an existing PDF file into an SDF container, optionally attaching data.json and schema.json."
sidebar:
  label: "wrap"
  order: 7
---

`sdf wrap` takes an existing PDF file and packages it into an `.sdf` container. You can optionally attach a `data.json` and `schema.json` to the archive, turning a standalone PDF into a fully structured SDF document.

## Usage

```bash title="Terminal"
sdf wrap <pdf-file> [flags]
```

## Flags

| Flag | Description | Required |
|------|-------------|----------|
| `--data <path>` | Path to the `data.json` file | No |
| `--schema <path>` | Path to the `schema.json` file | No |
| `--output <path>`, `-o` | Output `.sdf` file path. Defaults to `<pdf-name>.sdf` | No |
| `--issuer <name>` | Issuer name, written to `meta.json` | No |
| `--issuer-id <id>` | Issuer identifier (e.g. tax ID) | No |
| `--type <type>` | Document type (e.g. `invoice`, `contract`) | No |
| `--recipient <name>` | Recipient name | No |
| `--locale <tag>` | BCP 47 locale tag (e.g. `en-US`) | No |
| `--no-color` | Disable ANSI color output | No |
| `--help` | Print help and exit | No |

## When to use `wrap` vs `convert`

| Command | Starting point | PDF handling |
|---------|---------------|-------------|
| `sdf wrap` | You already have a PDF | Embeds your existing PDF as `visual.pdf` exactly as-is |
| `sdf convert` | You have `data.json` + schema | Auto-generates a PDF from your data |

Use `wrap` when:
- You have an existing PDF produced by another system (e.g. an ERP export, a legacy invoicing tool, or a legally-required template)
- You want to attach machine-readable data to that existing document
- The visual representation must remain byte-for-byte identical to the original

Use `convert` when:
- You are generating new documents programmatically
- You want `sdf-kit` to produce the PDF layer from your data

## Example — full wrap with data and schema

```bash title="Terminal"
sdf wrap invoice.pdf \
  --data data.json \
  --schema schema.json \
  --output invoice.sdf \
  --issuer "Acme Supplies GmbH" \
  --issuer-id "DE123456789" \
  --type invoice \
  --locale en-US
```

```
  SDF — Smart Document Format  @etapsky/sdf-cli 0.3.0
────────────────────────────────────────────────────────────
  wrap  invoice.pdf
────────────────────────────────────────────────────────────

  PDF        invoice.pdf  (248 KB)
  Data       data.json    (4 KB)
  Schema     schema.json  (6 KB)
  Issuer     Acme Supplies GmbH

  ✓ data conforms to schema
  ✓ meta assembled  (document_id: f47ac10b-58cc-4372-a567-0e02b2c3d479)
  ✓ container packed

  Output  invoice.sdf  (259 KB)
```

## Example — PDF only (no data)

You can wrap a PDF without attaching structured data. This produces a minimal SDF archive with an empty `data.json` and a permissive `schema.json`. The resulting file is valid SDF but provides no machine-readable layer.

```bash title="Terminal"
sdf wrap invoice.pdf --output invoice.sdf --issuer "Acme GmbH" --type invoice
```

:::note
Wrapping without `--data` and `--schema` creates a structurally valid `.sdf` file, but consuming systems that require the data layer will not find any business data. Provide `--data` and `--schema` whenever possible.
:::

## PDF requirements

The input PDF:
- MUST be a valid PDF file (PDF 1.4 or later)
- SHOULD have all fonts and images embedded (for offline-safe distribution)
- MUST NOT contain JavaScript, macros, or AcroForm scripts (the SDF spec prohibits executable content in `visual.pdf`)

`sdf wrap` will reject PDFs that fail a basic structural check but does not scan for embedded executable content — ensure your PDF source complies with the SDF specification.

## Exit codes

| Code | Meaning |
|------|---------|
| `0` | Wrap succeeded |
| `1` | Wrap failed (invalid PDF, schema mismatch, etc.) |
| `2` | CLI usage error |
