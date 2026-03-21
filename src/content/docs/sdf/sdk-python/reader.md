---
title: "Reader — parse_sdf()"
description: "Parse and read .sdf files in Python with parse_sdf() and extract_json()."
sidebar:
  label: "Reader"
  order: 3
---

The reader module unpacks `.sdf` archives and exposes their contents as Python objects. It enforces ZIP bomb protection, path traversal guards, and file size limits during extraction.

## Import

```python
from sdf import parse_sdf, extract_json
```

## `parse_sdf(buffer)`

Parses a `.sdf` file and returns an `SDFResult` containing all archive components.

```python
parse_sdf(buffer: bytes) -> SDFResult
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `buffer` | `bytes` | Raw `.sdf` file contents |

**Returns:** `SDFResult`

**Raises:** `SDFError` with an appropriate error code on any of the following:
- File is not a valid ZIP archive (`SDF_ERROR_NOT_ZIP`)
- Required file is missing from the archive (`SDF_ERROR_MISSING_FILE`)
- Uncompressed size exceeds 200 MB (`SDF_ERROR_ARCHIVE_TOO_LARGE`)
- A ZIP entry path contains `..` components (`SDF_ERROR_INVALID_ARCHIVE`)
- `meta.json` fails schema validation (`SDF_ERROR_INVALID_META`)

## Basic usage

```python title="reader-basic.py"
from sdf import parse_sdf

with open("invoice.sdf", "rb") as f:
    result = parse_sdf(f.read())

# meta.json fields
print(result.meta.document_id)    # UUID v4
print(result.meta.document_type)  # "invoice"
print(result.meta.schema_id)      # "invoice/v0.2"
print(result.meta.issuer)         # "Acme Supplies GmbH"
print(result.meta.issued_at)      # ISO 8601 string

# data.json
print(result.data["invoice_number"])  # "INV-2026-001"
print(result.data["total"])           # {"amount": "1250.00", "currency": "EUR"}

# schema.json
print(result.schema["$schema"])  # "https://json-schema.org/draft/2020-12/schema"

# visual.pdf bytes
with open("invoice.pdf", "wb") as f:
    f.write(result.visual)

# signature.sig (None if unsigned)
if result.signature is not None:
    print(f"Document is signed ({len(result.signature)} bytes)")
```

## `SDFResult` fields

```python
@dataclass
class SDFResult:
    meta: SDFMeta                  # Parsed meta.json as SDFMeta dataclass
    data: dict                     # Parsed data.json as dict
    schema: dict                   # Parsed schema.json as dict
    visual: bytes                  # Raw PDF bytes from visual.pdf
    signature: bytes | None        # Raw signature.sig bytes, or None if absent
```

## `extract_json(buffer, filename)`

Extracts and parses a single JSON file from an SDF archive without fully parsing the document. Useful when you only need one file, e.g. for routing based on `document_type`.

```python
extract_json(buffer: bytes, filename: str) -> dict
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `buffer` | `bytes` | Raw `.sdf` file contents |
| `filename` | `str` | File to extract: `'meta.json'`, `'data.json'`, or `'schema.json'` |

**Returns:** Parsed JSON as a Python `dict`.

**Raises:** `SDFError` if the file is missing or the JSON is malformed.

```python title="extract-json.py"
from sdf import extract_json

with open("invoice.sdf", "rb") as f:
    buffer = f.read()

# Route by document type without full parse
meta = extract_json(buffer, "meta.json")
document_type = meta["document_type"]

if document_type == "invoice":
    process_invoice(buffer)
elif document_type == "nomination":
    process_nomination(buffer)
```

## Processing a batch of SDF files

```python title="reader-batch.py"
from pathlib import Path
from sdf import parse_sdf
from sdf.errors import SDFError

sdf_dir = Path("./incoming")
results = []
errors = []

for sdf_path in sdf_dir.glob("*.sdf"):
    try:
        with open(sdf_path, "rb") as f:
            result = parse_sdf(f.read())
        results.append({
            "file": sdf_path.name,
            "document_id": result.meta.document_id,
            "document_type": result.meta.document_type,
            "is_signed": result.signature is not None,
        })
    except SDFError as e:
        errors.append({"file": sdf_path.name, "error": e.code, "message": str(e)})

print(f"Processed: {len(results)}, Errors: {len(errors)}")
```

## Security guarantees

`parse_sdf()` enforces the following limits on all archives:

| Limit | Value | Error code |
|-------|-------|-----------|
| Max single file size | 50 MB | `SDF_ERROR_ARCHIVE_TOO_LARGE` |
| Max total uncompressed size | 200 MB | `SDF_ERROR_ARCHIVE_TOO_LARGE` |
| Path traversal | Blocked | `SDF_ERROR_INVALID_ARCHIVE` |

These limits are applied before any file content is read. An archive that exceeds any limit is rejected immediately.

No network requests are made during parsing. Schema validation uses the `schema.json` embedded inside the archive — never an external URL.
