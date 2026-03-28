---
title: "Container Format"
description: "SDF files are valid ZIP archives. This page covers the container structure, file manifest, naming rules, and size limits."
sidebar:
  label: "Container"
  order: 2
---

An SDF file is a valid ZIP archive with the `.sdf` extension.

The `.sdf` extension is a content-type signal, not a structural one. Any tool that can open a ZIP archive can open an `.sdf` file. Renaming the file to `.zip` MUST produce a valid ZIP archive.

---

## File Manifest

Every `.sdf` archive has a defined set of entries. The following table lists all recognized paths and their status:

| Path | Required | Description |
|------|----------|-------------|
| `visual.pdf` | MUST | Human-readable PDF layer. Self-contained. No external resources. |
| `data.json` | MUST | Structured business data. MUST validate against `schema.json`. |
| `schema.json` | MUST | JSON Schema Draft 2020-12. Bundled in archive. |
| `meta.json` | MUST | SDF identity and provenance record. |
| `signature.sig` | MAY | Digital signature over the four required layers. |
| `vendor/*` | MAY | Proprietary extensions under the `vendor/` namespace. |

:::caution
No files other than those listed above may appear at the archive root. Any additional files MUST use the `vendor/` prefix (e.g., `vendor/acme/custom.json`). An archive containing unrecognized root-level entries MUST be rejected with `SDF_ERROR_INVALID_ARCHIVE`.
:::

---

## Naming Rules

The following rules apply to all archive entry paths:

- **Case-sensitive.** `data.json` and `Data.JSON` are not equivalent. Producers MUST use lowercase filenames for all required entries.
- **No path traversal.** Entry paths MUST NOT contain `..` components. An archive containing traversal sequences MUST be rejected with `SDF_ERROR_INVALID_ARCHIVE`.
- **No absolute paths.** Paths MUST be relative. An entry path starting with `/` or a drive letter MUST be rejected.
- **No symlinks.** ZIP symlinks are not supported in v0.1. An archive containing symlink entries MUST be rejected.
- **`vendor/` namespace.** Vendor-specific extensions MUST be placed under a `vendor/<vendor-name>/` prefix. The vendor name SHOULD be a reverse-domain identifier (e.g., `vendor/com.acme/`).

---

## ZIP Specification Compliance

SDF v0.1 requires standard ZIP compliance with the following constraints:

- **No archive-level encryption.** ZIP-level password protection is not supported in v0.1. Content-level encryption (e.g., encrypted `private_key_enc` values) is handled at the application layer.
- **ZIP64 is permitted** for archives exceeding 4 GB nominal limit, but the SDF size limits (see below) make this uncommon in practice.
- **Compression method.** Entries MAY use deflate compression or be stored uncompressed. Producers SHOULD compress `data.json`, `schema.json`, and `meta.json`. `visual.pdf` is already compressed and MAY be stored without additional compression.

---

## Size Limits

SDF imposes limits to prevent resource exhaustion attacks (ZIP bombs) and to keep archives manageable for transmission.

| Limit | Value | Error |
|-------|-------|-------|
| Maximum size per archive entry | 50 MB (uncompressed) | `SDF_ERROR_ARCHIVE_TOO_LARGE` |
| Maximum total uncompressed size | 200 MB | `SDF_ERROR_ARCHIVE_TOO_LARGE` |

Consumers MUST enforce these limits **before** fully decompressing any entry. Streaming decompression with a byte counter is the recommended implementation pattern.

```typescript title="Enforcing size limits during extraction"
const MAX_ENTRY_BYTES = 50 * 1024 * 1024;   // 50 MB
const MAX_TOTAL_BYTES = 200 * 1024 * 1024;  // 200 MB

let totalBytes = 0;

for (const entry of archive.entries()) {
  if (entry.uncompressedSize > MAX_ENTRY_BYTES) {
    throw new SDFError('SDF_ERROR_ARCHIVE_TOO_LARGE', `Entry ${entry.name} exceeds 50 MB limit`);
  }
  totalBytes += entry.uncompressedSize;
  if (totalBytes > MAX_TOTAL_BYTES) {
    throw new SDFError('SDF_ERROR_ARCHIVE_TOO_LARGE', 'Total uncompressed size exceeds 200 MB limit');
  }
}
```

---

## Path Traversal Protection

Consumers MUST validate every archive entry path before extraction. The check MUST happen before any bytes are read from the entry.

```typescript title="Path traversal check"
function isSafePath(entryName: string): boolean {
  // Reject absolute paths
  if (entryName.startsWith('/') || /^[a-zA-Z]:/.test(entryName)) return false;
  // Reject traversal sequences
  const normalized = entryName.split('/').filter(Boolean);
  return !normalized.some(part => part === '..' || part === '.');
}

for (const entry of archive.entries()) {
  if (!isSafePath(entry.name)) {
    throw new SDFError('SDF_ERROR_INVALID_ARCHIVE', `Unsafe path in archive: ${entry.name}`);
  }
}
```

---

## Required File Check

After validating all entry paths, consumers MUST verify that all required entries are present. Missing required entries MUST be rejected before any further processing.

```typescript title="Required entry check"
const REQUIRED_ENTRIES = ['visual.pdf', 'data.json', 'schema.json', 'meta.json'];

const entryNames = new Set(archive.entries().map(e => e.name));

for (const required of REQUIRED_ENTRIES) {
  if (!entryNames.has(required)) {
    throw new SDFError('SDF_ERROR_MISSING_FILE', `Required entry missing: ${required}`);
  }
}
```

---

## Consumer Processing Order

Consumers MUST process archive entries in the following order to ensure security:

1. Verify the file is a valid ZIP. If not: `SDF_ERROR_NOT_ZIP`.
2. Validate all entry paths (traversal check). If any unsafe: `SDF_ERROR_INVALID_ARCHIVE`.
3. Check size limits. If exceeded: `SDF_ERROR_ARCHIVE_TOO_LARGE`.
4. Verify all required entries are present. If any missing: `SDF_ERROR_MISSING_FILE`.
5. Parse and validate `meta.json`.
6. Parse and validate `schema.json`.
7. Parse and validate `data.json` against `schema.json`.
8. Process `visual.pdf` (render or extract as needed).
9. Verify `signature.sig` if present.

This order ensures that resource exhaustion and path traversal attacks are stopped before any content is parsed.
