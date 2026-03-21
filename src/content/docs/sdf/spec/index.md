---
title: "Format Specification"
description: "The SDF Format Specification v0.1 — normative reference for producers and consumers of .sdf files."
sidebar:
  label: "Overview"
  order: 1
---

# SDF Format Specification

**Status:** Draft v0.1
**License:** [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/) (specification text)
**Source:** [github.com/etapsky/sdf/spec/SDF_FORMAT.md](https://github.com/etapsky/sdf/blob/main/spec/SDF_FORMAT.md)

---

## What is SDF?

SDF (Smart Document Format) is an open standard that combines a document's visual representation (PDF) and its structured data (JSON) into a single `.sdf` file.

Today, documents travel as PDFs and the receiving system must re-enter the data manually or via OCR. SDF eliminates this: structured JSON travels alongside the visual. When both sender and receiver support SDF, data extraction has zero cost and zero error rate.

SDF is **general-purpose** — it makes no assumptions about document type, business sector, or the parties involved. It supports invoices, nominations, purchase orders, government forms, G2G data exchange, HR documents, and contracts. It is equally applicable to B2B, B2G, and G2G scenarios.

---

## Specification Sections

| # | Section | Description |
|---|---------|-------------|
| 1 | [Container Format](/sdf/spec/container) | ZIP structure, file manifest, naming rules, size limits |
| 2 | [meta.json — Identity Layer](/sdf/spec/meta-layer) | Document identity, provenance, required and optional fields |
| 3 | [data.json — Data Layer](/sdf/spec/data-layer) | Business data structure, constraints, monetary amounts |
| 4 | [schema.json — Schema Layer](/sdf/spec/schema-layer) | JSON Schema Draft 2020-12, bundling rules, authoring guidelines |
| 5 | [visual.pdf — Visual Layer](/sdf/spec/visual-layer) | PDF requirements, self-containment, security constraints |
| 6 | [Digital Signing](/sdf/spec/signing) | signature.sig, ECDSA P-256, RSA-2048, signing workflow |
| 7 | [Validation](/sdf/spec/validation) | Full validation pipeline, error handling, CLI and API usage |
| 8 | [Versioning](/sdf/spec/versioning) | sdf_version, forward compatibility, upgrade path |
| 9 | [Error Codes](/sdf/spec/error-codes) | Standard error codes, triggers, and typical causes |

---

## Roles: Producer vs Consumer

SDF defines two normative roles. A single system may act as both.

### Producer

A **producer** creates `.sdf` files. A conformant producer:

- MUST generate a valid ZIP archive with the `.sdf` extension.
- MUST include `visual.pdf`, `data.json`, `schema.json`, and `meta.json` in every archive.
- MUST assign a UUID v4 `document_id` at produce time.
- MUST validate `data.json` against `schema.json` before writing the archive.
- MUST embed all fonts, images, and color profiles in `visual.pdf`.
- MUST NOT include executable content (JavaScript, macros) in `visual.pdf`.
- MUST NOT reference external schemas by URL in `schema.json`.
- MUST NOT write bare numeric monetary amounts in `data.json`.

### Consumer

A **consumer** reads `.sdf` files. A conformant consumer:

- MUST verify the file is a valid ZIP archive before reading.
- MUST validate `meta.json` against the SDF meta schema.
- MUST validate `data.json` against the bundled `schema.json`.
- MUST enforce ZIP bomb protection (max 50 MB per entry, max 200 MB total uncompressed).
- MUST enforce path traversal protection on all archive entry paths.
- MUST NOT execute any scripts or macros found in `visual.pdf`.
- MUST NOT fetch external resources during parsing or validation.
- SHOULD verify `signature.sig` when present.

---

## Conformance Levels

SDF defines two conformance levels:

| Level | Description |
|-------|-------------|
| **Basic** | Implements container, meta.json, data.json, schema.json, and visual.pdf. Does not support signing. |
| **Full** | Implements all Basic requirements plus digital signing (signature.sig) and signature verification. |

All conformance levels require full validation pipeline compliance and all security requirements.

---

## Normative Language

This specification uses the following normative keywords per [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt):

- **MUST** — An absolute requirement.
- **MUST NOT** — An absolute prohibition.
- **SHOULD** — Recommended; valid reasons may exist to deviate, but the implications must be understood.
- **SHOULD NOT** — Not recommended; valid reasons may exist, but implications must be understood.
- **MAY** — Truly optional.

---

## Current Version

The current version of the SDF specification is **0.1 (Draft)**. This version covers core container structure, all four required layers, optional signing, and the validation pipeline.

Version 0.1 is feature-complete for Phase 1–4 of the Etapsky SDF project. Future versions will be backward-compatible unless a major version increment is made.

See [Versioning](/sdf/spec/versioning) for details on version negotiation.
