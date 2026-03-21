---
title: "Versioning"
description: "SDF spec versioning — how sdf_version works, forward compatibility, and the upgrade path."
sidebar:
  label: "Versioning"
  order: 9
---

# Versioning

SDF uses a two-part version number in the form `major.minor` (e.g., `"0.1"`). The current version is **0.1**.

---

## sdf_version Field

Every SDF document carries its spec version in `meta.json` → `sdf_version`. This field MUST be a string matching the pattern `major.minor`:

```json title="meta.json excerpt"
{
  "sdf_version": "0.1",
  ...
}
```

`sdf_version` identifies the version of the SDF specification that the producing tool targeted. It does not identify the version of the producer tool, the schema version, or the business document version. Those are tracked separately.

---

## Version Semantics

SDF version numbers use the following semantics:

| Component | Meaning | Example change |
|-----------|---------|----------------|
| **Major** | Breaking change to the container format, required file set, or meta.json structure | Removing a required file, changing `document_id` rules |
| **Minor** | Backward-compatible addition | New optional meta.json field, new supported signing algorithm |

A consumer that supports version `X.Y` MUST be able to process any document with version `X.Z` where `Z <= Y`. A consumer that supports version `X.Y` SHOULD be able to read (though not fully process) any document with version `X.Z` where `Z > Y`.

---

## Consumer Version Handling

### Unknown Major Version

Consumers MUST reject documents with an unknown major version. If a consumer supports major version `0` and encounters major version `1`, it MUST reject the document with `SDF_ERROR_UNSUPPORTED_VERSION`.

```typescript title="Major version check"
const [major] = meta.sdf_version.split('.').map(Number);
const SUPPORTED_MAJOR = 0;

if (major > SUPPORTED_MAJOR) {
  throw new SDFError(
    'SDF_ERROR_UNSUPPORTED_VERSION',
    `Document requires SDF spec v${meta.sdf_version}; this consumer supports up to v${SUPPORTED_MAJOR}.x`
  );
}
```

### Unknown Minor Version

Consumers SHOULD warn on unknown minor versions but SHOULD continue processing. Unknown minor versions may contain new optional features that the consumer does not understand, but the core structure is compatible.

```typescript title="Minor version warning"
const [major, minor] = meta.sdf_version.split('.').map(Number);
const SUPPORTED_MINOR = 1;

if (major === SUPPORTED_MAJOR && minor > SUPPORTED_MINOR) {
  logger.warn(
    `Document uses SDF spec v${meta.sdf_version}; ` +
    `this consumer supports v${SUPPORTED_MAJOR}.${SUPPORTED_MINOR}. ` +
    `New optional features will be ignored.`
  );
  // Continue processing — do not reject
}
```

---

## Forward Compatibility

SDF is designed for long-lived documents. A document produced today MUST remain processable by future consumer implementations. The following rules ensure forward compatibility:

- **Consumers MUST ignore unknown fields** in `meta.json` at minor version boundaries. A consumer that encounters an unrecognized `meta.json` field MUST NOT reject the document — it MUST skip the field.
- **Consumers MUST ignore unknown `vendor/*` entries.** Vendor extensions at new paths MUST NOT cause rejection.
- **Producers MUST NOT remove required fields** in minor versions. Removing a required field is a major version change.

---

## Schema Versioning

Schema versions are tracked separately from SDF spec versions. The `schema_id` in `meta.json` and the `$id` in `schema.json` carry the schema version.

Use a version indicator in the schema URI path:

```
https://etapsky.github.io/sdf/schemas/invoice/v0.1.json   ← initial release
https://etapsky.github.io/sdf/schemas/invoice/v0.2.json   ← backward-compatible update
https://etapsky.github.io/sdf/schemas/invoice/v1.0.json   ← breaking change
```

Schema version semantics:

| Change | Schema version bump |
|--------|-------------------|
| Adding a new optional field | Minor (v0.1 → v0.2) |
| Adding a new required field | Major (v0.x → v1.0) |
| Removing a field | Major |
| Tightening a constraint (e.g., adding `minLength`) | Major |
| Relaxing a constraint (e.g., removing `minLength`) | Minor |
| Adding a new `$defs` type | Minor |

Use the [SDF Schema Registry](/sdf/server/schema-registry) and the `diffSchemas()` function from `@etapsky/sdf-schema-registry` to automatically detect whether a schema change is breaking.

---

## Current Version: 0.1

SDF v0.1 is the initial draft specification. It covers:

- Container format (ZIP with `.sdf` extension)
- All four required layers: `meta.json`, `data.json`, `schema.json`, `visual.pdf`
- Optional digital signing via `signature.sig`
- Full validation pipeline
- Security requirements (ZIP bomb protection, path traversal protection, no external refs)

v0.1 is feature-complete for Phase 1–4 of the Etapsky SDF project. The draft status indicates the specification is open for community review; the format is stable for production use.

---

## Version History

| Version | Status | Release Date | Summary |
|---------|--------|-------------|---------|
| 0.1 | Draft | 2026-03 | Initial specification — all four layers, optional signing, full validation pipeline |

Future versions will be announced on the [Etapsky GitHub](https://github.com/etapsky/sdf) and listed in this table. All versions will maintain the archive at `spec/SDF_FORMAT.md` in the repository.
