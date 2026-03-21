---
title: "Changelog"
description: "Etapsky product changelog — releases, features, and improvements."
sidebar:
  label: "Changelog"
  order: 4
---

This page tracks releases across all Etapsky packages. Releases follow [Semantic Versioning](https://semver.org). Each entry links to the corresponding GitHub Release where available.

---

## 2026-03

### sdf-cli 0.3.0

**Released:** March 2026
**Package:** `@etapsky/sdf-cli` · [npm](https://www.npmjs.com/package/@etapsky/sdf-cli) · [Homebrew](https://github.com/etapsky/homebrew-tap)

**New commands:**

- `sdf wrap` — wrap an existing PDF and a JSON data file into a `.sdf` archive without writing code
- `sdf convert` — convert between supported document schema versions using the migration engine
- `sdf schema` — interact with the schema registry: list, fetch, diff versions

**Improvements:**

- `sdf inspect` now renders a structured table of all archive entries with sizes, checksums, and validation status
- `sdf validate` exits with code `1` on validation failure and code `2` on unrecoverable parse errors — suitable for CI pipelines
- `sdf sign` and `sdf verify` surface the signature algorithm and key ID in terminal output
- `sdf keygen` generates ECDSA-P256 and RSA-2048 key pairs; outputs PEM files with a `.sdf-key` naming convention

**Distribution:**

- macOS arm64 and x64 binaries available on [GitHub Releases](https://github.com/etapsky/sdf/releases)
- Linux x64 and arm64 binaries available on [GitHub Releases](https://github.com/etapsky/sdf/releases)
- Homebrew tap: `brew install etapsky/tap/sdf`

---

### sdf-server-core 0.1.2

**Released:** March 2026
**Package:** `@etapsky/sdf-server-core` · [npm](https://www.npmjs.com/package/@etapsky/sdf-server-core)

**New:**

- ERP connector routes (`/connectors/*`) — configure, health-check, match, and push to SAP S/4HANA and Oracle Fusion Cloud
- `ConnectorRegistry` factory pattern with per-tenant connector instances
- `FieldMapper` — maps SDF `data.json` fields to ERP-specific field names and applies format transforms (e.g., SAP `YYYYMMDD` date format)
- Oracle Fusion Cloud REST connector — supports Basic, Bearer, and OAuth2 authentication
- Webhook delivery worker — BullMQ job with HMAC-SHA256 payload signing, exponential backoff retry, and dead letter queue

**Improvements:**

- Rate limiting is now enforced per tenant independently — one tenant exceeding their limit does not affect others
- Audit log entries now include `ip_address` and structured `metadata` JSONB for action-specific context
- S3 pre-signed URL TTL reduced to 1 hour; lifecycle policy configuration added for Glacier transition after 90 days (production)
- `admin.ts` routes now require a separate `adminAuthMiddleware` — admin endpoints are no longer reachable with a standard API key

**Bug fixes:**

- Fixed timing in refresh token rotation: previous session `revoked_at` is now written atomically with new session creation in a single transaction
- Fixed ZIP bomb check applying compressed size instead of uncompressed size

---

### sdf-schema-registry 0.1.0

**Released:** March 2026
**Package:** `@etapsky/sdf-schema-registry` · [npm](https://www.npmjs.com/package/@etapsky/sdf-schema-registry)

Initial release.

**Features:**

- `SchemaRegistry` — register schemas by ID and version, resolve by ID/version pair, list all registered schemas
- `diffSchemas()` — compares two schema versions and classifies each difference as breaking or non-breaking. Breaking changes include: required field additions, field removals, type narrowing. Non-breaking changes include: optional field additions, description changes, example additions.
- `MigrationEngine` — applies a declarative migration definition to transform a `data.json` document from one schema version to another. Supports field renames, value transforms, and field additions with defaults.

---

### sdf-kit 0.2.2

**Released:** March 2026
**Package:** `@etapsky/sdf-kit` · [npm](https://www.npmjs.com/package/@etapsky/sdf-kit)

**New:**

- `signer` module: `sign()`, `verify()`, `generateKeyPair()` — ECDSA-P256 and RSA-2048 via Web Crypto API
- `checkVersion()` validator — rejects documents with unsupported `sdf_version` values before attempting full parse
- `SDF_ERROR_ARCHIVE_TOO_LARGE` — thrown when decompressed content exceeds 200 MB or any single entry exceeds 50 MB

**Improvements:**

- `parseSDF()` now validates path traversal in ZIP entries before extraction — throws `SDF_ERROR_INVALID_ARCHIVE` on any entry containing `..` path components
- `buildSDF()` enforces that `document_id` is a valid UUID v4 — rejects values derived from business identifiers
- `generatePDF()` validates that no external resource references are present in the generated PDF

**Bug fixes:**

- `extractJSON()` returned `undefined` instead of throwing `SDF_ERROR_MISSING_FILE` when `data.json` was absent
- `validateMeta()` did not reject `meta.json` objects containing SDF-reserved fields in the wrong location (e.g., `invoice_number` in meta)

---

### Python SDK 0.1.1

**Released:** March 2026
**Package:** `etapsky-sdf` · [PyPI](https://pypi.org/project/etapsky-sdf/)

**New:**

- `SDFSigner` — ECDSA-P256 signing and verification using the `cryptography` package
- `SDFValidator.check_version()` — version validation before full parse

**Improvements:**

- `SDFProducer.build()` now enforces the 50 MB / 200 MB ZIP size limits
- `SDFReader.extract_json()` raises `SDFMissingFileError` instead of returning `None` when `data.json` is absent
- PDF generation via `reportlab` now embeds all fonts — no external font references

**Bug fixes:**

- `SDFValidator.validate_schema()` was importing `$ref` targets from external URLs when the schema contained `$ref` with an `https://` prefix — now raises `SDFOfflineViolationError` instead

---

## Versioning Policy

- **Patch releases** (`x.y.Z`): bug fixes, documentation corrections, non-breaking dependency updates
- **Minor releases** (`x.Y.0`): new features, new optional parameters, new exports — backward compatible
- **Major releases** (`X.0.0`): breaking API changes — announced with a deprecation period in the preceding minor series

:::note
While packages are below `1.0.0`, minor version bumps may include breaking changes. Each package's own changelog section will clearly mark any breaking change regardless of version number.
:::
