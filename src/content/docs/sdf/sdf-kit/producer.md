---
title: "Producer — buildSDF()"
description: "Build .sdf files with buildSDF(). Full API reference, options, error handling, and producer flow."
sidebar:
  label: "Producer"
  order: 2
---

The producer module creates `.sdf` files from your business data and a JSON Schema. It handles PDF generation, container packing, and meta assembly automatically.

## Import

```typescript
import { buildSDF } from '@etapsky/sdf-kit/producer';
```

## `buildSDF(options)`

```typescript
function buildSDF(options: BuildSDFOptions): Promise<Buffer>
```

Produces a complete `.sdf` file and returns it as a `Buffer`. The call is fully self-contained — no temporary files, no network requests.

### Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `data` | `Record<string, unknown>` | Yes | Business data object. Must conform to the provided `schema`. |
| `schema` | `Record<string, unknown>` | Yes | JSON Schema Draft 2020-12 object. Embedded verbatim into `schema.json` inside the archive. External `$ref` URLs are rejected. |
| `issuer` | `string` | Yes | Human-readable name of the document issuer (e.g. `"Acme Supplies GmbH"`). Written to `meta.json`. |
| `documentType` | `string` | Yes | Document type identifier (e.g. `"invoice"`, `"purchase_order"`, `"nomination"`). Written to `meta.json`. |
| `issuerId` | `string` | No | Unique identifier for the issuer (e.g. tax ID, GLN, UUID). Written to `meta.json` as `issuer_id`. |
| `recipient` | `string` | No | Human-readable name of the document recipient. Written to `meta.json`. |
| `schemaId` | `string` | No | Schema identifier URI (e.g. `"invoice/v1.0"`). Written to `meta.json` as `schema_id`. |
| `locale` | `string` | No | BCP 47 language tag for PDF rendering (e.g. `"en-US"`, `"de-DE"`, `"tr-TR"`). Defaults to `"en-US"`. |

### Return value

Returns `Promise<Buffer>` — a complete, valid `.sdf` file ready to write to disk, upload to S3, or return from an HTTP endpoint.

## Producer flow

`buildSDF()` performs these steps in sequence:

1. **Validate schema** — confirms `schema` is valid JSON Schema Draft 2020-12
2. **Validate data** — runs `data` against `schema` using AJV; throws `SDF_ERROR_SCHEMA_MISMATCH` on failure
3. **Assemble meta** — generates a UUID v4 `document_id`, sets `created_at` to the current UTC time, and writes all provided options into `meta.json`
4. **Generate PDF** — renders `visual.pdf` from `data` using pdf-lib; all fonts and assets are fully embedded (no external references)
5. **Pack container** — assembles `visual.pdf`, `data.json`, `schema.json`, and `meta.json` into a ZIP archive via the `packContainer` abstraction
6. **Return buffer** — returns the raw ZIP bytes as a Node.js `Buffer`

:::note
`document_id` is always a random UUID v4 generated at build time. It is never derived from business identifiers such as invoice numbers or order references. Business identifiers live in `data.json`.
:::

## Complete example

```typescript title="produce-invoice.ts"
import { buildSDF } from '@etapsky/sdf-kit/producer';
import { SDFError } from '@etapsky/sdf-kit';
import { writeFile } from 'node:fs/promises';

const schema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'invoice/v1.0',
  type: 'object',
  required: ['invoice_number', 'issue_date', 'seller', 'buyer', 'line_items', 'total'],
  properties: {
    invoice_number: { type: 'string' },
    issue_date:     { type: 'string', format: 'date' },
    due_date:       { type: 'string', format: 'date' },
    seller: {
      type: 'object',
      required: ['name'],
      properties: {
        name:    { type: 'string' },
        vat_id:  { type: 'string' },
        address: { type: 'string' },
      },
    },
    buyer: {
      type: 'object',
      required: ['name'],
      properties: {
        name:    { type: 'string' },
        vat_id:  { type: 'string' },
        address: { type: 'string' },
      },
    },
    line_items: {
      type: 'array',
      items: {
        type: 'object',
        required: ['description', 'quantity', 'unit_price', 'total'],
        properties: {
          description: { type: 'string' },
          quantity:    { type: 'number' },
          unit_price:  { type: 'object', required: ['amount', 'currency'], properties: { amount: { type: 'string' }, currency: { type: 'string' } } },
          total:       { type: 'object', required: ['amount', 'currency'], properties: { amount: { type: 'string' }, currency: { type: 'string' } } },
        },
      },
    },
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
  due_date:       '2026-04-15',
  seller: {
    name:    'Acme Supplies GmbH',
    vat_id:  'DE123456789',
    address: 'Musterstraße 1, 10115 Berlin, Germany',
  },
  buyer: {
    name:    'Beta Industries Ltd.',
    vat_id:  'GB987654321',
    address: '10 Example Street, London, EC1A 1BB, UK',
  },
  line_items: [
    {
      description: 'Industrial Widget A',
      quantity:    50,
      unit_price:  { amount: '20.00',   currency: 'EUR' },
      total:       { amount: '1000.00', currency: 'EUR' },
    },
    {
      description: 'Packaging',
      quantity:    1,
      unit_price:  { amount: '50.00',  currency: 'EUR' },
      total:       { amount: '50.00',  currency: 'EUR' },
    },
  ],
  total: { amount: '1250.00', currency: 'EUR' },
};

try {
  const buffer = await buildSDF({
    data,
    schema,
    issuer:       'Acme Supplies GmbH',
    issuerId:     'DE123456789',
    documentType: 'invoice',
    recipient:    'Beta Industries Ltd.',
    schemaId:     'invoice/v1.0',
    locale:       'en-US',
  });

  await writeFile('invoice.sdf', buffer);
  console.log('Written: invoice.sdf');
} catch (err) {
  if (err instanceof SDFError) {
    console.error(`SDF error [${err.code}]: ${err.message}`);
    process.exit(1);
  }
  throw err;
}
```

## Returning from an HTTP handler

```typescript title="routes/documents.ts"
import { buildSDF } from '@etapsky/sdf-kit/producer';

// Fastify route example
fastify.post('/documents', async (request, reply) => {
  const { data, schema, issuer, documentType } = request.body;

  const buffer = await buildSDF({ data, schema, issuer, documentType });

  return reply
    .header('Content-Type', 'application/octet-stream')
    .header('Content-Disposition', 'attachment; filename="document.sdf"')
    .send(buffer);
});
```

## Error handling

`buildSDF()` throws `SDFError` for all spec-level failures. Always wrap calls in a try/catch.

| Error code | Cause |
|------------|-------|
| `SDF_ERROR_SCHEMA_MISMATCH` | `data` does not conform to the provided `schema` |
| `SDF_ERROR_INVALID_SCHEMA` | `schema` is not valid JSON Schema Draft 2020-12 |
| `SDF_ERROR_INVALID_META` | A required meta field is missing or malformed |

```typescript title="error-handling.ts"
import { buildSDF } from '@etapsky/sdf-kit/producer';
import { SDFError } from '@etapsky/sdf-kit';

try {
  const buffer = await buildSDF({ data, schema, issuer, documentType });
} catch (err) {
  if (err instanceof SDFError) {
    switch (err.code) {
      case 'SDF_ERROR_SCHEMA_MISMATCH':
        // data does not match schema — return 422 to caller
        break;
      case 'SDF_ERROR_INVALID_SCHEMA':
        // schema itself is malformed
        break;
      default:
        // other SDF-level error
    }
  }
  throw err; // re-throw non-SDF errors
}
```

## Money amounts

All monetary values MUST use the `{ amount: string, currency: string }` object format. Never use bare numbers or floating-point values for financial data.

```typescript
// Correct
total: { amount: '1250.00', currency: 'EUR' }

// Wrong — do not do this
total: 1250.50
```

This is a normative requirement of the SDF specification. `buildSDF()` will throw `SDF_ERROR_SCHEMA_MISMATCH` if your schema defines money fields correctly and your data uses bare numbers.

## Dates

All date and datetime values MUST be ISO 8601 strings.

```typescript
// Correct
issue_date: '2026-03-15'
created_at: '2026-03-15T14:30:00+01:00'

// Wrong
issue_date: new Date()
```
