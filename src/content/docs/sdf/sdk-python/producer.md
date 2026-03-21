---
title: "Producer — SDFProducer"
description: "Build .sdf files in Python with SDFProducer. Full API reference and examples."
sidebar:
  label: "Producer"
  order: 2
---

`SDFProducer` builds valid `.sdf` archives from your data, schema, and metadata. It handles PDF generation, ZIP packaging, and internal file layout according to the SDF specification.

## Import

```python
from sdf import SDFProducer, SDFMeta
```

## Class: SDFProducer

### Constructor

```python
producer = SDFProducer()
```

No constructor arguments are required.

### `build(data, schema, meta, pdf_bytes=None)`

Produces a complete `.sdf` archive and returns it as `bytes`.

```python
producer.build(
    data: dict,
    schema: dict,
    meta: SDFMeta,
    pdf_bytes: bytes | None = None,
) -> bytes
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | `dict` | The document payload — will become `data.json` |
| `schema` | `dict` | JSON Schema Draft 2020-12 — will become `schema.json` |
| `meta` | `SDFMeta` | Document metadata — will become `meta.json` |
| `pdf_bytes` | `bytes \| None` | Pre-rendered PDF bytes. If `None`, a PDF is generated from `data` using ReportLab. |

**Returns:** `bytes` — the complete `.sdf` archive (ZIP).

**Raises:** `SDFError` if validation fails before the archive is built.

The producer validates `data` against `schema` before writing any file. If validation fails, it raises `SDFError` with code `SDF_ERROR_SCHEMA_MISMATCH` — no partial output is written.

## Basic example

```python title="producer-basic.py"
from sdf import SDFProducer, SDFMeta

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
                "currency": {"type": "string", "pattern": "^[A-Z]{3}$"},
            },
        },
    },
}

invoice_data = {
    "invoice_number": "INV-2026-001",
    "issue_date": "2026-03-15",
    "due_date": "2026-04-14",
    "payment_terms": "NET_30",
    "total": {"amount": "1250.00", "currency": "EUR"},
}

meta = SDFMeta(
    issuer="Acme Supplies GmbH",
    issuer_id="DE123456789",
    document_type="invoice",
    recipient="Global Logistics AG",
    schema_id="invoice/v0.2",
    locale="de-DE",
)

producer = SDFProducer()
sdf_bytes = producer.build(
    data=invoice_data,
    schema=invoice_schema,
    meta=meta,
)

with open("invoice.sdf", "wb") as f:
    f.write(sdf_bytes)

print(f"Produced {len(sdf_bytes):,} bytes")
```

## Providing a pre-rendered PDF

If your application already generates PDFs (e.g. via WeasyPrint, pdfkit, or a templating pipeline), pass the raw bytes to `pdf_bytes` to skip ReportLab generation:

```python title="producer-custom-pdf.py"
from sdf import SDFProducer, SDFMeta

with open("invoice-template.pdf", "rb") as f:
    pdf_bytes = f.read()

producer = SDFProducer()
sdf_bytes = producer.build(
    data=invoice_data,
    schema=invoice_schema,
    meta=meta,
    pdf_bytes=pdf_bytes,
)
```

The provided PDF must:
- Contain no external resource references (all fonts and images must be embedded)
- Contain no executable content (no JavaScript, no macros, no AcroForm scripts)

The producer does not validate PDF content internally, but non-compliant PDFs violate the SDF specification and will be rejected by conformant consumers.

## Producing multiple document types

```python title="producer-multi-type.py"
from sdf import SDFProducer, SDFMeta

producer = SDFProducer()

# Invoice
invoice_sdf = producer.build(
    data=invoice_data,
    schema=invoice_schema,
    meta=SDFMeta(
        issuer="Acme Corp",
        issuer_id="DE123",
        document_type="invoice",
        schema_id="invoice/v0.2",
    ),
)

# Purchase order
po_sdf = producer.build(
    data=po_data,
    schema=po_schema,
    meta=SDFMeta(
        issuer="Acme Corp",
        issuer_id="DE123",
        document_type="purchase-order",
        schema_id="purchase-order/v1.0",
    ),
)

# Nomination
nomination_sdf = producer.build(
    data=nomination_data,
    schema=nomination_schema,
    meta=SDFMeta(
        issuer="Acme Corp",
        issuer_id="DE123",
        document_type="nomination",
        schema_id="nomination/v1.0",
        nomination_ref="NOM-2026-0042",
    ),
)
```

## Inspecting the produced archive

After building, you can immediately read back the archive to verify its contents:

```python title="producer-verify.py"
from sdf import SDFProducer, SDFMeta, parse_sdf

producer = SDFProducer()
sdf_bytes = producer.build(data=invoice_data, schema=invoice_schema, meta=meta)

result = parse_sdf(sdf_bytes)
assert result.meta.document_type == "invoice"
assert result.meta.sdf_version == "0.1"
assert result.data["invoice_number"] == "INV-2026-001"
assert result.visual is not None  # PDF bytes
print(f"document_id: {result.meta.document_id}")
```

## Monetary amounts

Monetary values must always be represented as an object with string `amount` and ISO 4217 `currency`. Never use floats:

```python title="monetary-amounts.py"
# Correct
total = {"amount": "1250.00", "currency": "EUR"}

# Wrong — will fail schema validation if schema enforces the correct structure
total = 1250.50
```

This is a hard requirement of the SDF specification. Floating-point representations of monetary values introduce rounding errors that are unacceptable in financial documents.
