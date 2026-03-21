---
title: "Changelog"
description: "SDF format and package release history."
sidebar:
  label: "Changelog"
  order: 3
---

All notable changes to the SDF format and packages are documented here. Package versioning follows [Semantic Versioning](https://semver.org/).

---

## `@etapsky/sdf-kit` — Core SDK

### 0.2.2 — 2026-03-15

- **Fix:** `packContainer` now validates that all required archive entries are present before writing the ZIP buffer. Previously a missing `schema.json` would produce a structurally invalid `.sdf` file without error.
- **Fix:** `generatePDF()` correctly embeds fonts in subsetted form. Full font embedding is no longer the default (reduces visual.pdf size by 30–60% for Latin scripts).
- **Improvement:** `parseSDF()` now returns typed `SDFDocument` rather than `any` for all sub-documents.

### 0.2.1 — 2026-02-28

- **Fix:** ZIP bomb protection threshold corrected to 200 MB total uncompressed (was incorrectly set to 20 MB).
- **Fix:** Path traversal check now rejects entries with URL-encoded `%2e%2e` sequences in addition to literal `..`.

### 0.2.0 — 2026-02-10

- **Feature:** `sign()` and `verify()` using ECDSA P-256 via Web Crypto API.
- **Feature:** `generateKeyPair()` helper for ECDSA P-256 and RSA-2048.
- **Breaking:** `buildSDF()` signature changed — `visual` parameter renamed to `pdfBytes` for clarity.

### 0.1.0 — 2026-01-15

Initial public release. Includes `buildSDF()`, `parseSDF()`, `validateSchema()`, `validateMeta()`, `checkVersion()`.

---

## `@etapsky/sdf-cli` — Command-Line Interface

### 0.3.0 — 2026-03-15

- **Feature:** `sdf convert` — converts ZUGFeRD/XRechnung XML invoices to SDF format (best-effort field mapping).
- **Feature:** `sdf schema` — schema registry commands: `list`, `show`, `diff`, `add`.
- **Feature:** `--json` flag on `validate` and `inspect` for machine-readable output.
- **Fix:** `sdf keygen` now writes the private key in PKCS#8 PEM format on all platforms (was raw DER on Windows).

### 0.2.0 — 2026-02-10

- **Feature:** `sdf sign` and `sdf verify` commands.
- **Feature:** `sdf keygen` — generates ECDSA P-256 or RSA-2048 key pairs.
- **Feature:** `sdf wrap` — wraps an existing PDF + JSON pair into a `.sdf` archive.

### 0.1.0 — 2026-01-15

Initial public release. Includes `sdf inspect` and `sdf validate`.

Binary distributions: macOS arm64/x64, Linux x64/arm64 via GitHub Releases.

---

## `@etapsky/sdf-server-core` — Server Framework

### 0.1.2 — 2026-03-15

- **Fix:** Rate limit counters are now per-tenant. Previously a single global counter was shared across all tenants.
- **Fix:** Admin JWT middleware correctly rejects tokens signed with the non-admin `JWT_SECRET`.
- **Improvement:** `audit_log` writes are now batched in a BullMQ worker (`audit-flush`) instead of blocking the request path.

### 0.1.1 — 2026-02-20

- **Fix:** S3 pre-signed URL TTL is now 1 hour (was 24 hours).
- **Fix:** `webhook-delivery` worker uses exponential backoff (was fixed 5-second retry delay).

### 0.1.0 — 2026-01-20

Initial release. Includes Fastify 5 server, Drizzle ORM schema, BullMQ workers, MinIO/S3 native adapter, SAML 2.0 SP, ERP connectors (SAP, Oracle).

---

## `@etapsky/sdf-schema-registry` — Schema Registry

### 0.1.0 — 2026-02-01

Initial release. Includes `SchemaRegistry` (register, resolve, list), `diffSchemas()` (breaking/non-breaking analysis), and `MigrationEngine` for cross-version transformation.

---

## `@etapsky/cloud-sdk` — SaaS Client

### 0.1.0 — 2026-03-01

Initial release. Includes `SDFCloudClient` with `upload()`, `download()`, `sign()`, `verify()`, `waitForJob()`.

---

## `etapsky-sdf` — Python SDK (PyPI)

### 0.1.1 — 2026-03-10

- **Fix:** `validate_schema()` no longer raises `RecursionError` on deeply nested `$defs` in JSON Schema.
- **Fix:** `build_sdf()` correctly writes `meta.json` as UTF-8 (was platform default encoding on Windows).

### 0.1.0 — 2026-01-20

Initial release. Includes `build_sdf()`, `parse_sdf()`, `validate_schema()`, `validate_meta()`, `sign()`, `verify()`.

---

## SDF Format Spec

### 0.1 — 2026-01-15

First public draft of the SDF format specification (`spec/SDF_FORMAT.md`, 17 sections, 1,218 lines). Normative for all tooling in this release cycle.
