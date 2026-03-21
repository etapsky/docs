---
title: "Tax Declaration Example (B2G)"
description: "A B2G tax declaration SDF document — company submits VAT return to a national tax authority."
sidebar:
  label: "Tax Declaration (B2G)"
  order: 5
---

A **tax declaration** SDF document is submitted by a company to a government tax authority. This example shows a quarterly VAT return from a German GmbH to the Bundeszentralamt für Steuern (BZSt).

## meta.json

```json title="meta.json"
{
  "sdf_version": "0.1",
  "document_id": "d9e0f1a2-3456-4bcd-cdef-333333333333",
  "document_type": "tax_declaration",
  "schema_id": "tax_declaration/v0.1",
  "issuer": "Acme Supplies GmbH",
  "issuer_id": "DE123456789",
  "created_at": "2026-03-20T09:00:00+01:00",
  "recipient": "Bundeszentralamt für Steuern"
}
```

## data.json

```json title="data.json"
{
  "document_type": "tax_declaration",
  "declaration_number": "VAT-2026-Q1-DE123456789",
  "declaration_type": "VAT_QUARTERLY",
  "fiscal_period": {
    "year": 2026,
    "quarter": 1,
    "from": "2026-01-01",
    "to": "2026-03-31"
  },
  "taxpayer": {
    "name": "Acme Supplies GmbH",
    "tax_id": "DE123456789",
    "address": {
      "street": "Industriestraße 42",
      "city": "Munich",
      "postal_code": "80331",
      "country": "DE"
    }
  },
  "authority": {
    "name": "Bundeszentralamt für Steuern",
    "code": "BZSt"
  },
  "vat_summary": {
    "taxable_sales_net": { "amount": "425000.00", "currency": "EUR" },
    "output_vat": { "amount": "80750.00", "currency": "EUR" },
    "input_vat_deductible": { "amount": "31200.00", "currency": "EUR" },
    "vat_payable": { "amount": "49550.00", "currency": "EUR" }
  },
  "submission_date": "2026-03-20",
  "signatory": {
    "name": "Yunus YILDIZ",
    "role": "Managing Director",
    "signature_date": "2026-03-20"
  }
}
```

## Producer code (TypeScript)

```typescript title="examples/gov-tax-declaration/produce.ts"
import { buildSDF } from '@etapsky/sdf-kit';
import { readFileSync, writeFileSync } from 'fs';

const meta = {
  sdf_version: '0.1',
  document_id: crypto.randomUUID(),
  document_type: 'tax_declaration',
  schema_id: 'tax_declaration/v0.1',
  issuer: 'Acme Supplies GmbH',
  issuer_id: 'DE123456789',
  created_at: new Date().toISOString(),
  recipient: 'Bundeszentralamt für Steuern',
};

const data = { /* ... data.json content above ... */ };
const schema = JSON.parse(readFileSync('tax_declaration.schema.json', 'utf-8'));

const sdfBuffer = await buildSDF({ meta, data, schema });
writeFileSync('tax_declaration.sdf', sdfBuffer);
```

## Notes on B2G usage

- Government authorities accepting SDF documents will typically provide the schema file (`schema.json`) they expect. Bundle the authority-provided schema into the `.sdf` archive.
- For jurisdictions requiring digital signatures on tax submissions, use `sdf sign` after producing the document.
- SDF supports any country's tax form structure — field names in `data.json` are defined by the schema, not by SDF itself.
