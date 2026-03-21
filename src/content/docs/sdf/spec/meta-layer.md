---
title: "meta.json — Identity Layer"
description: "meta.json is the identity and provenance record for an SDF document. Required fields, types, and validation rules."
sidebar:
  label: "meta.json"
  order: 3
---

# meta.json — Identity Layer

`meta.json` is the identity and provenance record of an SDF document. It answers the questions: what is this document, who issued it, and when was it created?

`meta.json` is intentionally separate from `data.json`. SDF metadata evolves independently of business document schemas. A change to the SDF specification (e.g., adding a new meta field) does not require changes to invoice schemas, nomination schemas, or any other domain-specific schema.

---

## Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sdf_version` | string | MUST | SDF spec version, e.g. `"0.1"` |
| `document_id` | string (UUID v4) | MUST | Globally unique document identifier |
| `document_type` | string | MUST | Document type, e.g. `"invoice"`, `"nomination"`, `"purchase_order"` |
| `issuer` | string | MUST | Human-readable name of the issuing party |
| `created_at` | string (ISO 8601) | MUST | Creation timestamp with timezone offset |
| `issuer_id` | string | SHOULD | Machine-readable issuer identifier (tax ID, VAT number, DUNS, etc.) |
| `recipient` | string | SHOULD | Human-readable name of the receiving party |
| `schema_id` | string (URI) | SHOULD | URI identifying the schema used in `schema.json` |
| `locale` | string (BCP 47) | MAY | Document locale, e.g. `"en-US"`, `"de-DE"`, `"tr-TR"` |
| `nomination_ref` | string | MAY | Reference key for nomination-to-invoice matching workflows |

---

## The `document_id` Rule

`document_id` MUST be a UUID v4 generated at produce time. It MUST NOT be derived from any business identifier.

Invoice numbers, PO numbers, nomination reference codes — these are business identifiers. They belong in `data.json`, not in `document_id`. Business identifiers are indexed separately in the SDF server layer for lookup and matching purposes.

The rationale: `document_id` is a globally unique, collision-resistant identifier for the SDF file itself. Two separately produced SDF files representing the same invoice are different SDF documents and MUST have different `document_id` values.

```typescript title="Correct document_id generation"
// Correct — crypto.randomUUID() produces UUID v4
const documentId = crypto.randomUUID();

// Wrong — derived from business data
const documentId = `inv-${invoiceNumber}`;  // MUST NOT do this
```

---

## Complete Example

```json title="meta.json"
{
  "sdf_version": "0.1",
  "document_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "document_type": "invoice",
  "schema_id": "https://etapsky.github.io/sdf/schemas/invoice/v0.1.json",
  "issuer": "Acme Supplies GmbH",
  "issuer_id": "DE123456789",
  "created_at": "2026-03-15T14:30:00+01:00",
  "recipient": "Global Logistics AG",
  "locale": "de-DE"
}
```

---

## Minimal Valid Example

For contexts where only required fields are known at produce time:

```json title="meta.json (minimal)"
{
  "sdf_version": "0.1",
  "document_id": "a1b2c3d4-e5f6-4789-abcd-ef0123456789",
  "document_type": "purchase_order",
  "issuer": "Procurement Department",
  "created_at": "2026-03-15T09:00:00Z"
}
```

---

## Validation

`meta.json` MUST validate against the SDF meta schema. Consumers MUST reject any archive where `meta.json` fails validation with `SDF_ERROR_INVALID_META`.

Validation rules enforced by the meta schema:

- `sdf_version` MUST be a string matching the pattern `^\d+\.\d+$`.
- `document_id` MUST be a string matching the UUID v4 pattern.
- `created_at` MUST be a string matching ISO 8601 with timezone (`date-time` format).
- `document_type` MUST be a non-empty string.
- `issuer` MUST be a non-empty string.

---

## Separation of Concerns

`meta.json` carries SDF-level metadata. It MUST NOT carry business-domain data. The following examples show correct vs incorrect placement:

| Data | Correct location | Wrong location |
|------|-----------------|----------------|
| SDF spec version | `meta.json` → `sdf_version` | `data.json` |
| Globally unique document ID | `meta.json` → `document_id` | `data.json` |
| Invoice number | `data.json` → `invoice_number` | `meta.json` |
| Line items | `data.json` → `line_items` | `meta.json` |
| Total amount | `data.json` → `total` | `meta.json` |
| Digital signature | `signature.sig` | `meta.json` value |

:::caution
A common mistake is placing business identifiers (invoice number, PO number) inside `meta.json` fields, or placing SDF metadata (`sdf_version`, `document_id`) inside `data.json`. Both patterns are non-conformant. Consumers that encounter `sdf_version` inside `data.json` SHOULD log a warning; this is a producer implementation error.
:::

---

## Extending meta.json

`meta.json` MUST NOT contain fields not defined in this specification at the root level. Producers that need to attach proprietary metadata SHOULD use `vendor/` prefixed fields or place the data in a separate `vendor/<name>/meta.json` entry.

The SDF specification committee may add new optional fields in minor versions. These additions are backward-compatible: consumers on older minor versions SHOULD ignore unknown fields.
