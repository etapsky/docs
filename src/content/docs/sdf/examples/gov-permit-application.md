---
title: "Permit Application Example (B2G)"
description: "A B2G permit application SDF document — company applies for an operating or construction permit."
sidebar:
  label: "Permit Application (B2G)"
  order: 7
---

A **permit application** SDF document is submitted by a company to a regulatory or municipal authority. This example shows a construction permit application filed with a German municipal building authority (Bauamt).

## meta.json

```json title="meta.json"
{
  "sdf_version": "0.1",
  "document_id": "b5c6d7e8-9012-4def-ef01-555555555555",
  "document_type": "permit_application",
  "schema_id": "permit_application/v0.1",
  "issuer": "Acme Supplies GmbH",
  "issuer_id": "DE123456789",
  "created_at": "2026-03-18T11:00:00+01:00",
  "recipient": "Bauamt München"
}
```

## data.json

```json title="data.json"
{
  "document_type": "permit_application",
  "application_number": "PERM-2026-BAUA-00441",
  "permit_type": "construction",
  "submission_date": "2026-03-18",
  "applicant": {
    "name": "Acme Supplies GmbH",
    "id": "DE123456789",
    "legal_form": "GmbH",
    "address": {
      "street": "Industriestraße 42",
      "city": "Munich",
      "postal_code": "80331",
      "country": "DE"
    },
    "contact": {
      "name": "Yunus YILDIZ",
      "email": "yunus@acme-supplies.de",
      "phone": "+49 89 000 00 00"
    }
  },
  "authority": {
    "name": "Bauamt München",
    "department": "Baugenehmigungen",
    "city": "Munich",
    "country": "DE"
  },
  "project": {
    "title": "Warehouse Expansion — Building C",
    "description": "Addition of a 1,500 m² storage hall to the existing industrial site.",
    "site_address": {
      "street": "Industriestraße 44",
      "city": "Munich",
      "postal_code": "80331",
      "country": "DE"
    },
    "plot_number": "123/4",
    "estimated_construction_start": "2026-06-01",
    "estimated_construction_end": "2026-12-31",
    "estimated_cost": { "amount": "850000.00", "currency": "EUR" }
  },
  "declarations": [
    "The information provided is accurate to the best of our knowledge.",
    "We confirm compliance with local building regulations (BayBO)."
  ],
  "attachments": [
    { "type": "site_plan", "filename": "site_plan_v2.pdf" },
    { "type": "architectural_drawings", "filename": "drawings_building_c.pdf" }
  ]
}
```

## Notes

- `attachments` references documents that are included as additional files in the `.sdf` archive under the `vendor/` prefix or as part of the `visual.pdf` compound document.
- Government authorities will specify the exact `schema.json` required for permit applications. The schema enforces mandatory fields specific to the permit type and jurisdiction.
- Digital signatures are strongly recommended for permit applications — use `sdf sign` after validation.

## Validating and signing

```bash
sdf validate permit_application.sdf
sdf sign permit_application.sdf --key-id production-key
sdf verify permit_application.sdf
```
