---
title: "About Etapsky"
description: "Etapsky Inc. builds open developer tools for structured document exchange. Founded 2026."
sidebar:
  label: "About"
  order: 1
---

Etapsky Inc. is a developer tools company building open infrastructure for structured document exchange. We make it practical for organizations to send and receive documents that carry their own data — eliminating the re-keying, OCR pipelines, and manual data entry that every document-intensive business relies on today.

## Mission

Documents move between organizations every day — invoices, purchase orders, nominations, government forms, contracts. The format they travel in is almost always PDF. PDF is excellent for humans. It is nearly useless for machines.

The receiving side either employs people to re-enter data, runs OCR that produces errors, or builds fragile parsing pipelines that break whenever the sender changes their template. This cost is so normalized that most organizations do not question it.

We question it. Our mission is to make structured document exchange the default — not a special integration project, but the baseline expectation for any document that crosses an organizational boundary.

## What We Build

Our flagship product is **SDF — Smart Document Format**. SDF is an open format standard that combines a human-readable PDF and a machine-readable JSON payload inside a single `.sdf` ZIP file. When two parties both use SDF, data extraction costs zero. There is no OCR pass, no re-keying, no parsing. The data arrives already structured.

SDF is general-purpose. It has no opinion about industry vertical, document type, or the size of the organizations exchanging documents. The same format works for:

- B2B invoicing between large enterprises
- B2G document submission to government agencies
- G2G interoperability between public sector systems
- Internal workflow documents in HR, procurement, and legal

The SDF ecosystem includes a TypeScript SDK, a Python SDK, a command-line tool, a schema registry, a self-hosted server, ERP connectors for SAP S/4HANA and Oracle Fusion Cloud, and native OS integration (macOS Quick Look, Windows registry, VS Code extension).

Beyond SDF, Etapsky is building additional developer tools in the structured data and document infrastructure space. Products will be announced as they reach public availability.

## Open Source Commitment

SDF and all Etapsky core libraries are published under the **Business Source License 1.1 (BUSL-1.1)**. The license converts automatically to **Apache-2.0 on 2030-03-17**. This means:

- The source is always available. You can read it, fork it, and use it in non-production environments without restriction.
- Production commercial use before the change date requires a license from Etapsky.
- On 2030-03-17, everything becomes fully open under Apache-2.0 — no conditions.

The SDF format specification itself (`spec/SDF_FORMAT.md`) is licensed under **CC-BY 4.0**. The spec is free for anyone to implement, reference, or extend without restriction.

See [Open Source](/company/open-source/) for the complete license details and contributing information.

## GitHub

All public code lives at [github.com/etapsky](https://github.com/etapsky).

| Repository | Description |
|---|---|
| [`etapsky/sdf`](https://github.com/etapsky/sdf) | Main monorepo — SDK, CLI, schema registry, server, spec |
| [`etapsky/sdf-cloud`](https://github.com/etapsky/sdf-cloud) | SaaS platform — api.etapsky.com, portal, marketing site |

## Founder

**Yunus YILDIZ** is the founder of Etapsky Inc. He designed the SDF format specification, built the initial implementation across all packages, and leads product development.

- GitHub: [@yunusyildiz-dev](https://github.com/yunusyildiz-dev)
- Company: [etapsky.com](https://etapsky.com)

## Contact

- Website: [etapsky.com](https://etapsky.com)
- GitHub Issues: [github.com/etapsky/sdf/issues](https://github.com/etapsky/sdf/issues)
- Email: contact@etapsky.com
