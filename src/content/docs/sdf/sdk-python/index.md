---
title: "Python SDK — etapsky-sdf"
description: "Python implementation of the SDF spec. Full producer, reader, validator, and signer on PyPI."
sidebar:
  label: "Overview"
  order: 1
---

`etapsky-sdf` is the official Python SDK for the Smart Document Format. It implements the full SDF specification: producing, reading, validating, and signing `.sdf` files.

## Installation

```bash
pip install etapsky-sdf
```

With optional dependencies for digital signing and PDF generation:

```bash
pip install "etapsky-sdf[signing,pdf]"
```

| Extra | Installs | Required for |
|-------|----------|-------------|
| `signing` | `cryptography>=42.0` | `SDFSigner` (ECDSA P-256, RSA-2048) |
| `pdf` | `reportlab>=4.0` | `SDFProducer` PDF generation |

**Requirements:** Python 3.11+

**Dependencies:**

| Package | Version | Purpose |
|---------|---------|---------|
| `jsonschema` | `>=4.21` | JSON Schema Draft 2020-12 validation |
| `reportlab` | `>=4.0` | PDF generation (optional) |
| `cryptography` | `>=42.0` | Digital signing (optional) |

## Quick start

```python title="quickstart.py"
from sdf import SDFProducer, SDFMeta, parse_sdf, validate_schema

# Define the document schema
invoice_schema = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "required": ["invoice_number", "issue_date", "total"],
    "properties": {
        "invoice_number": {"type": "string"},
        "issue_date": {"type": "string", "format": "date"},
        "total": {
            "type": "object",
            "required": ["amount", "currency"],
            "properties": {
                "amount": {"type": "string"},
                "currency": {"type": "string"},
            },
        },
    },
}

# Define the document data
invoice_data = {
    "invoice_number": "INV-2026-001",
    "issue_date": "2026-03-15",
    "due_date": "2026-04-14",
    "total": {"amount": "1250.00", "currency": "EUR"},
}

# Produce
producer = SDFProducer()
meta = SDFMeta(
    issuer="Acme Supplies GmbH",
    issuer_id="DE123456789",
    document_type="invoice",
    recipient="Global Logistics AG",
    schema_id="invoice/v0.2",
    locale="de-DE",
)

sdf_bytes = producer.build(
    data=invoice_data,
    schema=invoice_schema,
    meta=meta,
)

with open("invoice.sdf", "wb") as f:
    f.write(sdf_bytes)

# Read back
with open("invoice.sdf", "rb") as f:
    result = parse_sdf(f.read())

print(result.meta.document_id)       # auto-generated UUID
print(result.meta.document_type)     # "invoice"
print(result.data["invoice_number"]) # "INV-2026-001"
```

## Module overview

| Module | Main export | Purpose |
|--------|------------|---------|
| `sdf` | `SDFProducer` | Build `.sdf` files |
| `sdf` | `parse_sdf` | Read and unpack `.sdf` files |
| `sdf` | `validate_schema` | Validate data against a JSON Schema |
| `sdf` | `validate_meta` | Validate `SDFMeta` fields |
| `sdf.signer` | `SDFSigner` | Sign and verify `.sdf` files |
| `sdf.types` | `SDFMeta`, `SDFResult` | Dataclass types |
| `sdf.errors` | `SDFError` | Exception class |

## Compliance

The Python SDK implements the SDF specification as defined in `spec/SDF_FORMAT.md`. Key behaviors:

- All monetary amounts are represented as `{"amount": str, "currency": str}` — never as floats.
- `document_id` is always a UUID v4 generated at build time. It cannot be set from business data.
- `schema.json` is embedded inside the `.sdf` archive. No external URL references are made.
- `visual.pdf` contains no external resources and no executable content.
- ZIP archive access uses the internal `packContainer`/`unpackContainer` abstraction.

## Next steps

- [Producer](/sdf/sdk-python/producer) — build `.sdf` files with `SDFProducer`
- [Reader](/sdf/sdk-python/reader) — parse `.sdf` files with `parse_sdf()`
- [Validator](/sdf/sdk-python/validator) — validate data and metadata
- [Signer](/sdf/sdk-python/signer) — sign and verify with `SDFSigner`
- [Types & Errors](/sdf/sdk-python/types) — `SDFMeta`, `SDFResult`, `SDFError`
