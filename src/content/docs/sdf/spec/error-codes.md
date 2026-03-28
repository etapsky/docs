---
title: "Error Codes"
description: "Standard SDF error codes — constants, triggers, and typical causes."
sidebar:
  label: "Error Codes"
  order: 10
---

SDF defines a set of standard error codes used consistently across all implementations — `sdf-kit`, `sdf-cli`, `sdf-server`, and the Python SDK. All errors produced by an SDF operation MUST use one of these codes.

Do not invent new error codes. If a situation is not covered by the existing codes, open a GitHub issue on the [etapsky/sdf](https://github.com/etapsky/sdf) repository to propose a new code with spec section coverage.

---

## Error Code Reference

| Code | Trigger | Typical Cause |
|------|---------|---------------|
| `SDF_ERROR_NOT_ZIP` | File is not a valid ZIP archive | Wrong file extension, corrupted download, truncated upload |
| `SDF_ERROR_INVALID_META` | `meta.json` is missing or fails validation | Missing required fields, wrong value types, non-UUID `document_id`, invalid date format |
| `SDF_ERROR_MISSING_FILE` | A required archive entry is absent | Incomplete producer implementation, partially written archive |
| `SDF_ERROR_SCHEMA_MISMATCH` | `data.json` fails validation against `schema.json` | Business data does not match the declared schema, producer bug, schema drift |
| `SDF_ERROR_INVALID_SCHEMA` | `schema.json` is not valid JSON Schema Draft 2020-12 | Schema syntax error, external `$ref` URI, invalid `$schema` value |
| `SDF_ERROR_UNSUPPORTED_VERSION` | `sdf_version` value is higher than the consumer supports | Consumer is on an older spec version than the producer |
| `SDF_ERROR_INVALID_SIGNATURE` | Signature verification fails | Key mismatch, tampered data or visual layer, wrong `key_id` |
| `SDF_ERROR_INVALID_ARCHIVE` | Path traversal or structural violation | Malformed ZIP, `..` in entry path, unrecognized root-level entry, symlink entries |
| `SDF_ERROR_ARCHIVE_TOO_LARGE` | Archive exceeds size limits | Oversized embedded PDF, ZIP bomb attempt, uncompressed total > 200 MB |

---

## TypeScript Error Handling

All `sdf-kit` functions throw `SDFError` instances. `SDFError` extends the native `Error` class and adds a `code` property typed to the union of error code constants.

```typescript title="SDFError class"
// packages/sdf-kit/src/core/errors.ts

export type SDFErrorCode =
  | 'SDF_ERROR_NOT_ZIP'
  | 'SDF_ERROR_INVALID_META'
  | 'SDF_ERROR_MISSING_FILE'
  | 'SDF_ERROR_SCHEMA_MISMATCH'
  | 'SDF_ERROR_INVALID_SCHEMA'
  | 'SDF_ERROR_UNSUPPORTED_VERSION'
  | 'SDF_ERROR_INVALID_SIGNATURE'
  | 'SDF_ERROR_INVALID_ARCHIVE'
  | 'SDF_ERROR_ARCHIVE_TOO_LARGE';

export class SDFError extends Error {
  readonly code: SDFErrorCode;

  constructor(code: SDFErrorCode, message: string) {
    super(message);
    this.name = 'SDFError';
    this.code = code;
  }
}
```

```typescript title="Handling SDF errors"
import { parseSDF, SDFError } from '@etapsky/sdf-kit';
import { readFileSync } from 'fs';

const buffer = readFileSync('./invoice.sdf');

try {
  const sdf = await parseSDF(buffer);
  console.log('Document type:', sdf.meta.document_type);
  console.log('Issuer:', sdf.meta.issuer);
} catch (err) {
  if (err instanceof SDFError) {
    switch (err.code) {
      case 'SDF_ERROR_NOT_ZIP':
        console.error('Not a valid SDF file (not a ZIP archive)');
        break;
      case 'SDF_ERROR_MISSING_FILE':
        console.error('Incomplete SDF archive:', err.message);
        break;
      case 'SDF_ERROR_SCHEMA_MISMATCH':
        console.error('Data validation failed:', err.message);
        break;
      case 'SDF_ERROR_ARCHIVE_TOO_LARGE':
        console.error('Archive exceeds size limits — possible ZIP bomb');
        break;
      case 'SDF_ERROR_INVALID_ARCHIVE':
        console.error('Archive structure violation:', err.message);
        break;
      default:
        console.error(`SDF error [${err.code}]:`, err.message);
    }
  } else {
    // Not an SDF error — unexpected failure
    throw err;
  }
}
```

---

## Python Error Handling

The Python SDK (`etapsky-sdf`) raises `SDFError` with the same error codes:

```python title="Handling SDF errors in Python"
from etapsky_sdf import parse_sdf, SDFError

with open("invoice.sdf", "rb") as f:
    buffer = f.read()

try:
    sdf = parse_sdf(buffer)
    print(f"Document type: {sdf.meta['document_type']}")
    print(f"Issuer: {sdf.meta['issuer']}")

except SDFError as e:
    if e.code == "SDF_ERROR_NOT_ZIP":
        print("Not a valid SDF file (not a ZIP archive)")

    elif e.code == "SDF_ERROR_MISSING_FILE":
        print(f"Incomplete SDF archive: {e}")

    elif e.code == "SDF_ERROR_SCHEMA_MISMATCH":
        print(f"Data validation failed: {e}")

    elif e.code == "SDF_ERROR_ARCHIVE_TOO_LARGE":
        print("Archive exceeds size limits — possible ZIP bomb")

    elif e.code == "SDF_ERROR_INVALID_ARCHIVE":
        print(f"Archive structure violation: {e}")

    else:
        print(f"SDF error [{e.code}]: {e}")
```

---

## Error Code Usage by Pipeline Step

Each validation pipeline step produces a specific subset of error codes:

| Pipeline Step | Possible Error Codes |
|--------------|---------------------|
| Container validation | `SDF_ERROR_NOT_ZIP`, `SDF_ERROR_INVALID_ARCHIVE`, `SDF_ERROR_ARCHIVE_TOO_LARGE`, `SDF_ERROR_MISSING_FILE` |
| Meta validation | `SDF_ERROR_INVALID_META`, `SDF_ERROR_UNSUPPORTED_VERSION` |
| Schema validation | `SDF_ERROR_INVALID_SCHEMA` |
| Data validation | `SDF_ERROR_SCHEMA_MISMATCH` |
| Signature verification | `SDF_ERROR_INVALID_SIGNATURE` |

This mapping enables consumers to provide precise error diagnostics and log structured errors with the pipeline step that failed.

---

## HTTP Mapping

When the SDF server returns validation errors over HTTP, error codes map to HTTP status codes as follows:

| SDF Error Code | HTTP Status | Notes |
|----------------|------------|-------|
| `SDF_ERROR_NOT_ZIP` | 422 Unprocessable Entity | Client sent a non-ZIP file |
| `SDF_ERROR_INVALID_META` | 422 Unprocessable Entity | meta.json validation failure |
| `SDF_ERROR_MISSING_FILE` | 422 Unprocessable Entity | Required entry absent |
| `SDF_ERROR_SCHEMA_MISMATCH` | 422 Unprocessable Entity | data.json validation failure |
| `SDF_ERROR_INVALID_SCHEMA` | 422 Unprocessable Entity | schema.json is malformed |
| `SDF_ERROR_UNSUPPORTED_VERSION` | 422 Unprocessable Entity | Consumer cannot process this version |
| `SDF_ERROR_INVALID_SIGNATURE` | 422 Unprocessable Entity | Signature verification failed |
| `SDF_ERROR_INVALID_ARCHIVE` | 400 Bad Request | Structural violation or security issue |
| `SDF_ERROR_ARCHIVE_TOO_LARGE` | 413 Content Too Large | Archive exceeds size limits |

---

## CLI Exit Codes

`sdf-cli` returns the following exit codes when errors are encountered:

| Exit Code | Meaning | Error Codes |
|-----------|---------|-------------|
| `0` | Validation succeeded | — |
| `1` | SDF validation error | Any `SDF_ERROR_*` |
| `2` | Usage error | Wrong arguments or missing input file |
| `3` | Unexpected internal error | Non-SDF exception |
