---
title: "schema.json — Schema Layer"
description: "schema.json is a JSON Schema Draft 2020-12 document bundled inside the SDF archive. Validation rules and schema authoring guidelines."
sidebar:
  label: "schema.json"
  order: 5
---

# schema.json — Schema Layer

`schema.json` is a [JSON Schema Draft 2020-12](https://json-schema.org/draft/2020-12/release-notes) document bundled inside the SDF archive. It defines the expected structure, types, and constraints for `data.json`.

---

## Bundling Requirement

`schema.json` MUST be bundled inside the archive. External `$ref` URIs that require network access are forbidden.

**Why bundled?** SDF documents are designed to be self-validating decades after creation. A schema hosted at an external URL may be unavailable, changed, or deleted. By bundling the schema inside the archive, an SDF document carries everything needed to validate itself — offline, without any network dependency.

Consumers MUST NOT fetch any URI during schema loading or validation. If a `$ref` in `schema.json` resolves to an external URL, the consumer MUST reject the archive with `SDF_ERROR_INVALID_SCHEMA`.

---

## $id Field

`schema.json` SHOULD include a `$id` field containing a URI that identifies this specific schema version.

```json title="Recommended $id format"
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://etapsky.github.io/sdf/schemas/invoice/v0.1.json",
  ...
}
```

The `$id` URI is informational — it identifies the schema, not its network location. The schema MUST be valid when evaluated offline regardless of whether this URI is reachable. The same URI SHOULD appear in `meta.json` → `schema_id`.

---

## Recommended Practices

### additionalProperties: false

Schemas SHOULD set `additionalProperties: false` at the root level and on all object definitions. This prevents undocumented fields from silently passing validation.

:::tip
Using `additionalProperties: false` is one of the most effective ways to catch producer bugs early. Without it, a field with a typo in its name (e.g., `totla` instead of `total`) passes validation silently. With it, the producer gets an immediate schema mismatch error.
:::

### $defs for Reusable Types

Use `$defs` to define reusable type definitions (monetary amounts, addresses, line items). Reference them with `$ref: "#/$defs/TypeName"`. Since all references are internal, they satisfy the bundling requirement.

### Required Fields

SHOULD declare all mandatory fields explicitly in `required` arrays. This makes validation errors clear and actionable.

---

## Monetary Amount Definition

The SDF standard monetary amount structure SHOULD be defined in `$defs` and referenced wherever amounts appear:

```json title="MonetaryAmount definition in $defs"
{
  "$defs": {
    "MonetaryAmount": {
      "type": "object",
      "required": ["amount", "currency"],
      "additionalProperties": false,
      "properties": {
        "amount": {
          "type": "string",
          "pattern": "^-?\\d+(\\.\\d+)?$",
          "description": "Decimal amount as a string to preserve precision"
        },
        "currency": {
          "type": "string",
          "pattern": "^[A-Z]{3}$",
          "description": "ISO 4217 currency code"
        }
      }
    }
  }
}
```

Usage anywhere in the schema:

```json
"unit_price": { "$ref": "#/$defs/MonetaryAmount" },
"total":       { "$ref": "#/$defs/MonetaryAmount" }
```

---

## Minimal Valid Schema

The simplest conformant `schema.json` that validates a minimal document:

```json title="schema.json (minimal)"
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://etapsky.github.io/sdf/schemas/generic/v0.1.json",
  "type": "object",
  "required": ["document_type"],
  "additionalProperties": false,
  "properties": {
    "document_type": {
      "type": "string",
      "minLength": 1
    }
  }
}
```

---

## Full Invoice Schema Excerpt

The following is a representative `schema.json` for an invoice document:

```json title="schema.json (invoice excerpt)"
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://etapsky.github.io/sdf/schemas/invoice/v0.1.json",
  "title": "SDF Invoice Schema v0.1",
  "type": "object",
  "required": [
    "document_type",
    "invoice_number",
    "issue_date",
    "due_date",
    "seller",
    "buyer",
    "line_items",
    "subtotal",
    "total"
  ],
  "additionalProperties": false,
  "properties": {
    "document_type": {
      "type": "string",
      "const": "invoice"
    },
    "invoice_number": {
      "type": "string",
      "minLength": 1
    },
    "purchase_order_ref": {
      "type": "string"
    },
    "issue_date": {
      "type": "string",
      "format": "date"
    },
    "due_date": {
      "type": "string",
      "format": "date"
    },
    "currency": {
      "type": "string",
      "pattern": "^[A-Z]{3}$"
    },
    "seller": { "$ref": "#/$defs/Party" },
    "buyer":  { "$ref": "#/$defs/Party" },
    "line_items": {
      "type": "array",
      "minItems": 1,
      "items": { "$ref": "#/$defs/LineItem" }
    },
    "subtotal":   { "$ref": "#/$defs/MonetaryAmount" },
    "tax_rate":   { "type": "string", "pattern": "^\\d+(\\.\\d+)?$" },
    "tax_amount": { "$ref": "#/$defs/MonetaryAmount" },
    "total":      { "$ref": "#/$defs/MonetaryAmount" },
    "payment_terms": { "type": "string" },
    "bank_account": { "$ref": "#/$defs/BankAccount" },
    "vendor_acme": {
      "type": "object",
      "additionalProperties": true
    }
  },
  "$defs": {
    "MonetaryAmount": {
      "type": "object",
      "required": ["amount", "currency"],
      "additionalProperties": false,
      "properties": {
        "amount":   { "type": "string", "pattern": "^-?\\d+(\\.\\d+)?$" },
        "currency": { "type": "string", "pattern": "^[A-Z]{3}$" }
      }
    },
    "Address": {
      "type": "object",
      "required": ["street", "city", "postal_code", "country"],
      "additionalProperties": false,
      "properties": {
        "street":      { "type": "string" },
        "city":        { "type": "string" },
        "postal_code": { "type": "string" },
        "country":     { "type": "string", "pattern": "^[A-Z]{2}$" }
      }
    },
    "Party": {
      "type": "object",
      "required": ["name"],
      "additionalProperties": false,
      "properties": {
        "name":    { "type": "string", "minLength": 1 },
        "vat_id":  { "type": "string" },
        "address": { "$ref": "#/$defs/Address" }
      }
    },
    "LineItem": {
      "type": "object",
      "required": ["line_number", "description", "quantity", "unit", "unit_price", "subtotal"],
      "additionalProperties": false,
      "properties": {
        "line_number":  { "type": "integer", "minimum": 1 },
        "description":  { "type": "string", "minLength": 1 },
        "quantity":     { "type": "number", "exclusiveMinimum": 0 },
        "unit":         { "type": "string" },
        "unit_price":   { "$ref": "#/$defs/MonetaryAmount" },
        "subtotal":     { "$ref": "#/$defs/MonetaryAmount" }
      }
    },
    "BankAccount": {
      "type": "object",
      "required": ["iban"],
      "additionalProperties": false,
      "properties": {
        "iban":      { "type": "string" },
        "bic":       { "type": "string" },
        "bank_name": { "type": "string" }
      }
    }
  }
}
```

---

## Validation

Consumers MUST validate `schema.json` itself before using it to validate `data.json`. An archive containing a malformed or invalid JSON Schema MUST be rejected with `SDF_ERROR_INVALID_SCHEMA`.

The validation sequence is:

1. Parse `schema.json` as JSON. If parse fails: `SDF_ERROR_INVALID_SCHEMA`.
2. Validate that `schema.json` is a valid JSON Schema Draft 2020-12 document.
3. Check that no `$ref` resolves to an external URI. If any external ref: `SDF_ERROR_INVALID_SCHEMA`.
4. Use the validated schema to validate `data.json`. If data fails: `SDF_ERROR_SCHEMA_MISMATCH`.

---

## Schema Versioning

When a schema evolves, producers MUST update the `$id` URI to reflect the new version. The version SHOULD appear in the URI path:

```
https://etapsky.github.io/sdf/schemas/invoice/v0.1.json  ← initial
https://etapsky.github.io/sdf/schemas/invoice/v0.2.json  ← backward-compatible update
https://etapsky.github.io/sdf/schemas/invoice/v1.0.json  ← breaking change
```

The corresponding `meta.json` → `schema_id` MUST match the `$id` of the bundled `schema.json`.

Use the [SDF Schema Registry](/sdf/server/schema-registry) to manage schema versions, detect breaking changes between versions, and run data migrations.
