---
title: "data.json — Data Layer"
description: "data.json carries the structured business data of an SDF document. Schema, constraints, and best practices."
sidebar:
  label: "data.json"
  order: 4
---

# data.json — Data Layer

`data.json` carries the structured business data of an SDF document. It is the machine-readable layer — the payload that receiving systems consume without OCR, without re-entry, and without parsing a PDF.

`data.json` is intentionally separate from `meta.json`. SDF identity and provenance metadata evolves independently of business schemas. Invoice schemas, nomination schemas, and purchase order schemas can be versioned and evolved without touching the SDF meta schema.

---

## Content Rules

### Validation against schema.json

`data.json` MUST validate against the bundled `schema.json`. Producers MUST validate before writing the archive. Consumers MUST validate after reading the archive.

An archive where `data.json` fails validation against `schema.json` MUST be rejected with `SDF_ERROR_SCHEMA_MISMATCH`.

### Reserved Keys

The following top-level keys in `data.json` are reserved for future SDF use and MUST NOT be used by producers:

- `_sdf`
- `_meta`
- `_signature`

Producers MUST NOT use these keys. Consumers that encounter them SHOULD log a warning.

### No SDF Metadata

`data.json` MUST NOT contain SDF-level metadata. The following fields belong in `meta.json` and are forbidden at the root of `data.json`:

- `sdf_version`
- `document_id`
- `schema_id`
- `created_at` (as an SDF timestamp — use domain-specific date fields instead)

---

## Monetary Amounts

All monetary amounts in `data.json` MUST be represented as an object with `amount` (string) and `currency` (ISO 4217 code). Bare numeric amounts are forbidden.

```json title="Correct monetary amount"
{
  "unit_price": { "amount": "149.99", "currency": "EUR" },
  "total":      { "amount": "1250.00", "currency": "USD" },
  "tax":        { "amount": "200.00", "currency": "USD" }
}
```

```json title="Wrong — bare numbers (non-conformant)"
{
  "unit_price": 149.99,
  "total": 1250.00
}
```

The rationale: floating-point representation introduces precision loss that is unacceptable in financial documents. Representing amounts as strings preserves exact decimal precision. The `schema.json` `$defs` section SHOULD define a reusable `MonetaryAmount` type enforcing this structure.

---

## Dates

All date and timestamp values in `data.json` MUST be ISO 8601 strings.

| Format | When to use | Example |
|--------|-------------|---------|
| `date` (YYYY-MM-DD) | Calendar dates without time | `"2026-03-15"` |
| `date-time` (with timezone) | Timestamps with timezone offset | `"2026-03-15T14:30:00+01:00"` |
| `date-time` (UTC) | Timestamps in UTC | `"2026-03-15T13:30:00Z"` |

Bare numeric timestamps (Unix epoch integers) MUST NOT be used for date fields.

---

## Recommended Structure

### document_type Field

`data.json` SHOULD include a `document_type` field at the root level that matches the value in `meta.json`. This makes the data layer self-describing when read in isolation.

```json
{
  "document_type": "invoice",
  ...
}
```

### Identifier Fields

Business identifiers (invoice number, PO number, nomination ref) MUST be placed in `data.json`. They MUST NOT be used as the `document_id` in `meta.json`.

---

## Invoice Example

The following is a complete `data.json` for an invoice document:

```json title="data.json (invoice)"
{
  "document_type": "invoice",
  "invoice_number": "INV-2026-00142",
  "purchase_order_ref": "PO-2026-0088",
  "issue_date": "2026-03-15",
  "due_date": "2026-04-14",
  "currency": "EUR",
  "seller": {
    "name": "Acme Supplies GmbH",
    "vat_id": "DE123456789",
    "address": {
      "street": "Industriestraße 42",
      "city": "Frankfurt am Main",
      "postal_code": "60329",
      "country": "DE"
    }
  },
  "buyer": {
    "name": "Global Logistics AG",
    "vat_id": "CH987654321",
    "address": {
      "street": "Hafen Allee 7",
      "city": "Basel",
      "postal_code": "4056",
      "country": "CH"
    }
  },
  "line_items": [
    {
      "line_number": 1,
      "description": "Industrial Valve Assembly, 2\" DN50",
      "quantity": 50,
      "unit": "pcs",
      "unit_price": { "amount": "84.00", "currency": "EUR" },
      "subtotal":   { "amount": "4200.00", "currency": "EUR" }
    },
    {
      "line_number": 2,
      "description": "Pressure Sensor Kit",
      "quantity": 10,
      "unit": "pcs",
      "unit_price": { "amount": "320.00", "currency": "EUR" },
      "subtotal":   { "amount": "3200.00", "currency": "EUR" }
    }
  ],
  "subtotal":   { "amount": "7400.00", "currency": "EUR" },
  "tax_rate":   "0.19",
  "tax_amount": { "amount": "1406.00", "currency": "EUR" },
  "total":      { "amount": "8806.00", "currency": "EUR" },
  "payment_terms": "Net 30",
  "bank_account": {
    "iban": "DE89370400440532013000",
    "bic": "COBADEFFXXX",
    "bank_name": "Commerzbank AG"
  }
}
```

---

## Separation of Concerns

| Data | Correct location | Wrong location |
|------|-----------------|----------------|
| Invoice number | `data.json` → `invoice_number` | `meta.json` |
| Line items | `data.json` → `line_items` | `meta.json` |
| Monetary totals | `data.json` → `total` | `meta.json` |
| SDF spec version | `meta.json` → `sdf_version` | `data.json` |
| Document UUID | `meta.json` → `document_id` | `data.json` |
| Validation rules | `schema.json` | `data.json` or `meta.json` |

---

## Vendor Extensions

Producers that need to include non-standard fields in `data.json` SHOULD use a `vendor_` prefix or a namespaced key to avoid conflicts with future SDF standard fields.

```json title="Vendor-extended data.json"
{
  "document_type": "invoice",
  "invoice_number": "INV-001",
  "total": { "amount": "8806.00", "currency": "EUR" },
  "vendor_acme": {
    "internal_cost_center": "CC-4410",
    "erp_posting_date": "2026-03-16"
  }
}
```

The `schema.json` MUST account for any vendor-extended fields to ensure `data.json` remains valid.
