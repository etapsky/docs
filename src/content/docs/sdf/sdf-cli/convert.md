---
title: "sdf convert"
description: "Convert a data.json + schema.json pair into a .sdf file with an auto-generated PDF."
sidebar:
  label: "convert"
  order: 8
---

`sdf convert` takes a `data.json` file and a `schema.json` file and produces a complete `.sdf` document, including an auto-generated `visual.pdf`. This is the command-line equivalent of calling `buildSDF()` from `@etapsky/sdf-kit/producer`.

## Usage

```bash title="Terminal"
sdf convert <data-file> <schema-file> [flags]
```

## Flags

| Flag | Description | Required |
|------|-------------|----------|
| `--output <path>`, `-o` | Output `.sdf` file path | No (defaults to `output.sdf`) |
| `--issuer <name>` | Issuer name, written to `meta.json` | Yes |
| `--type <type>` | Document type (e.g. `invoice`, `purchase_order`) | Yes |
| `--issuer-id <id>` | Issuer identifier (e.g. tax ID, GLN) | No |
| `--recipient <name>` | Recipient name | No |
| `--schema-id <id>` | Schema identifier URI (e.g. `invoice/v1.0`) | No |
| `--locale <tag>` | BCP 47 locale tag for PDF rendering (e.g. `en-US`, `de-DE`) | No (defaults to `en-US`) |
| `--no-color` | Disable ANSI color output | No |
| `--help` | Print help and exit | No |

## When to use `convert` vs `wrap`

| Command | Starting point | PDF handling |
|---------|---------------|-------------|
| `sdf convert` | You have `data.json` + schema | Auto-generates a PDF from your data |
| `sdf wrap` | You already have a PDF | Embeds your existing PDF exactly as-is |

Use `convert` when:
- You are generating new documents programmatically from structured data
- You do not have an existing PDF and want one generated automatically
- You are building a batch pipeline that converts data exports to `.sdf`

Use `wrap` when:
- You have an existing PDF that must be preserved byte-for-byte

## Example

```bash title="Terminal"
sdf convert data.json schema.json \
  --output invoice.sdf \
  --issuer "Acme Supplies GmbH" \
  --issuer-id "DE123456789" \
  --type invoice \
  --recipient "Beta Industries Ltd." \
  --schema-id "invoice/v1.0" \
  --locale en-US
```

```
  SDF — Smart Document Format  @etapsky/sdf-cli 0.3.0
────────────────────────────────────────────────────────────
  convert  data.json  schema.json
────────────────────────────────────────────────────────────

  Issuer    Acme Supplies GmbH
  Type      invoice
  Locale    en-US

  ✓ data conforms to schema
  ✓ PDF generated         (248 KB)
  ✓ meta assembled        (document_id: f47ac10b-58cc-4372-a567-0e02b2c3d479)
  ✓ container packed

  Output  invoice.sdf  (259 KB)
```

## Input file format

### `data.json`

The business data for the document. Must conform to the provided `schema.json`.

```json title="data.json"
{
  "invoice_number": "INV-2026-001",
  "issue_date":     "2026-03-15",
  "due_date":       "2026-04-15",
  "seller": {
    "name":    "Acme Supplies GmbH",
    "vat_id":  "DE123456789",
    "address": "Musterstraße 1, 10115 Berlin, Germany"
  },
  "buyer": {
    "name":    "Beta Industries Ltd.",
    "address": "10 Example Street, London, EC1A 1BB, UK"
  },
  "line_items": [
    {
      "description": "Industrial Widget A",
      "quantity":    50,
      "unit_price":  { "amount": "20.00",   "currency": "EUR" },
      "total":       { "amount": "1000.00", "currency": "EUR" }
    }
  ],
  "total": { "amount": "1000.00", "currency": "EUR" }
}
```

### `schema.json`

A valid JSON Schema Draft 2020-12 document. Must not contain external `$ref` URLs — all referenced schemas must be embedded inline.

```json title="schema.json"
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "invoice/v1.0",
  "type": "object",
  "required": ["invoice_number", "issue_date", "seller", "buyer", "line_items", "total"],
  "properties": {
    "invoice_number": { "type": "string" },
    "issue_date":     { "type": "string", "format": "date" },
    "total": {
      "type": "object",
      "required": ["amount", "currency"],
      "properties": {
        "amount":   { "type": "string" },
        "currency": { "type": "string" }
      }
    }
  }
}
```

## Batch conversion

`sdf convert` is designed to be used in scripts for bulk document generation:

```bash title="batch-convert.sh"
#!/usr/bin/env bash
set -euo pipefail

ISSUER="Acme Supplies GmbH"
SCHEMA="schemas/invoice.json"
OUT_DIR="output"

mkdir -p "$OUT_DIR"

for data_file in data/invoices/*.json; do
  name=$(basename "$data_file" .json)
  sdf convert "$data_file" "$SCHEMA" \
    --output "$OUT_DIR/$name.sdf" \
    --issuer "$ISSUER" \
    --type invoice \
    --locale en-US
  echo "Converted: $OUT_DIR/$name.sdf"
done
```

## PDF generation

`sdf convert` uses pdf-lib to generate `visual.pdf` from your data. The PDF:
- Has all fonts fully embedded (offline-safe)
- Contains no external resource references
- Contains no executable content (JavaScript, macros, AcroForm scripts)
- Renders a structured table layout for common document types (invoice, purchase order)

The generated PDF is adequate for standard business document distribution. For precise visual branding control, use [`sdf wrap`](/sdf/sdf-cli/wrap) with a PDF produced by your own rendering pipeline.

## Exit codes

| Code | Meaning |
|------|---------|
| `0` | Conversion succeeded |
| `1` | Conversion failed (schema mismatch, invalid JSON, etc.) |
| `2` | CLI usage error |
