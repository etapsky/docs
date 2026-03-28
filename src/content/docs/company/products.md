---
title: "Products"
description: "Etapsky product portfolio — SDF (Smart Document Format) and upcoming developer tools."
sidebar:
  label: "Products"
  order: 2
---

## SDF — Smart Document Format

SDF is an open format standard for documents that carry their own data. Every `.sdf` file is a standard ZIP archive with a defined internal structure:

```
document.sdf  (ZIP)
├── visual.pdf    ← Human-readable layer — opens in any PDF viewer
├── data.json     ← Machine-readable layer — structured business data
├── schema.json   ← JSON Schema Draft 2020-12 — embedded for offline validation
└── meta.json     ← Identity, provenance, and format metadata
```

The two layers are independent. A recipient without SDF tooling opens `visual.pdf` normally. A recipient with SDF tooling reads `data.json` directly — no OCR, no parsing, no manual entry.

SDF is general-purpose. It does not assume a document type, industry vertical, or size of organization. The same format handles invoices, nominations, purchase orders, government forms, HR documents, and contracts.

:::note
SDF is not an EDI replacement. It is a document format — designed for the cases where a human-readable representation is required alongside the machine-readable data.
:::

### Components

The SDF ecosystem consists of six published packages and two supporting tools.

#### sdf-kit — TypeScript SDK

`@etapsky/sdf-kit` is the reference implementation of the SDF format in TypeScript. It covers the full document lifecycle:

| Module | Exports | Description |
|--------|---------|-------------|
| `producer` | `buildSDF()`, `generatePDF()`, `packZIP()` | Assemble a valid `.sdf` file |
| `reader` | `parseSDF()`, `extractJSON()`, `getVisual()` | Read and extract from `.sdf` |
| `validator` | `validateSchema()`, `validateMeta()`, `checkVersion()` | Validate against schema and spec |
| `signer` | `sign()`, `verify()`, `generateKeyPair()` | ECDSA-P256 / RSA-2048 digital signatures |

- **npm:** `@etapsky/sdf-kit@0.2.2`
- **Docs:** [sdf-kit reference](/sdf/sdf-kit/)

#### sdf-cli — Command-Line Tool

`@etapsky/sdf-cli` provides a terminal interface for all SDF operations. It is the fastest way to inspect, validate, and sign `.sdf` files without writing code.

Commands: `inspect`, `validate`, `sign`, `verify`, `keygen`, `wrap`, `convert`, `schema`

- **npm:** `@etapsky/sdf-cli@0.3.2`
- **Homebrew:** `brew install etapsky/tap/sdf`
- **Binaries:** macOS (arm64, x64) · Linux (x64, arm64) — available on GitHub Releases
- **Docs:** [sdf-cli reference](/sdf/sdf-cli/)

#### sdf-schema-registry — Schema Versioning

`@etapsky/sdf-schema-registry` provides schema lifecycle management for SDF document types. It handles registration, versioning, breaking-change detection, and migration between schema versions.

| Export | Description |
|--------|-------------|
| `SchemaRegistry` | Register, resolve, and list schemas |
| `diffSchemas()` | Detect breaking and non-breaking changes between versions |
| `MigrationEngine` | Transform documents between schema versions |

- **npm:** `@etapsky/sdf-schema-registry@0.1.1`
- **Docs:** [Schema Registry reference](/sdf/sdf-schema-registry/)

#### sdf-server-core — Self-Hosted Server

`@etapsky/sdf-server-core` is the Fastify 5 server package that powers both the self-hosted SDF server and the api.etapsky.com SaaS backend. It includes:

- REST API for upload, download, validation, signing, and schema registry
- Multi-tenant API key and SAML 2.0 SSO authentication
- BullMQ-based async job queue (validate, sign, webhook delivery)
- Native S3/MinIO object storage (no AWS SDK — native SigV4)
- SAP S/4HANA and Oracle Fusion Cloud ERP connectors
- Append-only audit log

- **npm:** `@etapsky/sdf-server-core@0.1.6`
- **Docs:** [SDF Server reference](/sdf/sdf-server/)

#### Python SDK

`etapsky-sdf` is a full-featured Python implementation of the SDF format. It supports producing, reading, validating, and signing `.sdf` files using the same format spec as the TypeScript implementation.

Dependencies: `cryptography`, `jsonschema`, `reportlab`

- **PyPI:** `etapsky-sdf@0.1.1`
- **Docs:** [Python SDK reference](/sdf/sdk-python/)

#### cloud-sdk — SaaS API Client

`@etapsky/cloud-sdk` is the TypeScript client for the managed api.etapsky.com service. It wraps upload, download, signing, and verification behind a typed interface that handles authentication and error handling.

- **npm:** `@etapsky/cloud-sdk@0.1.0`
- **Docs:** [Cloud SDK reference](/sdf/cloud-sdk/)

### Tooling

| Tool | Description |
|------|-------------|
| VS Code Extension | Inspect, validate, and preview `.sdf` files directly in the editor |
| macOS Quick Look | Native preview plugin — opens `.sdf` files in Finder Quick Look |
| Windows Registry | File association and icon registration for `.sdf` on Windows |

### Deployment Options

SDF gives you a choice of deployment models.

**Self-hosted**

Run `apps/sdf-server` on your own infrastructure. You own the data, the keys, and the configuration. Suitable for enterprises that cannot route documents through external services, or for on-premises SAP/Oracle environments.

Requirements: Node.js 22, PostgreSQL 17, Redis, S3-compatible storage (MinIO works locally).

**SaaS — api.etapsky.com**

Use the managed service at `api.etapsky.com`. No infrastructure to run. Connect using `@etapsky/cloud-sdk` or any HTTP client with your API key. Suitable for teams that want to start immediately without operating a server.

:::tip
You can use `sdf-kit` and `sdf-cli` entirely client-side without a server. The server is only needed if you want centralized storage, async processing, ERP connectors, or multi-tenant API key management.
:::

---

## Coming Soon

Etapsky is building additional developer tools beyond SDF. These products are in active development and will be documented here upon public release.

If you have a use case you would like to discuss before a product is available, reach out at hello@etapsky.com or open a discussion on [GitHub](https://github.com/orgs/etapsky/discussions).
