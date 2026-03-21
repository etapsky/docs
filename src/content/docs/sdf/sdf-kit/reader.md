---
title: "Reader — parseSDF() / extractJSON()"
description: "Read and parse .sdf files with parseSDF() and extractJSON(). Full API reference."
sidebar:
  label: "Reader"
  order: 3
---

The reader module extracts content from `.sdf` files. It provides two functions: `parseSDF()` for full extraction including the PDF layer, and `extractJSON()` for metadata and structured data only — faster and more memory-efficient for server-side processing.

## Import

```typescript
import { parseSDF, extractJSON } from '@etapsky/sdf-kit/reader';
```

## `parseSDF(buffer)`

```typescript
function parseSDF(buffer: Buffer | Uint8Array): Promise<SDFParseResult>
```

Fully parses an `.sdf` file and returns all four layers: metadata, business data, schema, and the raw PDF bytes.

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `buffer` | `Buffer \| Uint8Array` | Raw bytes of the `.sdf` file |

### Return value

```typescript
interface SDFParseResult {
  meta:     SDFMeta;                    // Parsed meta.json
  data:     Record<string, unknown>;   // Parsed data.json
  schema:   Record<string, unknown>;   // Parsed schema.json
  pdfBytes: Uint8Array;                // Raw bytes of visual.pdf
}
```

### Complete example

```typescript title="read-invoice.ts"
import { parseSDF } from '@etapsky/sdf-kit/reader';
import { SDFError } from '@etapsky/sdf-kit';
import { readFile } from 'node:fs/promises';

const buffer = await readFile('invoice.sdf');

try {
  const { meta, data, schema, pdfBytes } = await parseSDF(buffer);

  console.log('Document ID:',   meta.document_id);
  console.log('Document type:', meta.document_type);
  console.log('Issuer:',        meta.issuer);
  console.log('Created at:',    meta.created_at);

  // Access business data
  const invoice = data as { invoice_number: string; total: { amount: string; currency: string } };
  console.log('Invoice number:', invoice.invoice_number);
  console.log('Total:',          `${invoice.total.amount} ${invoice.total.currency}`);

  // pdfBytes is a Uint8Array — write it, display it, or pass it to a PDF viewer
  await writeFile('extracted.pdf', pdfBytes);
} catch (err) {
  if (err instanceof SDFError) {
    console.error(`SDF error [${err.code}]: ${err.message}`);
  }
  throw err;
}
```

## `extractJSON(buffer)`

```typescript
function extractJSON(buffer: Buffer | Uint8Array): Promise<SDFParseResultJSON>
```

Parses an `.sdf` file and returns only the JSON layers — `meta`, `data`, and `schema`. The `visual.pdf` file is not read from the archive, making this significantly faster and more memory-efficient when you only need the structured data.

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `buffer` | `Buffer \| Uint8Array` | Raw bytes of the `.sdf` file |

### Return value

```typescript
interface SDFParseResultJSON {
  meta:   SDFMeta;
  data:   Record<string, unknown>;
  schema: Record<string, unknown>;
  // pdfBytes is absent — visual.pdf is not loaded
}
```

### Complete example

```typescript title="extract-json.ts"
import { extractJSON } from '@etapsky/sdf-kit/reader';
import { readFile } from 'node:fs/promises';

const buffer = await readFile('invoice.sdf');
const { meta, data, schema } = await extractJSON(buffer);

// Use the structured data directly — no PDF overhead
console.log(meta.document_id);
console.log(data);
```

## When to use each function

| Use case | Recommended function | Reason |
|----------|---------------------|--------|
| Rendering the PDF in a viewer | `parseSDF()` | Requires `pdfBytes` |
| Displaying document info in a UI | `parseSDF()` | Typically needs both layers |
| Server-side data extraction | `extractJSON()` | Avoids loading PDF bytes into memory |
| Bulk processing / indexing | `extractJSON()` | Much faster at scale |
| ERP integration / data push | `extractJSON()` | Only structured data is needed |
| Validation pipelines | `extractJSON()` | Schema and data are sufficient |
| Download endpoint (serving the file) | Neither — serve the raw buffer directly | No parsing needed |

:::tip
For any server-side workflow where you do not need the visual representation, prefer `extractJSON()`. On a large `.sdf` file with an embedded PDF of several megabytes, this can reduce memory allocation by an order of magnitude.
:::

## Reading from an HTTP request

```typescript title="routes/process.ts"
import { extractJSON } from '@etapsky/sdf-kit/reader';

// Fastify multipart upload handler
fastify.post('/process', async (request, reply) => {
  const data = await request.file();
  const buffer = await data.toBuffer();

  const { meta, data: docData } = await extractJSON(buffer);

  return reply.send({
    document_id:   meta.document_id,
    document_type: meta.document_type,
    issuer:        meta.issuer,
    data:          docData,
  });
});
```

## Reading from S3 / object storage

```typescript title="read-from-s3.ts"
import { extractJSON } from '@etapsky/sdf-kit/reader';

async function readDocumentFromS3(storageKey: string) {
  // Fetch using your S3 client (native fetch + SigV4)
  const response = await s3.getObject(storageKey);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return extractJSON(buffer);
}
```

## Error handling

Both functions throw `SDFError` for all spec-level failures.

| Error code | Cause |
|------------|-------|
| `SDF_ERROR_NOT_ZIP` | The buffer is not a valid ZIP archive |
| `SDF_ERROR_MISSING_FILE` | A required entry (`meta.json`, `data.json`, `schema.json`, or `visual.pdf`) is absent from the archive |
| `SDF_ERROR_INVALID_META` | `meta.json` fails schema validation |
| `SDF_ERROR_INVALID_ARCHIVE` | The archive contains path traversal sequences (`..`) or is otherwise corrupted |
| `SDF_ERROR_ARCHIVE_TOO_LARGE` | The archive exceeds 50 MB compressed or 200 MB uncompressed |
| `SDF_ERROR_UNSUPPORTED_VERSION` | The `sdf_version` in `meta.json` is not supported by this version of `sdf-kit` |

```typescript title="error-handling.ts"
import { parseSDF } from '@etapsky/sdf-kit/reader';
import { SDFError } from '@etapsky/sdf-kit';

try {
  const result = await parseSDF(buffer);
} catch (err) {
  if (err instanceof SDFError) {
    switch (err.code) {
      case 'SDF_ERROR_NOT_ZIP':
        // File is not an SDF archive at all
        break;
      case 'SDF_ERROR_MISSING_FILE':
        // Incomplete archive — required layer is absent
        break;
      case 'SDF_ERROR_ARCHIVE_TOO_LARGE':
        // Reject immediately — potential ZIP bomb
        break;
      default:
        console.error(`SDF error [${err.code}]: ${err.message}`);
    }
  }
  throw err;
}
```
