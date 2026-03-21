---
title: "Customs Declaration Example (B2G)"
description: "A B2G customs declaration SDF document for import/export filing."
sidebar:
  label: "Customs Declaration (B2G)"
  order: 6
---

A **customs declaration** SDF document is submitted by an importer or exporter (or their customs broker) to a border control authority. This example represents an import declaration filed with German Customs (Zollamt) for goods arriving from Switzerland.

## meta.json

```json title="meta.json"
{
  "sdf_version": "0.1",
  "document_id": "e1f2a3b4-5678-4cde-def0-444444444444",
  "document_type": "customs_declaration",
  "schema_id": "customs_declaration/v0.1",
  "issuer": "Global Logistics AG",
  "issuer_id": "CH-123.456.789",
  "created_at": "2026-03-21T07:00:00+01:00",
  "recipient": "Hauptzollamt München"
}
```

## data.json

```json title="data.json"
{
  "document_type": "customs_declaration",
  "declaration_number": "CU-2026-DE-00892",
  "declaration_type": "import",
  "submission_date": "2026-03-21",
  "declarant": {
    "name": "Global Logistics AG",
    "id": "CH-123.456.789",
    "eori_number": "DE123456789000001",
    "address": {
      "street": "Logistikweg 7",
      "city": "Zurich",
      "postal_code": "8001",
      "country": "CH"
    }
  },
  "consignee": {
    "name": "Global Logistics AG DE",
    "id": "DE987654321",
    "address": {
      "street": "Lagerstraße 1",
      "city": "Munich",
      "postal_code": "80339",
      "country": "DE"
    }
  },
  "customs_authority": {
    "name": "Hauptzollamt München",
    "country": "DE"
  },
  "goods": [
    {
      "line_number": 1,
      "description": "Industrial valve Type-A",
      "hs_code": "8481.80",
      "quantity": 50,
      "unit": "PCS",
      "net_weight_kg": "75.00",
      "gross_weight_kg": "85.00",
      "customs_value": { "amount": "1200.00", "currency": "EUR" },
      "country_of_origin": "DE"
    }
  ],
  "totals": {
    "customs_value": { "amount": "1200.00", "currency": "EUR" },
    "import_duty": { "amount": "0.00", "currency": "EUR" },
    "vat_import": { "amount": "228.00", "currency": "EUR" }
  },
  "transport": {
    "mode": "road",
    "border_crossing_point": "Kiefersfelden",
    "crossing_date": "2026-03-21"
  },
  "related_documents": [
    { "type": "invoice", "reference": "INV-2026-00142" },
    { "type": "nomination", "reference": "NOM-2026-00088" }
  ]
}
```

## Notes

- The `hs_code` (Harmonized System code) must be the 6-digit internationally standardized code. Individual countries may require 8- or 10-digit extensions — include these in the schema for the target authority.
- `related_documents` links the customs declaration to the corresponding invoice and nomination SDF documents by their business reference numbers (not `document_id`).
- For EU intra-community movements, customs declarations may not be required but Intrastat reports are. SDF supports Intrastat as a separate `document_type`.

## Validating

```bash
sdf validate customs_declaration.sdf
sdf sign customs_declaration.sdf --key-id production-key
```
