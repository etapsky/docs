---
title: "Quickstart"
description: "Produce, read, and validate your first .sdf file in 5 minutes."
sidebar:
  label: "Quickstart"
  order: 1
---

This guide walks you through producing a `.sdf` file, reading it back, and validating it with the CLI. You will have a working end-to-end flow in under 5 minutes.

## Prerequisites

- **Node.js 20 LTS or later** — for the TypeScript examples
- **Python 3.11 or later** — for the Python examples
- You only need one of the two. Pick whichever you prefer.

## Install

**TypeScript / Node.js:**

```bash
npm install @etapsky/sdf-kit
```

**Python:**

```bash
pip install etapsky-sdf
```

## Produce Your First SDF

### TypeScript

```typescript title="produce.ts"
import { buildSDF } from '@etapsky/sdf-kit/producer';
import { writeFile } from 'fs/promises';

const schema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  required: ['document_type', 'invoice_number'],
  properties: {
    document_type:  { type: 'string' },
    invoice_number: { type: 'string' },
    total: {
      type: 'object',
      properties: {
        amount:   { type: 'string' },
        currency: { type: 'string' },
      },
    },
  },
};

const data = {
  document_type:  'invoice',
  invoice_number: 'INV-2026-001',
  total: { amount: '1250.00', currency: 'EUR' },
};

const buffer = await buildSDF({
  data,
  schema,
  issuer:       'Acme Supplies GmbH',
  issuerId:     'DE123456789',
  documentType: 'invoice',
  recipient:    'Global Logistics AG',
  schemaId:     'https://etapsky.github.io/sdf/schemas/invoice/v0.1.json',
});

await writeFile('invoice.sdf', buffer);
console.log('✓ invoice.sdf created');
```

Run it:

```bash
npx tsx produce.ts
```

### Python

```python title="produce.py"
from sdf import SDFProducer, SDFMeta

schema = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "required": ["document_type", "invoice_number"],
    "properties": {
        "document_type":  {"type": "string"},
        "invoice_number": {"type": "string"},
    },
}

data = {
    "document_type":  "invoice",
    "invoice_number": "INV-2026-001",
    "total": {"amount": "1250.00", "currency": "EUR"},
}

meta = SDFMeta(
    issuer="Acme Supplies GmbH",
    issuer_id="DE123456789",
    document_type="invoice",
    recipient="Global Logistics AG",
)

producer = SDFProducer()
with open("invoice.sdf", "wb") as f:
    f.write(producer.build(data=data, schema=schema, meta=meta))
print("✓ invoice.sdf created")
```

Run it:

```bash
python produce.py
```

:::note
Notice that `total.amount` is a string (`"1250.00"`), not a number (`1250.00`). SDF requires monetary amounts to be strings to avoid floating-point precision loss. See [Monetary Amounts](/sdf/getting-started/concepts/#monetary-amounts) for the full rule.
:::

## Read It Back

### TypeScript

```typescript title="read.ts"
import { parseSDF } from '@etapsky/sdf-kit/reader';
import { readFile } from 'fs/promises';

const buffer = await readFile('invoice.sdf');
const { meta, data, schema, pdfBytes } = await parseSDF(buffer);

console.log('document_id:', meta.document_id);
console.log('invoice_number:', data.invoice_number);
// pdfBytes → serve to PDF viewer for human review
```

If you only need the JSON layers and not the PDF bytes, use `extractJSON` instead. It skips loading the PDF data and is faster for pure data-processing workloads:

```typescript title="read-json.ts"
import { extractJSON } from '@etapsky/sdf-kit/reader';
import { readFile } from 'fs/promises';

const buffer = await readFile('invoice.sdf');
const { meta, data, schema } = await extractJSON(buffer);

console.log('document_id:', meta.document_id);
console.log('invoice_number:', data.invoice_number);
```

### Python

```python title="read.py"
from sdf import parse_sdf

with open("invoice.sdf", "rb") as f:
    result = parse_sdf(f.read())

print("document_id:", result.meta["document_id"])
print("invoice_number:", result.data["invoice_number"])
# result.pdf_bytes → serve to PDF viewer for human review
```

## Validate with the CLI

Install the CLI (one-time):

```bash
npm install -g @etapsky/sdf-cli
```

Or use it without installing:

```bash
npx @etapsky/sdf-cli inspect invoice.sdf
```

Inspect the file — shows all four layers summarized:

```bash
sdf inspect invoice.sdf
```

Run full validation — checks structure, schema conformance, and meta integrity:

```bash
sdf validate invoice.sdf
```

A valid file exits with code `0`. An invalid file exits with a non-zero code and prints the specific errors. This makes `sdf validate` safe to use in CI pipelines.

## What's Next?

- [Installation](/sdf/getting-started/installation/) — All install methods: npm, Homebrew, binary, PyPI
- [Core Concepts](/sdf/getting-started/concepts/) — The four layers, producer/consumer roles, design decisions
- [sdf-kit Reference](/sdf/sdf-kit/) — Full API documentation for `buildSDF`, `parseSDF`, signing, and validation
