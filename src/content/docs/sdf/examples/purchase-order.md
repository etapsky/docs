---
title: "Purchase Order Example (B2B)"
description: "A B2B purchase order issued by a buyer to a supplier as a structured SDF document."
sidebar:
  label: "Purchase Order (B2B)"
  order: 4
---

A **purchase order (PO)** is a formal buyer commitment to purchase specific goods or services from a supplier at agreed prices. Sending a PO as an SDF document allows the receiving supplier to import it directly into their ERP without manual data entry.

## meta.json

```json title="meta.json"
{
  "sdf_version": "0.1",
  "document_id": "a1b2c3d4-0000-4abc-bcde-222222222222",
  "document_type": "purchase_order",
  "schema_id": "purchase_order/v0.1",
  "issuer": "Global Logistics AG",
  "issuer_id": "CH-123.456.789",
  "created_at": "2026-03-10T10:00:00+01:00",
  "recipient": "Acme Supplies GmbH"
}
```

## data.json

```json title="data.json"
{
  "document_type": "purchase_order",
  "po_number": "PO-2026-0042",
  "issue_date": "2026-03-10",
  "delivery_deadline": "2026-03-25",
  "buyer": {
    "name": "Global Logistics AG",
    "id": "CH-123.456.789",
    "address": {
      "street": "Logistikweg 7",
      "city": "Zurich",
      "postal_code": "8001",
      "country": "CH"
    }
  },
  "supplier": {
    "name": "Acme Supplies GmbH",
    "id": "DE123456789",
    "address": {
      "street": "Industriestraße 42",
      "city": "Munich",
      "postal_code": "80331",
      "country": "DE"
    }
  },
  "line_items": [
    {
      "line_number": 1,
      "item_code": "VALVE-TYPE-A",
      "description": "Industrial valve Type-A",
      "quantity": 50,
      "unit": "PCS",
      "unit_price": { "amount": "24.00", "currency": "EUR" },
      "line_total": { "amount": "1200.00", "currency": "EUR" }
    },
    {
      "line_number": 2,
      "item_code": "SEAL-TYPE-B",
      "description": "Sealing kit Type-B",
      "quantity": 12,
      "unit": "BOX",
      "unit_price": { "amount": "20.00", "currency": "EUR" },
      "line_total": { "amount": "240.00", "currency": "EUR" }
    }
  ],
  "totals": {
    "net": { "amount": "1440.00", "currency": "EUR" }
  },
  "delivery_address": {
    "street": "Logistikweg 7",
    "city": "Zurich",
    "postal_code": "8001",
    "country": "CH"
  },
  "payment_terms": "NET_30",
  "incoterms": "DAP",
  "notes": "Deliver to loading dock B. Contact: +41 44 000 00 00"
}
```

## Producer code (TypeScript)

```typescript title="examples/purchase-order/produce.ts"
import { buildSDF } from '@etapsky/sdf-kit';
import { readFileSync, writeFileSync } from 'fs';

const meta = {
  sdf_version: '0.1',
  document_id: crypto.randomUUID(),
  document_type: 'purchase_order',
  schema_id: 'purchase_order/v0.1',
  issuer: 'Global Logistics AG',
  issuer_id: 'CH-123.456.789',
  created_at: new Date().toISOString(),
  recipient: 'Acme Supplies GmbH',
};

const data = { /* ... data.json content above ... */ };
const schema = JSON.parse(readFileSync('purchase_order.schema.json', 'utf-8'));

const sdfBuffer = await buildSDF({ meta, data, schema });
writeFileSync('purchase_order.sdf', sdfBuffer);
```

## Validating

```bash
sdf validate purchase_order.sdf
```

When the supplier receives the PO as an SDF document, they can push it to their ERP in one step:

```bash
sdf inspect purchase_order.sdf --field po_number
# PO-2026-0042
```
