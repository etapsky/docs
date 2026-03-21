---
title: "@etapsky/sdf-kit"
description: "The reference TypeScript implementation of the SDF spec — producer, reader, validator, and signer. Universal: Node.js, browser, Bun."
sidebar:
  label: "Overview"
  order: 1
---

`@etapsky/sdf-kit` is the reference TypeScript implementation of the Smart Document Format specification. It provides the complete toolchain for producing, reading, validating, and signing `.sdf` files — in any JavaScript runtime.

## Installation

```bash title="Terminal"
# Bun (recommended)
bun add @etapsky/sdf-kit

# npm
npm install @etapsky/sdf-kit

# pnpm
pnpm add @etapsky/sdf-kit
```

**Version:** `0.2.2` &nbsp;·&nbsp; **License:** MIT &nbsp;·&nbsp; **TypeScript:** strict mode, no `any`

## Quick example

```typescript title="produce-and-read.ts"
import { buildSDF } from '@etapsky/sdf-kit/producer';
import { parseSDF } from '@etapsky/sdf-kit/reader';
import { SDFError } from '@etapsky/sdf-kit';

const schema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'invoice/v1.0',
  type: 'object',
  required: ['invoice_number', 'issue_date', 'total'],
  properties: {
    invoice_number: { type: 'string' },
    issue_date:     { type: 'string', format: 'date' },
    total: {
      type: 'object',
      required: ['amount', 'currency'],
      properties: {
        amount:   { type: 'string' },
        currency: { type: 'string' },
      },
    },
  },
};

const data = {
  invoice_number: 'INV-2026-001',
  issue_date:     '2026-03-15',
  total: { amount: '1250.00', currency: 'EUR' },
};

// Produce
const buffer = await buildSDF({
  data,
  schema,
  issuer:       'Acme Supplies GmbH',
  documentType: 'invoice',
  schemaId:     'invoice/v1.0',
  locale:       'en-US',
});

// Read back
const { meta, data: parsed } = await parseSDF(buffer);
console.log(meta.document_id);   // UUID v4 — auto-generated
console.log(parsed.invoice_number); // "INV-2026-001"
```

## Package modules

`@etapsky/sdf-kit` is organized into four focused subpath exports:

| Module | Import path | Purpose |
|--------|-------------|---------|
| Producer | `@etapsky/sdf-kit/producer` | Build `.sdf` files from data + schema |
| Reader | `@etapsky/sdf-kit/reader` | Parse and extract content from `.sdf` files |
| Validator | `@etapsky/sdf-kit/validator` | Validate data against schema, check meta, verify spec version |
| Signer | `@etapsky/sdf-kit/signer` | Generate key pairs, sign files, verify signatures |
| Core types | `@etapsky/sdf-kit` | `SDFMeta`, `SDFError`, shared type definitions |

Each module is independently tree-shakeable. If you only need the reader, importing `@etapsky/sdf-kit/reader` will not bundle the PDF generation code.

## Supported environments

| Environment | Support | Notes |
|-------------|---------|-------|
| Node.js 20 | Full | LTS, recommended for server-side |
| Node.js 22 | Full | Current LTS |
| Bun 1.3+ | Full | Used in the Etapsky monorepo |
| Browser (ESM) | Full | Web Crypto API required for signing |
| Electron | Full | Main and renderer process |
| Deno | Partial | Via npm compatibility mode |

All cryptographic operations use the [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API), which is available natively in Node.js 20+, all modern browsers, Bun, and Electron.

## What SDF is

A `.sdf` file is a ZIP archive that combines a human-readable PDF layer with a machine-readable JSON layer:

```
invoice.sdf  (ZIP)
├── visual.pdf    — Human-readable visual representation
├── data.json     — Structured business data
├── schema.json   — JSON Schema Draft 2020-12 (embedded, no external URLs)
└── meta.json     — SDF metadata and document identity
```

An optional `signature.sig` file is added when the document is digitally signed.

`@etapsky/sdf-kit` implements the complete [SDF Format Specification](/spec/SDF_FORMAT) — including producer flow, consumer flow, validation rules, and digital signing.

## Next steps

- [Producer — buildSDF()](/sdf/sdf-kit/producer) — Build `.sdf` files
- [Reader — parseSDF() / extractJSON()](/sdf/sdf-kit/reader) — Read `.sdf` files
- [Validator — validateSchema() / validateMeta()](/sdf/sdf-kit/validator) — Validate content
- [Signer — signSDF() / verifySIG()](/sdf/sdf-kit/signer) — Digital signing
- [Types & Error Codes](/sdf/sdf-kit/types) — Full type reference
