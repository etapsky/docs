---
title: "Nomination Example (B2B)"
description: "A B2B nomination (delivery note) where a supplier confirms goods dispatch per a purchase order."
sidebar:
  label: "Nomination (B2B)"
  order: 3
---

A **nomination** is a structured delivery confirmation. The supplier sends it to the buyer to confirm that goods are being dispatched in accordance with a specific purchase order. It typically accompanies or precedes the physical shipment.

In SDF, a nomination uses `document_type: "nomination"` and includes a `nomination_ref` in `meta.json` to link the SDF document back to the originating purchase order reference.

## meta.json

```json title="meta.json"
{
  "sdf_version": "0.1",
  "document_id": "c3d4e5f6-7890-4abc-bcde-111111111111",
  "document_type": "nomination",
  "schema_id": "nomination/v0.1",
  "issuer": "Acme Supplies GmbH",
  "issuer_id": "DE123456789",
  "created_at": "2026-03-16T08:00:00+01:00",
  "recipient": "Global Logistics AG",
  "nomination_ref": "PO-2026-0042"
}
```

The `nomination_ref` field in `meta.json` is the SDF standard linking mechanism. It corresponds to the buyer's purchase order number and is used by ERP connectors to match the nomination to an existing PO in the buyer's system.

## data.json

```json title="data.json"
{
  "document_type": "nomination",
  "nomination_number": "NOM-2026-00088",
  "issue_date": "2026-03-16",
  "estimated_delivery_date": "2026-03-20",
  "purchase_order_ref": "PO-2026-0042",
  "shipper": {
    "name": "Acme Supplies GmbH",
    "id": "DE123456789",
    "address": {
      "street": "Industriestraße 42",
      "city": "Munich",
      "postal_code": "80331",
      "country": "DE"
    }
  },
  "consignee": {
    "name": "Global Logistics AG",
    "id": "CH-123.456.789",
    "address": {
      "street": "Logistikweg 7",
      "city": "Zurich",
      "postal_code": "8001",
      "country": "CH"
    }
  },
  "carrier": {
    "name": "Alpine Freight GmbH",
    "tracking_number": "ALF-2026-0099234"
  },
  "cargo_items": [
    {
      "description": "Industrial valve Type-A",
      "quantity": 50,
      "unit": "PCS",
      "weight_kg": "75.00",
      "hs_code": "8481.80"
    },
    {
      "description": "Sealing kit Type-B",
      "quantity": 12,
      "unit": "BOX",
      "weight_kg": "6.00",
      "hs_code": "3926.90"
    }
  ],
  "total_weight_kg": "81.00",
  "incoterms": "DAP",
  "remarks": "Temperature-sensitive items — store above 5°C"
}
```

## Producer code (TypeScript)

```typescript title="examples/nomination/produce.ts"
import { buildSDF } from '@etapsky/sdf-kit';
import { readFileSync, writeFileSync } from 'fs';

const meta = {
  sdf_version: '0.1',
  document_id: crypto.randomUUID(),
  document_type: 'nomination',
  schema_id: 'nomination/v0.1',
  issuer: 'Acme Supplies GmbH',
  issuer_id: 'DE123456789',
  created_at: new Date().toISOString(),
  recipient: 'Global Logistics AG',
  nomination_ref: 'PO-2026-0042',
};

const data = { /* ... data.json content above ... */ };
const schema = JSON.parse(readFileSync('nomination.schema.json', 'utf-8'));

const sdfBuffer = await buildSDF({ meta, data, schema });
writeFileSync('nomination.sdf', sdfBuffer);
```

## Validating

```bash
sdf validate nomination.sdf
sdf inspect nomination.sdf --field nomination_ref
```
