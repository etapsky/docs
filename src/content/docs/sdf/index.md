---
title: "SDF — Smart Document Format"
description: "SDF is an open format that combines a human-readable PDF and machine-readable JSON in a single ZIP file. No OCR, no re-keying."
sidebar:
  label: "Introduction"
  order: 1
---

SDF (Smart Document Format) is an open standard that packages a human-readable PDF and machine-readable structured data in a single `.sdf` file.

## The Problem

Every day, businesses exchange documents as PDFs. The receiving system cannot read that data — it has to extract it. In practice, this means one of two things: someone re-keys the information manually, or the recipient runs OCR and hopes the extraction is accurate.

Both approaches are slow, expensive, and error-prone. A 0.1% OCR error rate across millions of invoices is a significant liability. Manual re-keying is worse.

The problem compounds across system boundaries. A supplier sends a PDF invoice. The buyer's ERP operator opens it, reads the numbers, and types them in. The data was structured at the source — it became unstructured the moment it was rendered to PDF — and now has to become structured again on the other end.

## How SDF Solves It

SDF keeps the structured data alongside the visual. Every `.sdf` file is a standard ZIP archive containing both layers:

- **visual.pdf** — a standard PDF that any viewer can open. No special software required. A recipient who has never heard of SDF can still open the document and read it.
- **data.json** — the machine-readable business data. Structured, typed, and validated against a schema.

When both the sender and receiver support SDF, data extraction costs zero. The JSON is already there. When the receiver does not support SDF, they open the PDF exactly as before. There is no downside to adopting SDF unilaterally.

:::note
SDF is designed for incremental adoption. A sender can start producing `.sdf` files today without requiring any changes on the receiver's side.
:::

## File Anatomy

Every `.sdf` file contains exactly four files:

```
invoice.sdf  (valid ZIP archive)
├── visual.pdf    ← Human-readable PDF (any viewer opens it)
├── data.json     ← Machine-readable structured business data
├── schema.json   ← JSON Schema Draft 2020-12 (embedded, never a URL)
└── meta.json     ← SDF identity and provenance
```

**visual.pdf** is the document as humans see it. All fonts and images are embedded — the file is fully self-contained. It contains no executable content: no JavaScript, no macros, no AcroForm scripts.

**data.json** holds the business data. For an invoice: line items, amounts, dates, party identifiers. For a nomination: cargo details, routing, vessel information. The structure is defined by the accompanying schema.

**schema.json** is a JSON Schema Draft 2020-12 document bundled inside the archive. Validation is fully offline. No network requests are made during parsing or validation. A document produced today will validate correctly decades from now, without any external dependencies.

**meta.json** holds SDF-level identity and provenance — not business data. It carries a UUID that identifies this specific SDF document, the document type, the issuer, and when the file was created.

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

## Use Cases

SDF is general-purpose. It imposes no assumptions about the document type, the industry, or the parties involved.

| Category | Document types |
|---|---|
| **B2B** | Invoice, purchase order, nomination, delivery note, contract, certificate of origin |
| **B2G** | Tax declaration, customs declaration, permit application, compliance report |
| **G2G** | Health record exchange, regulatory filing, cross-border data transfer |

The format has no built-in concept of "invoice" or "customs form." The schema embedded in each file defines what data it contains. A government can define a schema for permit applications. A logistics company can define a schema for nominations. Both use the same format.

## SDF vs. ZUGFeRD and XRechnung

ZUGFeRD and XRechnung solve a similar problem in the EU invoice space. SDF differs in scope and approach.

| Feature | SDF | ZUGFeRD | XRechnung |
|---|---|---|---|
| Data format | JSON | XML | XML |
| Document types | General purpose | Invoices only | Invoices only |
| Offline validation | Yes | Partial | Partial |
| Backward compatibility | Any PDF viewer | Any PDF viewer | No visual layer |
| Language / region | Any | EU-focused | DE/EU focused |
| Schema embedding | Bundled in archive | External | External |
| Custom document types | Yes | No | No |

ZUGFeRD and XRechnung are invoice standards. SDF is a document format. If you need to exchange invoices with German public authorities, XRechnung compliance is a legal requirement — SDF does not replace that. If you need a general-purpose structured document format across document types and sectors, SDF is the right choice.

:::tip
SDF uses JSON instead of XML as a deliberate design decision. JSON is the native format of modern APIs, and JSON Schema (Draft 2020-12) provides strong, standardized validation. This is a fundamental differentiator from ZUGFeRD and XRechnung.
:::

## Next Steps

- [Quickstart](/sdf/getting-started/quickstart/) — Produce and read your first `.sdf` file in 5 minutes
- [Installation](/sdf/getting-started/installation/) — Install sdf-kit, sdf-cli, and the Python SDK
- [Core Concepts](/sdf/getting-started/concepts/) — Understand the architecture in depth
