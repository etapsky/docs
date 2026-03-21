---
title: "sdf inspect"
description: "Print a full inspection report for a .sdf file — meta, schema summary, data tree, and layer sizes."
sidebar:
  label: "inspect"
  order: 2
---

`sdf inspect` prints a detailed inspection report for an `.sdf` file, including document metadata, schema information, data content, layer sizes, and validation status.

## Usage

```bash title="Terminal"
sdf inspect <file> [flags]
```

## Flags

| Flag | Description |
|------|-------------|
| `--json` | Output the inspection report as JSON instead of formatted text |
| `--no-color` | Disable ANSI color output |
| `--help` | Print help and exit |

## Example — text output

```bash title="Terminal"
sdf inspect invoice.sdf
```

```
  SDF — Smart Document Format  @etapsky/sdf-cli 0.3.0
────────────────────────────────────────────────────────────
  inspect  invoice.sdf
────────────────────────────────────────────────────────────

  Meta
  ────
  document_id    f47ac10b-58cc-4372-a567-0e02b2c3d479
  document_type  invoice
  sdf_version    0.1
  issuer         Acme Supplies GmbH
  issuer_id      DE123456789
  recipient      Beta Industries Ltd.
  schema_id      invoice/v1.0
  locale         en-US
  created_at     2026-03-15T14:30:00+01:00

  Schema
  ──────
  $id       invoice/v1.0
  required  invoice_number, issue_date, seller, buyer, line_items, total

  Data
  ────
  invoice_number  INV-2026-001
  issue_date      2026-03-15
  due_date        2026-04-15
  seller          { name, vat_id, address }
  buyer           { name, vat_id, address }
  line_items      [ 2 items ]
  total           { amount: "1250.00", currency: "EUR" }

  Layers
  ──────
  visual.pdf    248 KB
  data.json       4 KB
  schema.json     6 KB
  meta.json       1 KB

  Status  ✓ valid
```

## Example — JSON output

```bash title="Terminal"
sdf inspect invoice.sdf --json
```

```json
{
  "file": "invoice.sdf",
  "meta": {
    "document_id":   "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "document_type": "invoice",
    "sdf_version":   "0.1",
    "issuer":        "Acme Supplies GmbH",
    "issuer_id":     "DE123456789",
    "recipient":     "Beta Industries Ltd.",
    "schema_id":     "invoice/v1.0",
    "locale":        "en-US",
    "created_at":    "2026-03-15T14:30:00+01:00"
  },
  "schema": {
    "$id":      "invoice/v1.0",
    "required": ["invoice_number", "issue_date", "seller", "buyer", "line_items", "total"]
  },
  "data": {
    "invoice_number": "INV-2026-001",
    "issue_date":     "2026-03-15",
    "due_date":       "2026-04-15",
    "total":          { "amount": "1250.00", "currency": "EUR" }
  },
  "layers": {
    "visual.pdf":  253952,
    "data.json":     4096,
    "schema.json":   6144,
    "meta.json":      512
  },
  "signed": false,
  "valid":  true
}
```

## Signed document inspection

When a document includes a `signature.sig` entry, the inspection report includes signature information:

```
  Signature
  ─────────
  algorithm   ECDSA-P256
  signed_at   2026-03-15T15:00:00+01:00
  status      ✓ signature present (not verified — run sdf verify to check)
```

To verify the signature cryptographically, use [`sdf verify`](/sdf/sdf-cli/verify).

## Exit codes

| Code | Meaning |
|------|---------|
| `0` | Inspection completed successfully |
| `1` | The file could not be read or is not a valid SDF archive |

## Piping JSON output

The `--json` flag makes `sdf inspect` composable with standard Unix tools:

```bash title="Terminal"
# Extract just the document_id
sdf inspect invoice.sdf --json | jq -r '.meta.document_id'

# Check total amount
sdf inspect invoice.sdf --json | jq -r '.data.total.amount'

# List all layer sizes
sdf inspect invoice.sdf --json | jq '.layers'
```
