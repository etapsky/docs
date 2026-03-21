---
title: "Invoice Example (B2B)"
description: "A complete SDF invoice from Acme Supplies GmbH to Global Logistics AG — with meta.json, data.json, schema.json, and TypeScript/Python code."
sidebar:
  label: "Invoice (B2B)"
  order: 2
---

This example demonstrates a complete B2B invoice SDF document. The issuer is **Acme Supplies GmbH** (Munich, DE) billing **Global Logistics AG** (Zurich, CH) for industrial parts.

## meta.json

```json title="meta.json"
{
  "sdf_version": "0.1",
  "document_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "document_type": "invoice",
  "schema_id": "https://etapsky.github.io/sdf/schemas/invoice/v0.1.json",
  "issuer": "Acme Supplies GmbH",
  "issuer_id": "DE123456789",
  "created_at": "2026-03-15T14:30:00+01:00",
  "recipient": "Global Logistics AG"
}
```

Key fields:
- `document_id` is a UUID v4 generated at production time — it is **not** derived from the invoice number.
- `schema_id` points to the embedded `schema.json` (the URL is a schema identifier, not a remote reference — the schema is bundled inside the `.sdf` archive).

## data.json

```json title="data.json"
{
  "document_type": "invoice",
  "invoice_number": "INV-2026-00142",
  "issue_date": "2026-03-15",
  "due_date": "2026-04-15",
  "order_ref": "PO-2026-0042",
  "issuer": {
    "name": "Acme Supplies GmbH",
    "id": "DE123456789",
    "address": {
      "street": "Industriestraße 42",
      "city": "Munich",
      "postal_code": "80331",
      "country": "DE"
    }
  },
  "recipient": {
    "name": "Global Logistics AG",
    "id": "CH-123.456.789",
    "address": {
      "street": "Logistikweg 7",
      "city": "Zurich",
      "postal_code": "8001",
      "country": "CH"
    }
  },
  "line_items": [
    {
      "description": "Industrial valve Type-A",
      "quantity": 50,
      "unit_price": { "amount": "24.00", "currency": "EUR" },
      "vat_rate": "19.00",
      "line_total": { "amount": "1200.00", "currency": "EUR" }
    },
    {
      "description": "Sealing kit Type-B",
      "quantity": 12,
      "unit_price": { "amount": "20.00", "currency": "EUR" },
      "vat_rate": "19.00",
      "line_total": { "amount": "240.00", "currency": "EUR" }
    }
  ],
  "totals": {
    "net": { "amount": "1440.00", "currency": "EUR" },
    "vat": { "amount": "273.60", "currency": "EUR" },
    "gross": { "amount": "1713.60", "currency": "EUR" }
  },
  "payment": {
    "iban": "DE89370400440532013000",
    "bic": "COBADEFFXXX",
    "due_date": "2026-04-15",
    "terms": "NET_30"
  }
}
```

> **Monetary amounts** are always `{ "amount": "string", "currency": "ISO 4217 code" }`. Floating-point numbers are never used for financial values — see [FAQ](/sdf/reference/faq).

## Producer code

### TypeScript

```typescript title="examples/invoice/produce.ts"
import { buildSDF } from '@etapsky/sdf-kit';
import { readFileSync, writeFileSync } from 'fs';

const meta = {
  sdf_version: '0.1',
  document_id: crypto.randomUUID(),  // always generate fresh UUID
  document_type: 'invoice',
  schema_id: 'invoice/v0.1',
  issuer: 'Acme Supplies GmbH',
  issuer_id: 'DE123456789',
  created_at: new Date().toISOString(),
  recipient: 'Global Logistics AG',
};

const data = {
  document_type: 'invoice',
  invoice_number: 'INV-2026-00142',
  issue_date: '2026-03-15',
  due_date: '2026-04-15',
  order_ref: 'PO-2026-0042',
  issuer: {
    name: 'Acme Supplies GmbH',
    id: 'DE123456789',
    address: {
      street: 'Industriestraße 42',
      city: 'Munich',
      postal_code: '80331',
      country: 'DE',
    },
  },
  recipient: {
    name: 'Global Logistics AG',
    id: 'CH-123.456.789',
    address: {
      street: 'Logistikweg 7',
      city: 'Zurich',
      postal_code: '8001',
      country: 'CH',
    },
  },
  line_items: [
    {
      description: 'Industrial valve Type-A',
      quantity: 50,
      unit_price: { amount: '24.00', currency: 'EUR' },
      vat_rate: '19.00',
      line_total: { amount: '1200.00', currency: 'EUR' },
    },
    {
      description: 'Sealing kit Type-B',
      quantity: 12,
      unit_price: { amount: '20.00', currency: 'EUR' },
      vat_rate: '19.00',
      line_total: { amount: '240.00', currency: 'EUR' },
    },
  ],
  totals: {
    net: { amount: '1440.00', currency: 'EUR' },
    vat: { amount: '273.60', currency: 'EUR' },
    gross: { amount: '1713.60', currency: 'EUR' },
  },
  payment: {
    iban: 'DE89370400440532013000',
    bic: 'COBADEFFXXX',
    due_date: '2026-04-15',
    terms: 'NET_30',
  },
};

const schema = JSON.parse(readFileSync('invoice.schema.json', 'utf-8'));

const sdfBuffer = await buildSDF({ meta, data, schema });

writeFileSync('invoice.sdf', sdfBuffer);
console.log('Created invoice.sdf —', sdfBuffer.byteLength, 'bytes');
```

### Python

```python title="examples/invoice/produce.py"
import uuid
from datetime import datetime, timezone
from etapsky_sdf import build_sdf
import json

meta = {
    "sdf_version": "0.1",
    "document_id": str(uuid.uuid4()),
    "document_type": "invoice",
    "schema_id": "invoice/v0.1",
    "issuer": "Acme Supplies GmbH",
    "issuer_id": "DE123456789",
    "created_at": datetime.now(timezone.utc).isoformat(),
    "recipient": "Global Logistics AG",
}

data = {
    "document_type": "invoice",
    "invoice_number": "INV-2026-00142",
    "issue_date": "2026-03-15",
    "due_date": "2026-04-15",
    "order_ref": "PO-2026-0042",
    "issuer": {
        "name": "Acme Supplies GmbH",
        "id": "DE123456789",
        "address": {
            "street": "Industriestraße 42",
            "city": "Munich",
            "postal_code": "80331",
            "country": "DE",
        },
    },
    "recipient": {
        "name": "Global Logistics AG",
        "id": "CH-123.456.789",
        "address": {
            "street": "Logistikweg 7",
            "city": "Zurich",
            "postal_code": "8001",
            "country": "CH",
        },
    },
    "line_items": [
        {
            "description": "Industrial valve Type-A",
            "quantity": 50,
            "unit_price": {"amount": "24.00", "currency": "EUR"},
            "vat_rate": "19.00",
            "line_total": {"amount": "1200.00", "currency": "EUR"},
        },
        {
            "description": "Sealing kit Type-B",
            "quantity": 12,
            "unit_price": {"amount": "20.00", "currency": "EUR"},
            "vat_rate": "19.00",
            "line_total": {"amount": "240.00", "currency": "EUR"},
        },
    ],
    "totals": {
        "net": {"amount": "1440.00", "currency": "EUR"},
        "vat": {"amount": "273.60", "currency": "EUR"},
        "gross": {"amount": "1713.60", "currency": "EUR"},
    },
    "payment": {
        "iban": "DE89370400440532013000",
        "bic": "COBADEFFXXX",
        "due_date": "2026-04-15",
        "terms": "NET_30",
    },
}

with open("invoice.schema.json") as f:
    schema = json.load(f)

sdf_bytes = build_sdf(meta=meta, data=data, schema=schema)

with open("invoice.sdf", "wb") as f:
    f.write(sdf_bytes)

print(f"Created invoice.sdf — {len(sdf_bytes)} bytes")
```

## Validating the output

```bash
sdf validate invoice.sdf
```

Expected output:

```
✔  invoice.sdf — valid
   document_id:    f47ac10b-58cc-4372-a567-0e02b2c3d479
   document_type:  invoice
   sdf_version:    0.1
   schema_id:      invoice/v0.1
   signed:         false
```
