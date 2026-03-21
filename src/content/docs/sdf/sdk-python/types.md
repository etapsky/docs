---
title: "Types & Errors"
description: "Python type definitions and SDFError codes from the etapsky-sdf package."
sidebar:
  label: "Types"
  order: 6
---

## SDFMeta

`SDFMeta` is the Python dataclass representation of `meta.json`. It is the input to `SDFProducer.build()` and the output of `parse_sdf()`.

```python
from sdf.types import SDFMeta
# or directly:
from sdf import SDFMeta
```

### Definition

```python
from dataclasses import dataclass, field
from uuid import uuid4
from datetime import datetime, timezone

@dataclass
class SDFMeta:
    # Required fields
    issuer: str
    document_type: str

    # Optional business fields
    issuer_id: str = ""
    recipient: str = ""
    schema_id: str = ""
    locale: str = ""
    nomination_ref: str = ""

    # Auto-generated — do not set manually
    sdf_version: str = "0.1"
    document_id: str = field(default_factory=lambda: str(uuid4()))
    issued_at: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `issuer` | `str` | Yes | Name of the document issuer |
| `document_type` | `str` | Yes | Type identifier: `"invoice"`, `"nomination"`, `"purchase-order"`, etc. |
| `issuer_id` | `str` | No | Issuer registry ID (e.g. VAT number, company registration) |
| `recipient` | `str` | No | Name of the document recipient |
| `schema_id` | `str` | No | Schema identifier in `{type}/v{version}` format, e.g. `"invoice/v0.2"` |
| `locale` | `str` | No | BCP 47 locale tag, e.g. `"de-DE"`, `"tr-TR"`, `"en-US"` |
| `nomination_ref` | `str` | No | Cross-reference for nomination matching workflows |
| `sdf_version` | `str` | Auto | SDF specification version. Always `"0.1"`. Do not set. |
| `document_id` | `str` | Auto | UUID v4 generated at instantiation time. Do not set from business data. |
| `issued_at` | `str` | Auto | ISO 8601 UTC timestamp. Generated at instantiation time. |

### Important: document_id

`document_id` is always a fresh UUID v4 generated when the `SDFMeta` object is created. It is not derived from any business identifier. Business identifiers such as invoice numbers, nomination references, or purchase order numbers belong in `data.json`.

```python
# Correct
meta = SDFMeta(issuer="Acme", document_type="invoice")
# meta.document_id → "3f8a1c2d-e4f5-4a6b-b7c8-9d0e1f2a3b4c"  (auto)

data = {
    "invoice_number": "INV-2026-001",  # business ID goes here
    ...
}

# Wrong — do not copy a business ID into document_id
meta = SDFMeta(
    issuer="Acme",
    document_type="invoice",
    document_id="INV-2026-001",  # violates the spec
)
```

---

## SDFResult

`SDFResult` is the return type of `parse_sdf()`. It contains all files extracted from the `.sdf` archive.

```python
from sdf.types import SDFResult
```

### Definition

```python
@dataclass
class SDFResult:
    meta: SDFMeta          # Parsed meta.json
    data: dict             # Parsed data.json
    schema: dict           # Parsed schema.json
    visual: bytes          # Raw PDF bytes from visual.pdf
    signature: bytes | None  # Raw signature.sig bytes, or None if absent
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `meta` | `SDFMeta` | The document metadata |
| `data` | `dict` | The document business data payload |
| `schema` | `dict` | The JSON Schema used to validate `data` |
| `visual` | `bytes` | The visual representation as raw PDF bytes |
| `signature` | `bytes \| None` | The digital signature bytes, or `None` for unsigned documents |

---

## ValidationResult

Returned by `validate_schema()`.

```python
@dataclass
class ValidationResult:
    valid: bool
    errors: list[ValidationError]
```

```python
@dataclass
class ValidationError:
    path: str         # JSON pointer to the failing location in data
    message: str      # Human-readable description
    schema_path: str  # JSON pointer into the schema that failed
```

---

## SDFError

`SDFError` is the single exception class raised by all SDK operations.

```python
from sdf.errors import SDFError
```

```python
class SDFError(Exception):
    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(f"[{code}] {message}")
```

### Error codes

All error codes are defined in the SDF specification (Section 12). Do not invent new codes.

| Code | Raised when |
|------|-------------|
| `SDF_ERROR_NOT_ZIP` | The file is not a valid ZIP archive |
| `SDF_ERROR_INVALID_META` | `meta.json` fails schema validation or has invalid field values |
| `SDF_ERROR_MISSING_FILE` | A required file (`visual.pdf`, `data.json`, `schema.json`, `meta.json`) is absent from the archive |
| `SDF_ERROR_SCHEMA_MISMATCH` | `data.json` does not satisfy `schema.json` |
| `SDF_ERROR_INVALID_SCHEMA` | `schema.json` is not a valid JSON Schema Draft 2020-12 document |
| `SDF_ERROR_UNSUPPORTED_VERSION` | `meta.json → sdf_version` is not a supported version |
| `SDF_ERROR_INVALID_SIGNATURE` | Signature verification failed, or a signed document has a missing or malformed `signature.sig` |
| `SDF_ERROR_INVALID_ARCHIVE` | Path traversal detected in a ZIP entry, or the archive is otherwise corrupt |
| `SDF_ERROR_ARCHIVE_TOO_LARGE` | A single file exceeds 50 MB or total uncompressed size exceeds 200 MB |

### Handling errors

```python title="error-handling.py"
from sdf import parse_sdf, validate_schema
from sdf.errors import SDFError

def process_sdf(path: str) -> None:
    try:
        with open(path, "rb") as f:
            result = parse_sdf(f.read())

        validation = validate_schema(result.data, result.schema)
        if not validation.valid:
            raise SDFError(
                "SDF_ERROR_SCHEMA_MISMATCH",
                "; ".join(f"{e.path}: {e.message}" for e in validation.errors),
            )

        print(f"OK: {result.meta.document_id} ({result.meta.document_type})")

    except SDFError as e:
        print(f"SDF error [{e.code}]: {e.message}")
    except FileNotFoundError:
        print(f"File not found: {path}")
```

### Error code lookup

```python title="error-lookup.py"
from sdf.errors import SDFError, SDF_ERROR_CODES

# All defined error codes as a set
print(SDF_ERROR_CODES)
# {
#   'SDF_ERROR_NOT_ZIP',
#   'SDF_ERROR_INVALID_META',
#   'SDF_ERROR_MISSING_FILE',
#   'SDF_ERROR_SCHEMA_MISMATCH',
#   'SDF_ERROR_INVALID_SCHEMA',
#   'SDF_ERROR_UNSUPPORTED_VERSION',
#   'SDF_ERROR_INVALID_SIGNATURE',
#   'SDF_ERROR_INVALID_ARCHIVE',
#   'SDF_ERROR_ARCHIVE_TOO_LARGE',
# }

# Check if a code is known
def is_known_error(code: str) -> bool:
    return code in SDF_ERROR_CODES
```
