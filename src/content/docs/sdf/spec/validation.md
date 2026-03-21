---
title: "Validation"
description: "SDF validation pipeline — container, meta, schema, data, and signature validation steps."
sidebar:
  label: "Validation"
  order: 8
---

# Validation

SDF defines a mandatory validation pipeline that every consumer MUST execute before treating an archive as a conformant SDF document. The pipeline is ordered: later steps depend on earlier steps succeeding.

---

## Validation Pipeline

Execute validation steps in the following order:

### Step 1: Container Validation

Verify that the file is a structurally valid ZIP archive.

- Parse the ZIP central directory. If the file is not a valid ZIP: `SDF_ERROR_NOT_ZIP`.
- Inspect all entry paths for path traversal sequences (`..`, absolute paths). If any unsafe path is found: `SDF_ERROR_INVALID_ARCHIVE`.
- Compute total uncompressed size across all entries. If any single entry exceeds 50 MB or total exceeds 200 MB: `SDF_ERROR_ARCHIVE_TOO_LARGE`.
- Verify that all required entries are present: `visual.pdf`, `data.json`, `schema.json`, `meta.json`. If any are missing: `SDF_ERROR_MISSING_FILE`.
- Verify that no unrecognized entries exist at the archive root (outside `vendor/`). If any are found: `SDF_ERROR_INVALID_ARCHIVE`.

### Step 2: Meta Validation

Parse and validate `meta.json`.

- Parse `meta.json` as UTF-8 JSON. If parse fails: `SDF_ERROR_INVALID_META`.
- Validate against the SDF meta schema. If validation fails: `SDF_ERROR_INVALID_META`.
- Verify that `sdf_version` is a supported version. If the version is too high: `SDF_ERROR_UNSUPPORTED_VERSION`.

### Step 3: Schema Validation

Parse and validate `schema.json`.

- Parse `schema.json` as UTF-8 JSON. If parse fails: `SDF_ERROR_INVALID_SCHEMA`.
- Validate that the parsed document is a valid JSON Schema Draft 2020-12 document. If not: `SDF_ERROR_INVALID_SCHEMA`.
- Verify that no `$ref` values resolve to external URIs. If any external ref is found: `SDF_ERROR_INVALID_SCHEMA`.

### Step 4: Data Validation

Validate `data.json` against the bundled `schema.json`.

- Parse `data.json` as UTF-8 JSON. If parse fails: `SDF_ERROR_SCHEMA_MISMATCH`.
- Validate against the `schema.json` document from Step 3. If validation fails: `SDF_ERROR_SCHEMA_MISMATCH`.

### Step 5: Signature Verification (Conditional)

Verify the digital signature if `signature.sig` is present.

- If `signature.sig` is absent: skip this step. The document is unsigned; this is valid for Phase 1–3.
- If `signature.sig` is present:
  - Parse `signature.sig` as UTF-8 JSON.
  - Verify the signature over `meta.json`, `data.json`, `schema.json`, and `visual.pdf` in the canonical order.
  - If verification fails: `SDF_ERROR_INVALID_SIGNATURE`.

---

## TypeScript Implementation

### validateMeta()

```typescript title="packages/sdf-kit/src/validator/validateMeta.ts"
import { SDFError } from '../core/errors';
import type { SDFMeta } from '../core/types';

const SDF_META_REQUIRED_FIELDS = [
  'sdf_version',
  'document_id',
  'document_type',
  'issuer',
  'created_at',
] as const;

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO8601_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

export function validateMeta(meta: unknown): asserts meta is SDFMeta {
  if (typeof meta !== 'object' || meta === null) {
    throw new SDFError('SDF_ERROR_INVALID_META', 'meta.json must be a JSON object');
  }

  const obj = meta as Record<string, unknown>;

  for (const field of SDF_META_REQUIRED_FIELDS) {
    if (!(field in obj) || obj[field] === null || obj[field] === undefined) {
      throw new SDFError('SDF_ERROR_INVALID_META', `Required field missing: ${field}`);
    }
  }

  if (typeof obj.sdf_version !== 'string' || !/^\d+\.\d+$/.test(obj.sdf_version)) {
    throw new SDFError('SDF_ERROR_INVALID_META', 'sdf_version must be a string matching "major.minor"');
  }

  if (typeof obj.document_id !== 'string' || !UUID_V4_PATTERN.test(obj.document_id)) {
    throw new SDFError('SDF_ERROR_INVALID_META', 'document_id must be a valid UUID v4');
  }

  if (typeof obj.created_at !== 'string' || !ISO8601_PATTERN.test(obj.created_at)) {
    throw new SDFError('SDF_ERROR_INVALID_META', 'created_at must be an ISO 8601 date-time string');
  }

  if (typeof obj.issuer !== 'string' || obj.issuer.trim().length === 0) {
    throw new SDFError('SDF_ERROR_INVALID_META', 'issuer must be a non-empty string');
  }
}
```

### validateSchema()

```typescript title="packages/sdf-kit/src/validator/validateSchema.ts"
import Ajv from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import { SDFError } from '../core/errors';

const ajv = new Ajv({ strict: true, allErrors: true });
addFormats(ajv);

// Block external $ref resolution — all refs must be internal
ajv.opts.loadSchema = () => {
  throw new SDFError('SDF_ERROR_INVALID_SCHEMA', 'External $ref resolution is forbidden in SDF');
};

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateSchema(data: unknown, schema: unknown): ValidationResult {
  let validate: ReturnType<typeof ajv.compile>;

  try {
    validate = ajv.compile(schema as object);
  } catch (err) {
    throw new SDFError('SDF_ERROR_INVALID_SCHEMA', `schema.json is not valid JSON Schema: ${err}`);
  }

  const valid = validate(data) as boolean;

  return {
    valid,
    errors: valid ? [] : (validate.errors ?? []).map(e => `${e.instancePath} ${e.message}`),
  };
}
```

---

## CLI Validation

Use `sdf-cli` to validate `.sdf` files from the command line:

```bash title="Basic validation"
sdf validate ./invoice.sdf
```

```bash title="Example valid output"
Validating: invoice.sdf

  Container   OK  4 required entries present, 0 path violations
  Meta        OK  sdf_version=0.1, document_type=invoice
  Schema      OK  JSON Schema Draft 2020-12, no external refs
  Data        OK  Validates against bundled schema
  Signature   --  No signature present (Phase 1-3)

Result: VALID
```

```bash title="Example invalid output"
Validating: invoice-bad.sdf

  Container   OK  4 required entries present
  Meta        OK  sdf_version=0.1
  Schema      OK  JSON Schema Draft 2020-12
  Data        FAIL

    SDF_ERROR_SCHEMA_MISMATCH
    /total/amount  must be string (got number)
    /buyer         must have required property 'name'

Result: INVALID
```

---

## API Validation

The SDF server exposes a synchronous validation endpoint:

```bash title="POST /validate"
curl -X POST https://api.example.com/validate \
  -H "X-API-Key: sdf_k1a2b3c4..." \
  -F "file=@invoice.sdf"
```

```json title="Response — valid"
{
  "valid": true,
  "document_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "document_type": "invoice",
  "sdf_version": "0.1",
  "signed": false,
  "steps": {
    "container": "ok",
    "meta": "ok",
    "schema": "ok",
    "data": "ok",
    "signature": "skipped"
  }
}
```

```json title="Response — invalid"
{
  "valid": false,
  "error": "SDF_ERROR_SCHEMA_MISMATCH",
  "errors": [
    "/total/amount must be string (got number)",
    "/buyer must have required property 'name'"
  ],
  "steps": {
    "container": "ok",
    "meta": "ok",
    "schema": "ok",
    "data": "fail",
    "signature": "skipped"
  }
}
```

---

## CI/CD Integration

`sdf-cli` exits with standard exit codes for CI pipeline integration:

| Exit Code | Meaning |
|-----------|---------|
| `0` | Document is valid |
| `1` | Document is invalid (validation error) |
| `2` | Usage error (wrong arguments) |
| `3` | Internal error (unexpected failure) |

```yaml title="GitHub Actions validation step"
- name: Validate SDF output
  run: |
    sdf validate ./dist/invoice.sdf
    # Exits 0 on valid, 1 on invalid — CI fails automatically on invalid
```

```bash title="Validate all .sdf files in a directory"
find ./dist -name "*.sdf" -exec sdf validate {} \;
```

---

## Validation vs. Processing

A conformant consumer MUST complete the full validation pipeline before processing the document's business data. Partial validation (e.g., reading `data.json` without validating it against `schema.json`) is non-conformant.

The correct pattern:

```typescript title="Correct consumer pattern"
// 1. Validate first
const result = await validateSDF(sdfBuffer);
if (!result.valid) {
  throw new SDFError(result.error, result.message);
}

// 2. Only then process
const data = await extractJSON(sdfBuffer);
processInvoice(data);
```
