---
title: "Validator — validateSchema() / validateMeta()"
description: "Validate SDF data and metadata. Full API reference for validateSchema(), validateMeta(), and checkVersion()."
sidebar:
  label: "Validator"
  order: 4
---

The validator module provides three functions for checking SDF content correctness: `validateSchema()` for data-against-schema validation, `validateMeta()` for metadata structure verification, and `checkVersion()` for spec version compatibility checks.

## Import

```typescript
import { validateSchema, validateMeta, checkVersion } from '@etapsky/sdf-kit/validator';
```

## `validateSchema(data, schema)`

```typescript
function validateSchema(
  data:   Record<string, unknown>,
  schema: Record<string, unknown>,
): SDFValidationResult
```

Validates a data object against a JSON Schema Draft 2020-12 document. Returns a result object rather than throwing — this allows callers to inspect individual errors before deciding how to handle them.

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | `Record<string, unknown>` | Business data to validate (contents of `data.json`) |
| `schema` | `Record<string, unknown>` | JSON Schema object to validate against (contents of `schema.json`) |

### Return value

```typescript
interface SDFValidationResult {
  valid:  boolean;
  errors: Array<{
    instancePath: string;  // JSON Pointer to the failing value, e.g. "/total/amount"
    message:      string;  // Human-readable error description
  }>;
}
```

When `valid` is `true`, `errors` is an empty array. When `valid` is `false`, `errors` contains at least one entry describing the first failure.

### Example

```typescript title="validate-data.ts"
import { validateSchema } from '@etapsky/sdf-kit/validator';

const result = validateSchema(data, schema);

if (!result.valid) {
  console.error('Validation failed:');
  for (const error of result.errors) {
    console.error(`  ${error.instancePath}: ${error.message}`);
  }
  // Example output:
  //   /total/amount: must be string
  //   /issue_date: must match format "date"
  process.exit(1);
}

console.log('Data is valid.');
```

## `validateMeta(meta)`

```typescript
function validateMeta(meta: unknown): asserts meta is SDFMeta
```

Validates an object against the `SDFMeta` structure defined in the SDF specification. Throws `SDFError` with code `SDF_ERROR_INVALID_META` if the object is missing required fields or contains values of incorrect types.

This function uses TypeScript assertion syntax (`asserts meta is SDFMeta`). After a successful call, the TypeScript compiler knows that `meta` is a fully-typed `SDFMeta` object.

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `meta` | `unknown` | Object to validate as `SDFMeta` — typically parsed from `meta.json` |

### Return value

`void`. Throws `SDFError` on failure.

### Throws

| Error code | Cause |
|------------|-------|
| `SDF_ERROR_INVALID_META` | A required field is absent, has the wrong type, or `document_id` is not a valid UUID v4 |

### Example

```typescript title="validate-meta.ts"
import { validateMeta } from '@etapsky/sdf-kit/validator';
import { SDFError } from '@etapsky/sdf-kit';

const rawMeta: unknown = JSON.parse(metaJsonString);

try {
  validateMeta(rawMeta);
  // rawMeta is now typed as SDFMeta
  console.log('Meta is valid:', rawMeta.document_id);
} catch (err) {
  if (err instanceof SDFError && err.code === 'SDF_ERROR_INVALID_META') {
    console.error('Invalid meta.json:', err.message);
  }
  throw err;
}
```

## `checkVersion(sdfVersion)`

```typescript
function checkVersion(sdfVersion: string): VersionCheckResult
```

Checks whether the given `sdf_version` string is supported by the installed version of `@etapsky/sdf-kit`. Returns a result object rather than throwing — callers can decide whether to reject or warn based on the result.

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `sdfVersion` | `string` | Value of `sdf_version` from `meta.json` (e.g. `"0.1"`) |

### Return value

```typescript
interface VersionCheckResult {
  supported: boolean;  // true if this version is supported
  current:   string;   // the highest version supported by this sdf-kit release
}
```

### Example

```typescript title="check-version.ts"
import { checkVersion } from '@etapsky/sdf-kit/validator';

const { supported, current } = checkVersion('0.1');

if (!supported) {
  console.warn(`SDF version "0.1" is not supported. Current: ${current}`);
}
```

## Validation before writing

The SDF specification requires that data MUST be validated against its schema before an `.sdf` file is written. Producing a file that fails its own schema violates the spec and risks creating documents that consumers cannot process.

```typescript title="safe-produce.ts"
import { buildSDF } from '@etapsky/sdf-kit/producer';
import { validateSchema } from '@etapsky/sdf-kit/validator';
import { SDFError } from '@etapsky/sdf-kit';
import { writeFile } from 'node:fs/promises';

// Step 1: validate data before producing
const result = validateSchema(data, schema);

if (!result.valid) {
  const summary = result.errors
    .map(e => `${e.instancePath}: ${e.message}`)
    .join('\n');
  throw new Error(`Data does not conform to schema:\n${summary}`);
}

// Step 2: produce — buildSDF() also validates internally, but
// doing it explicitly gives you structured error data before the call
const buffer = await buildSDF({ data, schema, issuer, documentType });

// Step 3: write only after successful production
await writeFile('output.sdf', buffer);
```

:::note
`buildSDF()` performs its own internal validation and will throw `SDF_ERROR_SCHEMA_MISMATCH` if validation fails. Calling `validateSchema()` before `buildSDF()` is optional but recommended when you need the structured error list (e.g. to return a detailed 422 response to a caller).
:::

## Validating a received document

Use `validateSchema()` after parsing to confirm that an incoming `.sdf` file's data layer is consistent with its embedded schema.

```typescript title="validate-received.ts"
import { extractJSON } from '@etapsky/sdf-kit/reader';
import { validateSchema, validateMeta, checkVersion } from '@etapsky/sdf-kit/validator';

const { meta, data, schema } = await extractJSON(buffer);

// 1. Check spec version compatibility
const versionCheck = checkVersion(meta.sdf_version);
if (!versionCheck.supported) {
  throw new Error(`Unsupported SDF version: ${meta.sdf_version}`);
}

// 2. Validate meta structure
validateMeta(meta); // throws SDFError if invalid

// 3. Validate data against embedded schema
const dataCheck = validateSchema(data, schema);
if (!dataCheck.valid) {
  const errors = dataCheck.errors.map(e => `${e.instancePath}: ${e.message}`);
  throw new Error(`Document data is invalid:\n${errors.join('\n')}`);
}

console.log('Document is fully valid.');
```
