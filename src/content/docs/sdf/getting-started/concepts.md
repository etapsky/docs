---
title: "Core Concepts"
description: "Understand SDF's architecture: the ZIP container, four file layers, producer and consumer roles, and key design decisions."
sidebar:
  label: "Core Concepts"
  order: 3
---

This page explains the architectural decisions behind SDF. Understanding these concepts will help you use the format correctly and avoid common mistakes.

## The SDF File

Every `.sdf` file is a valid ZIP archive. You can rename any `.sdf` file to `.zip` and extract it with any standard archive tool. This is intentional: it means `.sdf` files are inspectable without any special software, and the format has zero dependency on proprietary container technology.

```
invoice.sdf  (valid ZIP archive)
├── visual.pdf    ← Human-readable PDF (any viewer opens it)
├── data.json     ← Machine-readable structured business data
├── schema.json   ← JSON Schema Draft 2020-12 (embedded, never a URL)
└── meta.json     ← SDF identity and provenance
```

Every file in this list is required. An SDF file missing any of them is invalid and will be rejected by `sdf validate` and `parseSDF`.

## The Visual Layer (visual.pdf)

`visual.pdf` is the document as humans see it. Any standard PDF viewer — Adobe Acrobat, Preview, a browser, an email client — can open it with no knowledge of SDF.

Two rules apply to the visual layer without exception:

**It MUST be self-contained.** All fonts, images, and color profiles must be embedded directly in the PDF. No external resource references are permitted. A viewer must be able to render the document correctly in a fully offline environment, with no network access.

**It MUST NOT contain executable content.** JavaScript, macros, and AcroForm scripts are prohibited. Producers MUST NOT embed executable content. Consumers MUST NOT execute any executable content they encounter in the visual layer.

These rules together provide a strong backward compatibility guarantee: a recipient with no SDF tooling can open the document in any PDF viewer, in any environment, and read exactly what the sender intended. This guarantee holds permanently, regardless of how SDF evolves.

## The Data Layer (data.json)

`data.json` holds the structured business data. For an invoice: line items, totals, payment details, party identifiers. For a nomination: cargo information, routing, vessel details. The exact structure depends on the document type.

Two rules govern `data.json`:

**It MUST validate against `schema.json`.** Producers validate before writing. Consumers can re-validate on receipt. A `data.json` that does not conform to the embedded schema is a malformed SDF file.

**It MUST NOT contain SDF metadata.** Fields like `sdf_version`, `document_id`, and `issued_at` belong in `meta.json`, not here. `data.json` is purely business data. This separation allows `meta.json` to evolve independently of your document schemas.

## The Schema (schema.json)

`schema.json` is a [JSON Schema Draft 2020-12](https://json-schema.org/draft/2020-12) document that defines the structure of `data.json`.

The schema is bundled inside the archive. It is never a URL reference. This is a hard requirement with a clear reason: SDF documents must be self-validating indefinitely. A document produced today must be fully validatable ten or twenty years from now, without any network requests to schema registries that may not exist.

```json title="schema.json — minimal invoice schema"
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["document_type", "invoice_number", "totals"],
  "properties": {
    "document_type":  { "type": "string" },
    "invoice_number": { "type": "string" },
    "totals": {
      "type": "object",
      "required": ["gross"],
      "properties": {
        "gross": {
          "type": "object",
          "required": ["amount", "currency"],
          "properties": {
            "amount":   { "type": "string" },
            "currency": { "type": "string" }
          }
        }
      }
    }
  }
}
```

If you maintain a schema registry, the `schema_id` field in `meta.json` can reference your registry's canonical URL for that schema version. The embedded `schema.json` is still the authoritative copy used for validation.

## The Meta (meta.json)

`meta.json` carries SDF-level identity and provenance. It answers: what is this file, who produced it, and when?

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

`document_id` is always a UUID v4 generated at produce time. It is an SDF-level identifier for this specific file — not a business identifier. Business identifiers (invoice number, purchase order reference, nomination ID) belong in `data.json`.

This distinction matters: two SDF files can contain the same invoice but have different `document_id` values. One might be an original, the other a corrected version. The business identifier in `data.json` connects them semantically. The `document_id` in `meta.json` uniquely identifies each physical file.

## Producer vs. Consumer

SDF defines two roles:

**Producer** — a system that creates `.sdf` files. The producer assembles the four layers, validates `data.json` against `schema.json`, generates a `document_id`, renders the PDF, and packages everything into a ZIP. In sdf-kit, this is `buildSDF`. In the Python SDK, this is `SDFProducer`.

**Consumer** — a system that reads `.sdf` files. The consumer extracts and parses the four layers, optionally re-validates the data against the embedded schema, and uses the PDF and/or JSON for downstream processing. In sdf-kit, this is `parseSDF` or `extractJSON`. In the Python SDK, this is `parse_sdf`.

Validation is a producer responsibility. A producer MUST NOT write a `.sdf` file that fails schema validation. A consumer encountering an invalid file has received a malformed document — it may re-validate for defense-in-depth, but it should not be in a position where it needs to.

:::caution
Never write a `.sdf` file without first validating `data.json` against `schema.json`. An invalid file on disk is worse than no file — it may propagate through downstream systems before the error is caught.
:::

## Backward Compatibility

SDF is designed so that zero-SDF systems still get value from SDF files. Any system that can open a PDF can open the visual layer of an `.sdf` file — rename it `.zip`, extract `visual.pdf`, done.

This backward compatibility guarantee is unconditional. It holds for:

- Email clients that open attachments
- ERP systems with PDF attachment viewers
- Document management systems
- Archival systems that render PDFs for display

No SDF-aware software is required to view the document. The PDF is always there, always complete, and always renderable.

## Monetary Amounts

Monetary amounts in SDF MUST always use the object form:

```json title="data.json — correct monetary amounts"
{
  "total": { "amount": "1713.60", "currency": "EUR" },
  "vat":   { "amount":  "273.60", "currency": "EUR" }
}
```

The `amount` field is always a **string**, not a number. The `currency` field is an ISO 4217 currency code.

Bare floating-point numbers are never acceptable:

```json title="data.json — incorrect (never do this)"
{
  "total": 1713.60,
  "vat":   273.60
}
```

The reason is floating-point precision. `0.1 + 0.2` in IEEE 754 double precision is `0.30000000000000004`. For financial documents, rounding errors are not acceptable. Using strings eliminates the problem entirely — the value in the JSON is exactly what the producer intended.

When you define your schema, model monetary amounts as the object structure shown above, and set `amount` to `{ "type": "string" }`.

## Dates

Dates and datetimes in SDF MUST always be ISO 8601 strings.

For calendar dates:

```json
"issue_date": "2026-03-15"
"due_date":   "2026-04-15"
```

For datetimes with timezone:

```json
"created_at": "2026-03-15T14:30:00+01:00"
```

Never use JavaScript `Date` objects, Unix timestamps (integer seconds or milliseconds), or locale-specific date strings (`"15.03.2026"`, `"March 15, 2026"`). ISO 8601 is unambiguous, sortable, and universally parseable.

## Summary

| Concept | Rule |
|---|---|
| File format | Valid ZIP archive, always |
| visual.pdf | Self-contained, no external resources, no executable content |
| data.json | Business data only, MUST validate against schema.json |
| schema.json | Embedded in archive, never a URL reference |
| meta.json | SDF identity only, no business data |
| document_id | UUID v4, generated at produce time, never derived from business data |
| Monetary amounts | `{ "amount": "string", "currency": "ISO4217" }`, never bare numbers |
| Dates | ISO 8601 strings, always |

## Next Steps

- [Quickstart](/sdf/getting-started/quickstart/) — See these concepts in practice with a working example
- [sdf-kit Reference](/sdf/sdf-kit/) — Full API: `buildSDF`, `parseSDF`, `extractJSON`, signing, validation
- [SDF Format Specification](/sdf/spec/) — The normative format specification
