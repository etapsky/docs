---
title: "Types & Error Codes"
description: "TypeScript type definitions and SDFError codes exported from @etapsky/sdf-kit."
sidebar:
  label: "Types"
  order: 6
---

This page documents all TypeScript types and error codes exported from `@etapsky/sdf-kit`.

## Core types import

```typescript
import type {
  SDFMeta,
  SDFParseResult,
  SDFParseResultJSON,
  SDFValidationResult,
  VersionCheckResult,
  SDFKeyPair,
} from '@etapsky/sdf-kit';

import { SDFError } from '@etapsky/sdf-kit';
```

## `SDFMeta`

Represents the contents of `meta.json` inside an `.sdf` archive. All required fields are specified by the SDF format specification.

```typescript
interface SDFMeta {
  /** SDF format version. Currently "0.1". */
  sdf_version: string;

  /** UUID v4 generated at production time. Never derived from business data. */
  document_id: string;

  /**
   * Document type identifier.
   * Examples: "invoice", "purchase_order", "nomination", "contract"
   */
  document_type: string;

  /** Human-readable name of the document issuer. */
  issuer: string;

  /** ISO 8601 datetime string of when the document was produced. */
  created_at: string;

  /** Optional unique identifier for the issuer (e.g. tax ID, GLN, UUID). */
  issuer_id?: string;

  /** Optional human-readable name of the document recipient. */
  recipient?: string;

  /**
   * Optional schema identifier URI.
   * Example: "invoice/v1.0"
   * Referenced in the schema registry.
   */
  schema_id?: string;

  /**
   * Optional BCP 47 language tag.
   * Controls PDF rendering locale.
   * Example: "en-US", "de-DE", "tr-TR"
   */
  locale?: string;

  /**
   * Optional nomination reference for document matching workflows.
   * Used in B2B and G2G scenarios where sender and receiver pre-agree on a reference.
   */
  nomination_ref?: string;
}
```

## `SDFParseResult`

Returned by `parseSDF()`. Contains all four layers of an `.sdf` file.

```typescript
interface SDFParseResult {
  /** Parsed and validated contents of meta.json */
  meta: SDFMeta;

  /** Parsed contents of data.json */
  data: Record<string, unknown>;

  /** Parsed contents of schema.json (JSON Schema Draft 2020-12) */
  schema: Record<string, unknown>;

  /** Raw bytes of visual.pdf */
  pdfBytes: Uint8Array;
}
```

## `SDFParseResultJSON`

Returned by `extractJSON()`. Contains only the JSON layers — `visual.pdf` is not loaded.

```typescript
interface SDFParseResultJSON {
  /** Parsed and validated contents of meta.json */
  meta: SDFMeta;

  /** Parsed contents of data.json */
  data: Record<string, unknown>;

  /** Parsed contents of schema.json (JSON Schema Draft 2020-12) */
  schema: Record<string, unknown>;
}
```

## `SDFValidationResult`

Returned by `validateSchema()`.

```typescript
interface SDFValidationResult {
  /** true if data fully conforms to schema, false otherwise */
  valid: boolean;

  /**
   * Array of validation errors. Empty when valid is true.
   * Each entry identifies the failing location and describes the problem.
   */
  errors: Array<{
    /**
     * JSON Pointer (RFC 6901) to the failing value in data.
     * Example: "/total/amount" means data.total.amount failed.
     * Empty string ("") means the root object failed.
     */
    instancePath: string;

    /** Human-readable description of the validation failure. */
    message: string;
  }>;
}
```

## `VersionCheckResult`

Returned by `checkVersion()`.

```typescript
interface VersionCheckResult {
  /** true if the given sdf_version is supported by this sdf-kit release */
  supported: boolean;

  /** The highest SDF spec version supported by this sdf-kit release */
  current: string;
}
```

## `SDFKeyPair`

Returned by `generateSDFKeyPair()`.

```typescript
interface SDFKeyPair {
  /** PEM-encoded private key (PKCS#8 format). Keep secret. */
  privateKey: string;

  /** PEM-encoded public key (SubjectPublicKeyInfo format). Safe to distribute. */
  publicKey: string;
}
```

## `SDFError`

All spec-level failures throw `SDFError`. It extends the native `Error` class and adds a `code` string for programmatic error handling.

```typescript
class SDFError extends Error {
  /** Machine-readable error code. One of the constants listed below. */
  readonly code: string;

  constructor(code: string, message: string);
}
```

### Usage pattern

```typescript
import { SDFError } from '@etapsky/sdf-kit';

try {
  const buffer = await buildSDF({ data, schema, issuer, documentType });
} catch (err) {
  if (err instanceof SDFError) {
    // err.code is one of the constants below
    // err.message is a human-readable description
    console.error(`[${err.code}] ${err.message}`);
  } else {
    throw err; // re-throw non-SDF errors
  }
}
```

## Error code reference

| Code | Thrown by | Description |
|------|-----------|-------------|
| `SDF_ERROR_NOT_ZIP` | `parseSDF`, `extractJSON`, `signSDF`, `verifySIG` | The input buffer is not a valid ZIP archive. The file may be corrupted or is not an `.sdf` file. |
| `SDF_ERROR_MISSING_FILE` | `parseSDF`, `extractJSON` | A required entry is absent from the archive. One of `visual.pdf`, `data.json`, `schema.json`, or `meta.json` is missing. |
| `SDF_ERROR_INVALID_META` | `parseSDF`, `extractJSON`, `buildSDF`, `validateMeta` | `meta.json` fails structural validation. A required field is absent, has the wrong type, or `document_id` is not a valid UUID v4. |
| `SDF_ERROR_SCHEMA_MISMATCH` | `buildSDF` | `data` does not conform to the provided `schema`. The `errors` property of the thrown error contains AJV validation details. |
| `SDF_ERROR_INVALID_SCHEMA` | `buildSDF` | The `schema` object is not valid JSON Schema Draft 2020-12. |
| `SDF_ERROR_UNSUPPORTED_VERSION` | `parseSDF`, `extractJSON` | The `sdf_version` value in `meta.json` is not supported by this version of `@etapsky/sdf-kit`. |
| `SDF_ERROR_INVALID_SIGNATURE` | `verifySIG` | The `signature.sig` entry is present but structurally malformed. Distinct from a valid-structure-but-wrong-key signature, which causes `verifySIG()` to return `false` rather than throw. |
| `SDF_ERROR_INVALID_ARCHIVE` | `parseSDF`, `extractJSON` | The archive contains path traversal sequences (`..`) in entry names, or is otherwise structurally corrupted. |
| `SDF_ERROR_ARCHIVE_TOO_LARGE` | `parseSDF`, `extractJSON` | The archive exceeds 50 MB compressed or 200 MB uncompressed. This is a ZIP bomb protection limit. |

:::note
Error codes are stable across patch and minor releases. New codes may be added in minor releases but existing codes will not be removed or renamed until the next major version. Do not match against `err.message` — always use `err.code`.
:::

## Type-narrowing example

When you need to handle multiple error codes differently:

```typescript title="typed-error-handling.ts"
import { parseSDF } from '@etapsky/sdf-kit/reader';
import { SDFError } from '@etapsky/sdf-kit';

type SDFErrorCode =
  | 'SDF_ERROR_NOT_ZIP'
  | 'SDF_ERROR_MISSING_FILE'
  | 'SDF_ERROR_INVALID_META'
  | 'SDF_ERROR_SCHEMA_MISMATCH'
  | 'SDF_ERROR_INVALID_SCHEMA'
  | 'SDF_ERROR_UNSUPPORTED_VERSION'
  | 'SDF_ERROR_INVALID_SIGNATURE'
  | 'SDF_ERROR_INVALID_ARCHIVE'
  | 'SDF_ERROR_ARCHIVE_TOO_LARGE';

function isSdfError(err: unknown, code: SDFErrorCode): err is SDFError {
  return err instanceof SDFError && err.code === code;
}

try {
  const result = await parseSDF(buffer);
} catch (err) {
  if (isSdfError(err, 'SDF_ERROR_ARCHIVE_TOO_LARGE')) {
    return reply.status(413).send({ error: 'File exceeds maximum allowed size' });
  }
  if (isSdfError(err, 'SDF_ERROR_NOT_ZIP')) {
    return reply.status(422).send({ error: 'File is not a valid SDF archive' });
  }
  if (err instanceof SDFError) {
    return reply.status(422).send({ error: err.message, code: err.code });
  }
  throw err;
}
```
