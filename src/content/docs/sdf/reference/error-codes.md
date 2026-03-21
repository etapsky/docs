---
title: "Error Codes"
description: "Complete SDF error code reference — all codes, triggers, and typical causes."
sidebar:
  label: "Error Codes"
  order: 1
---

All SDF operations use a standardized set of error codes defined in `packages/sdf-kit/src/core/errors.ts`. Do not invent new error codes — if a situation is not covered, open a GitHub issue to extend the spec.

## Error code reference

| Code | HTTP status | Description |
|------|-------------|-------------|
| `SDF_ERROR_NOT_ZIP` | 400 | The file is not a valid ZIP archive. Likely a corrupted upload or wrong file format. |
| `SDF_ERROR_INVALID_META` | 400 | `meta.json` failed JSON Schema validation. A required field is missing or has the wrong type. |
| `SDF_ERROR_MISSING_FILE` | 400 | A required archive entry is absent. All four of `visual.pdf`, `data.json`, `schema.json`, and `meta.json` must be present. |
| `SDF_ERROR_SCHEMA_MISMATCH` | 422 | `data.json` does not conform to `schema.json`. The validation report contains the specific field paths that failed. |
| `SDF_ERROR_INVALID_SCHEMA` | 400 | `schema.json` is not valid JSON Schema Draft 2020-12. |
| `SDF_ERROR_UNSUPPORTED_VERSION` | 400 | The `sdf_version` value in `meta.json` is not recognized by this implementation. |
| `SDF_ERROR_INVALID_SIGNATURE` | 422 | Signature verification failed. The document may have been tampered with, or the signing key does not match. |
| `SDF_ERROR_INVALID_ARCHIVE` | 400 | The ZIP archive contains path traversal sequences (`..`) or is otherwise structurally invalid. |
| `SDF_ERROR_ARCHIVE_TOO_LARGE` | 413 | A single entry exceeds 50 MB, or the total uncompressed size exceeds 200 MB. |

## TypeScript error handling

```typescript title="src/consumer/validate.ts"
import { parseSDF, validateSchema } from '@etapsky/sdf-kit';
import {
  SDFError,
  SDF_ERROR_NOT_ZIP,
  SDF_ERROR_MISSING_FILE,
  SDF_ERROR_SCHEMA_MISMATCH,
  SDF_ERROR_INVALID_SIGNATURE,
  SDF_ERROR_ARCHIVE_TOO_LARGE,
} from '@etapsky/sdf-kit/core/errors';
import { readFileSync } from 'fs';

const buffer = readFileSync('document.sdf');

try {
  const sdf = await parseSDF(buffer);
  const result = validateSchema(sdf.data, sdf.schema);

  if (!result.valid) {
    console.error('Validation failed:', result.errors);
  } else {
    console.log('Document is valid:', sdf.meta.document_id);
  }
} catch (err) {
  if (err instanceof SDFError) {
    switch (err.code) {
      case SDF_ERROR_NOT_ZIP:
        console.error('Not a valid SDF file — expected a ZIP archive');
        break;
      case SDF_ERROR_MISSING_FILE:
        console.error('Incomplete archive:', err.message);
        break;
      case SDF_ERROR_SCHEMA_MISMATCH:
        console.error('Data does not match schema:', err.details);
        break;
      case SDF_ERROR_INVALID_SIGNATURE:
        console.error('Signature verification failed — document may be tampered');
        break;
      case SDF_ERROR_ARCHIVE_TOO_LARGE:
        console.error('Archive exceeds size limits');
        break;
      default:
        console.error('SDF error:', err.code, err.message);
    }
  } else {
    throw err;
  }
}
```

## Python error handling

```python title="consumer/validate.py"
from etapsky_sdf import parse_sdf, validate_schema
from etapsky_sdf.errors import (
    SDFError,
    SDF_ERROR_NOT_ZIP,
    SDF_ERROR_MISSING_FILE,
    SDF_ERROR_SCHEMA_MISMATCH,
    SDF_ERROR_INVALID_SIGNATURE,
    SDF_ERROR_ARCHIVE_TOO_LARGE,
)

with open("document.sdf", "rb") as f:
    raw = f.read()

try:
    sdf = parse_sdf(raw)
    result = validate_schema(sdf.data, sdf.schema)

    if not result.valid:
        print("Validation failed:", result.errors)
    else:
        print("Document is valid:", sdf.meta["document_id"])

except SDFError as err:
    if err.code == SDF_ERROR_NOT_ZIP:
        print("Not a valid SDF file — expected a ZIP archive")
    elif err.code == SDF_ERROR_MISSING_FILE:
        print("Incomplete archive:", err)
    elif err.code == SDF_ERROR_SCHEMA_MISMATCH:
        print("Data does not match schema:", err.details)
    elif err.code == SDF_ERROR_INVALID_SIGNATURE:
        print("Signature verification failed")
    elif err.code == SDF_ERROR_ARCHIVE_TOO_LARGE:
        print("Archive exceeds size limits")
    else:
        print(f"SDF error [{err.code}]:", err)
```

## CLI error output

The `sdf` CLI outputs error codes in a machine-readable format when the `--json` flag is passed:

```bash
sdf validate document.sdf --json
```

```json
{
  "valid": false,
  "errors": [
    {
      "code": "SDF_ERROR_SCHEMA_MISMATCH",
      "path": "data.totals.gross.amount",
      "message": "Expected string, got number"
    }
  ]
}
```
