---
title: "JSON Schema Reference"
description: "Official SDF JSON Schema definitions for meta.json and data.json layers."
sidebar:
  label: "JSON Schemas"
  order: 2
---

SDF uses **JSON Schema Draft 2020-12** for both `meta.json` validation and `data.json` validation. Schemas are always bundled inside the `.sdf` archive — external URL references are prohibited by design.

## Schema files

| Schema | File in archive | GitHub source |
|--------|----------------|---------------|
| `meta.json` schema | (validated by sdf-kit, not bundled as a separate file) | [`spec/schemas/meta.schema.json`](https://github.com/etapsky/sdf/blob/main/spec/schemas/meta.schema.json) |
| `data.json` schema | `schema.json` (inside the `.sdf` archive) | [`spec/schemas/data.schema.json`](https://github.com/etapsky/sdf/blob/main/spec/schemas/data.schema.json) |

## `meta.json` schema

`meta.json` has a fixed structure defined by the SDF spec. All fields below are validated by `sdf-kit` during `parseSDF()` and `buildSDF()`.

```json title="spec/schemas/meta.schema.json (abridged)"
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "sdf/meta/v0.1",
  "type": "object",
  "required": ["sdf_version", "document_id", "document_type", "schema_id", "issuer", "created_at"],
  "properties": {
    "sdf_version": {
      "type": "string",
      "description": "SDF format version. Currently '0.1'."
    },
    "document_id": {
      "type": "string",
      "format": "uuid",
      "description": "UUID v4 generated at production time. Never derived from business data."
    },
    "document_type": {
      "type": "string",
      "description": "Human-readable document type. Examples: 'invoice', 'nomination', 'purchase_order', 'tax_declaration'."
    },
    "schema_id": {
      "type": "string",
      "description": "Identifier of the schema used for data.json. Format: 'type/version' (e.g., 'invoice/v0.1')."
    },
    "issuer": {
      "type": "string",
      "description": "Human-readable name of the document issuer."
    },
    "issuer_id": {
      "type": "string",
      "description": "Machine-readable identifier of the issuer (tax ID, registration number, etc.)."
    },
    "created_at": {
      "type": "string",
      "format": "date-time",
      "description": "ISO 8601 timestamp of document creation."
    },
    "recipient": {
      "type": "string",
      "description": "Human-readable name of the intended recipient."
    },
    "locale": {
      "type": "string",
      "description": "BCP 47 language tag for the document's primary language (e.g., 'tr-TR', 'de-DE', 'en-US')."
    },
    "nomination_ref": {
      "type": "string",
      "description": "Optional. Links a nomination document to its originating purchase order reference."
    }
  },
  "additionalProperties": false
}
```

## `data.json` schema (`schema.json` in archive)

The `schema.json` inside every `.sdf` archive is a JSON Schema Draft 2020-12 document that describes the `data.json` structure for that specific document type. There is no single universal data schema — each document type (invoice, nomination, purchase order, etc.) has its own schema.

### Requirements for bundled schemas

1. **Self-contained:** No `$ref` URLs that point to external resources. All definitions must be inlined or use local `$defs`.
2. **Draft 2020-12:** The `$schema` key must be `"https://json-schema.org/draft/2020-12/schema"`.
3. **Strict:** Set `"additionalProperties": false` at the top level and on all nested objects to prevent silent data loss.
4. **Monetary amounts:** Always validate money fields as objects with `amount` (string) and `currency` (string) — never as bare numbers.

### Minimal data schema example

```json title="invoice.schema.json"
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "invoice/v0.1",
  "type": "object",
  "required": ["document_type", "invoice_number", "issue_date", "issuer", "recipient", "totals"],
  "properties": {
    "document_type": { "type": "string", "const": "invoice" },
    "invoice_number": { "type": "string" },
    "issue_date": { "type": "string", "format": "date" },
    "due_date": { "type": "string", "format": "date" },
    "issuer": {
      "type": "object",
      "required": ["name", "id"],
      "properties": {
        "name": { "type": "string" },
        "id": { "type": "string" }
      },
      "additionalProperties": false
    },
    "recipient": {
      "type": "object",
      "required": ["name", "id"],
      "properties": {
        "name": { "type": "string" },
        "id": { "type": "string" }
      },
      "additionalProperties": false
    },
    "totals": {
      "type": "object",
      "required": ["gross"],
      "properties": {
        "net":   { "$ref": "#/$defs/MoneyAmount" },
        "vat":   { "$ref": "#/$defs/MoneyAmount" },
        "gross": { "$ref": "#/$defs/MoneyAmount" }
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false,
  "$defs": {
    "MoneyAmount": {
      "type": "object",
      "required": ["amount", "currency"],
      "properties": {
        "amount":   { "type": "string", "pattern": "^[0-9]+\\.[0-9]{2}$" },
        "currency": { "type": "string", "pattern": "^[A-Z]{3}$" }
      },
      "additionalProperties": false
    }
  }
}
```

## Schema registry

SDF Server includes a schema registry (`@etapsky/sdf-schema-registry`) for versioned schema management:

```typescript
import { SchemaRegistry } from '@etapsky/sdf-schema-registry';

const registry = new SchemaRegistry();
registry.register('invoice/v0.1', invoiceSchema);
registry.register('invoice/v1.0', invoiceV1Schema);

// Resolve by schema_id from meta.json
const schema = registry.resolve('invoice/v0.1');

// Diff two versions — detect breaking vs non-breaking changes
const diff = diffSchemas('invoice/v0.1', 'invoice/v1.0', registry);
console.log(diff.breakingChanges);
```

See the [sdf-schema-registry documentation](/sdf/sdf-schema-registry) for the full API.
