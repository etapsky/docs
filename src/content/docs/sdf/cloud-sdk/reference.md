---
title: "SDK Reference"
description: "Complete SDFCloudClient method reference."
sidebar:
  label: "Reference"
  order: 3
---

## `SDFCloudClient`

The main entry point of the SDK.

```typescript
import { SDFCloudClient } from '@etapsky/cloud-sdk';

const client = new SDFCloudClient(options: SDFCloudClientOptions);
```

### Constructor options

```typescript
interface SDFCloudClientOptions {
  /** API key issued from portal.etapsky.com. Required. */
  apiKey: string;
  /** Base URL of the API. Defaults to 'https://api.etapsky.com'. */
  baseUrl?: string;
}
```

---

## `client.upload(buffer, options)`

Upload an SDF document. Returns a `documentId` and triggers asynchronous validation.

```typescript
const { documentId } = await client.upload(buffer, { type: 'invoice' });
```

**Parameters**

| Name | Type | Description |
|------|------|-------------|
| `buffer` | `Uint8Array \| Buffer` | Raw `.sdf` file content |
| `options.type` | `string` | Document type: `'invoice'`, `'nomination'`, `'purchase_order'`, or any custom type |

**Returns**

```typescript
interface UploadResult {
  documentId: string;   // UUID of the stored document
  status: 'pending';    // Initial status — validation runs asynchronously
}
```

**Errors**

- `HTTP 400` — malformed SDF archive (not a valid ZIP, missing required files)
- `HTTP 413` — file exceeds the 50 MB limit

---

## `client.download(documentId)`

Download a stored SDF document by ID.

```typescript
const buffer = await client.download(documentId);
```

**Parameters**

| Name | Type | Description |
|------|------|-------------|
| `documentId` | `string` | UUID returned by `upload()` |

**Returns**

`Promise<Uint8Array>` — raw `.sdf` file content.

**Errors**

- `HTTP 404` — document not found or does not belong to your tenant

---

## `client.sign(documentId)`

Request asynchronous signing of a document. Returns a job ID; use `waitForJob()` to poll for completion.

```typescript
const { jobId } = await client.sign(documentId);
```

**Parameters**

| Name | Type | Description |
|------|------|-------------|
| `documentId` | `string` | UUID of the document to sign |

**Returns**

```typescript
interface SignJobResult {
  jobId: string;
  status: 'queued';
}
```

Signing uses the tenant's active signing key (`ECDSA-P256` or `RSA-2048`). Keys are managed via the Admin API. If no active signing key exists, the request fails with `HTTP 422`.

---

## `client.waitForJob(jobId, options?)`

Poll an async job (sign or validate) until it completes or times out.

```typescript
const result = await client.waitForJob(jobId);
```

**Parameters**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `jobId` | `string` | — | Job ID returned by `sign()` |
| `options.pollIntervalMs` | `number` | `1000` | Polling interval in milliseconds |
| `options.timeoutMs` | `number` | `30000` | Maximum wait time |

**Returns**

```typescript
interface JobCompletionResult {
  jobId: string;
  status: 'completed' | 'failed';
  documentId: string;
  error?: string;   // present when status === 'failed'
}
```

**Errors**

- `SDFTimeoutError` — job did not complete within `timeoutMs`

---

## `client.verify(documentId)`

Verify the digital signature of a signed document.

```typescript
const { valid, algorithm, verifiedAt } = await client.verify(documentId);
```

**Parameters**

| Name | Type | Description |
|------|------|-------------|
| `documentId` | `string` | UUID of a signed document |

**Returns**

```typescript
interface VerifyResult {
  valid: boolean;
  algorithm: 'ECDSA-P256' | 'RSA-2048' | null;
  verifiedAt: string;   // ISO 8601 timestamp
  reason?: string;      // present when valid === false
}
```

**Errors**

- `HTTP 404` — document not found
- `HTTP 422` — document has no signature to verify

---

## Error handling

All SDK methods throw typed errors. Catch them for structured error handling:

```typescript
import { SDFCloudClient, SDFApiError, SDFTimeoutError } from '@etapsky/cloud-sdk';

try {
  const { documentId } = await client.upload(buffer, { type: 'invoice' });
  const { jobId } = await client.sign(documentId);
  await client.waitForJob(jobId, { timeoutMs: 60_000 });
} catch (err) {
  if (err instanceof SDFApiError) {
    console.error('API error:', err.statusCode, err.message);
  } else if (err instanceof SDFTimeoutError) {
    console.error('Job timed out:', err.jobId);
  } else {
    throw err;
  }
}
```

### `SDFApiError`

Thrown when the API returns a non-2xx response.

```typescript
class SDFApiError extends Error {
  statusCode: number;
  code: string;       // e.g. 'API_KEY_EXPIRED', 'DOCUMENT_NOT_FOUND'
  requestId: string;  // include in support requests
}
```

### `SDFTimeoutError`

Thrown when `waitForJob()` exceeds `timeoutMs`.

```typescript
class SDFTimeoutError extends Error {
  jobId: string;
}
```
