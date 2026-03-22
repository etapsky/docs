---
title: "API Reference"
description: "Complete REST API reference for the Etapsky SDF platform — authentication, endpoints, request/response schemas, and code examples."
sidebar:
  label: "API Reference"
  order: 0
---

import { Tabs, TabItem } from '@astrojs/starlight/components';

The Etapsky REST API is served from `https://api.etapsky.com`. All requests must be authenticated. All request and response bodies are JSON unless otherwise noted (SDF file upload/download use `multipart/form-data` and `application/octet-stream` respectively).

**Base URL:** `https://api.etapsky.com`

**API version prefix:** `/v1/` (SaaS platform endpoints)

---

## Authentication

The API supports two authentication methods.

### API Key (recommended for server-to-server)

Pass your API key in the `X-API-Key` header:

```http
GET /v1/documents HTTP/1.1
Host: api.etapsky.com
X-API-Key: sdf_k1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7
```

API keys are generated in the [Etapsky Portal](https://portal.etapsky.com) under **API Keys**. Each key is scoped to your tenant and shown once at creation — store it securely.

:::danger
Never expose API keys in client-side code, public repositories, or browser network requests. Use environment variables and server-side API calls.
:::

### Bearer JWT (for portal sessions)

Pass the access token returned by `/v1/auth/login`:

```http
GET /v1/documents HTTP/1.1
Host: api.etapsky.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Access tokens expire after **15 minutes**. Use `/v1/auth/refresh` to obtain a new token without re-authenticating.

---

## Rate Limits

Rate limits are enforced per tenant, per minute. Limits vary by plan:

| Plan | Requests/minute |
|------|----------------|
| Free | 20 |
| Developer | 60 |
| Team | 300 |
| Business | 1,000 |
| Enterprise | Custom |

When a rate limit is exceeded, the API returns `HTTP 429` with a `Retry-After` header indicating seconds until the limit resets. Exceeding the limit also writes an entry to your tenant's audit log.

---

## Errors

All errors follow a consistent shape:

```json
{
  "error": {
    "code": "SDF_ERROR_SCHEMA_MISMATCH",
    "message": "data.json failed schema validation: required field 'invoice_number' is missing",
    "details": [
      {
        "path": "/invoice_number",
        "message": "must have required property 'invoice_number'"
      }
    ]
  }
}
```

| HTTP status | When |
|-------------|------|
| `400` | Invalid request body or parameters |
| `401` | Missing or invalid credentials |
| `403` | Valid credentials but insufficient permissions |
| `404` | Resource not found |
| `409` | Conflict (e.g., duplicate schema ID/version) |
| `413` | Payload too large (SDF file exceeds 50 MB) |
| `422` | Unprocessable entity (SDF validation failed) |
| `429` | Rate limit exceeded |
| `500` | Internal server error |

See [Error Codes](/sdf/reference/error-codes/) for the full list of `code` values.

---

## Documents

### Upload a document

Upload a `.sdf` file. The file is validated asynchronously after upload; the initial response reflects the `pending` status.

```http
POST /upload
Content-Type: multipart/form-data
X-API-Key: <key>
```

**Request (multipart):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | binary | yes | The `.sdf` file |

**Response `201 Created`:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "document_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "document_type": "invoice",
  "schema_id": "invoice/v1.0",
  "sdf_version": "0.1",
  "is_signed": false,
  "status": "pending",
  "file_size_bytes": 84210,
  "created_at": "2026-03-22T14:30:00.000Z"
}
```

<Tabs>
  <TabItem label="TypeScript">
    ```typescript title="upload.ts"
    const form = new FormData();
    form.append('file', new Blob([sdfBuffer]), 'invoice.sdf');

    const res = await fetch('https://api.etapsky.com/upload', {
      method: 'POST',
      headers: { 'X-API-Key': process.env.SDF_API_KEY! },
      body: form,
    });

    const doc = await res.json();
    console.log('Uploaded:', doc.id, 'status:', doc.status);
    ```
  </TabItem>
  <TabItem label="Python">
    ```python title="upload.py"
    import httpx

    with open('invoice.sdf', 'rb') as f:
        res = httpx.post(
            'https://api.etapsky.com/upload',
            headers={'X-API-Key': os.environ['SDF_API_KEY']},
            files={'file': ('invoice.sdf', f, 'application/octet-stream')},
        )

    doc = res.json()
    print(f"Uploaded: {doc['id']} status: {doc['status']}")
    ```
  </TabItem>
  <TabItem label="cURL">
    ```bash
    curl -X POST https://api.etapsky.com/upload \
      -H "X-API-Key: $SDF_API_KEY" \
      -F "file=@invoice.sdf"
    ```
  </TabItem>
</Tabs>

---

### Download a document

```http
GET /download/:id
X-API-Key: <key>
```

**Response `200 OK`:**

Returns the `.sdf` file as `application/octet-stream`.

```bash
curl https://api.etapsky.com/download/550e8400-e29b-41d4-a716-446655440000 \
  -H "X-API-Key: $SDF_API_KEY" \
  -o downloaded.sdf
```

---

### Get document metadata

```http
GET /meta/:id
X-API-Key: <key>
```

**Response `200 OK`:**

Returns the `meta.json` content of the SDF file:

```json
{
  "sdf_version": "0.1",
  "document_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "document_type": "invoice",
  "schema_id": "invoice/v1.0",
  "issuer": { "name": "Acme Corp", "id": "DE123456789" },
  "issued_at": "2026-03-22T14:00:00+01:00",
  "locale": "en-US"
}
```

---

### Get document data

```http
GET /data/:id
X-API-Key: <key>
```

Returns the `data.json` content of the SDF file — the structured business data. The shape depends on the document type and schema.

---

### List documents

```http
GET /list
X-API-Key: <key>
```

**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | integer | Number of results (default: 20, max: 100) |
| `cursor` | string | Pagination cursor from previous response |
| `document_type` | string | Filter by type: `invoice`, `nomination`, etc. |
| `status` | string | Filter by status: `pending`, `valid`, `invalid`, `signed` |

**Response `200 OK`:**

```json
{
  "documents": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "document_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "document_type": "invoice",
      "status": "valid",
      "is_signed": false,
      "file_size_bytes": 84210,
      "created_at": "2026-03-22T14:30:00.000Z"
    }
  ],
  "next_cursor": "eyJpZCI6IjU1MGU4...",
  "has_more": true
}
```

---

### Delete a document

```http
DELETE /delete/:id
X-API-Key: <key>
```

Permanently deletes the SDF file and its database record. Writes an audit log entry. Returns `204 No Content`.

---

### Validate a document (synchronous)

```http
POST /validate
Content-Type: multipart/form-data
X-API-Key: <key>
```

Validates a `.sdf` file synchronously without persisting it. Useful for CI pipelines and pre-upload checks.

**Response `200 OK` (valid):**

```json
{
  "valid": true,
  "sdf_version": "0.1",
  "document_type": "invoice",
  "is_signed": false,
  "checks": {
    "container": "pass",
    "meta": "pass",
    "schema": "pass",
    "data": "pass",
    "signature": "skipped"
  }
}
```

**Response `422 Unprocessable Entity` (invalid):**

```json
{
  "valid": false,
  "error": {
    "code": "SDF_ERROR_SCHEMA_MISMATCH",
    "message": "data.json failed schema validation",
    "details": [{ "path": "/total/amount", "message": "must be string" }]
  }
}
```

---

## Signing

### Sign a document

```http
POST /sign/:id
X-API-Key: <key>
```

Enqueues an async signing job. The document must exist and have `status: valid`. Uses the tenant's active signing key.

**Response `202 Accepted`:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "job_id": "sign-job-abc123"
}
```

When the job completes, the document status transitions to `signed` and a `document.signed` webhook event is fired (if configured).

---

### Verify a signature

```http
POST /verify/:id
X-API-Key: <key>
```

Synchronously verifies the document's digital signature.

**Response `200 OK`:**

```json
{
  "valid": true,
  "algorithm": "ECDSA-P256",
  "key_id": "tenant-key-2026-03",
  "signed_at": "2026-03-22T15:00:00.000Z"
}
```

---

## Schema Registry

### List schemas

```http
GET /schemas
X-API-Key: <key>
```

Returns all schemas registered for your tenant.

### Get a schema

```http
GET /schemas/:id
X-API-Key: <key>
```

Returns the full JSON Schema for the given schema ID (e.g., `invoice/v1.0`).

### Register a schema

```http
POST /schemas
Content-Type: application/json
X-API-Key: <key>
```

```json
{
  "schema_id": "invoice",
  "version": "2.0",
  "schema": { "$schema": "...", "type": "object", "..." : "..." }
}
```

---

## SaaS API — `/v1/` endpoints

The versioned `/v1/` endpoints are available on the SaaS platform and require portal authentication (JWT).

### Authentication

#### Register

```http
POST /v1/auth/register
Content-Type: application/json
```

```json
{
  "email": "you@company.com",
  "password": "my-secure-password-123!",
  "organization": "Acme Corp",
  "slug": "acme-corp"
}
```

**Response `201 Created`:**

```json
{
  "user": { "id": "...", "email": "you@company.com", "role": "owner" },
  "organization": { "id": "...", "name": "Acme Corp", "slug": "acme-corp" }
}
```

An email verification message is sent automatically.

---

#### Login

```http
POST /v1/auth/login
Content-Type: application/json
```

```json
{
  "email": "you@company.com",
  "password": "my-secure-password-123!"
}
```

**Response `200 OK`:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "rt_abc123...",
  "expires_in": 900,
  "token_type": "Bearer"
}
```

If 2FA is enabled, the response will be:

```json
{
  "totp_required": true,
  "session_token": "temp_sess_abc123"
}
```

Follow up with `POST /v1/auth/totp/validate`.

---

#### Refresh token

```http
POST /v1/auth/refresh
Content-Type: application/json
```

```json
{
  "refresh_token": "rt_abc123..."
}
```

Refresh tokens rotate on every use. Each refresh invalidates the previous token and issues a new one. Using a revoked refresh token invalidates all sessions for that user (theft detection).

---

#### Logout

```http
POST /v1/auth/logout
Authorization: Bearer <access_token>
```

Revokes the current session's refresh token. Returns `204 No Content`.

---

### Account

#### Get organization

```http
GET /v1/account/organization
Authorization: Bearer <access_token>
```

#### Get profile

```http
GET /v1/account/profile
Authorization: Bearer <access_token>
```

#### List team members

```http
GET /v1/account/team
Authorization: Bearer <access_token>
```

---

### Billing

#### Get current plan

```http
GET /v1/billing/plan
Authorization: Bearer <access_token>
```

#### Get usage

```http
GET /v1/billing/usage
Authorization: Bearer <access_token>
```

Returns usage metrics for the current billing period:

```json
{
  "period": { "start": "2026-03-01", "end": "2026-03-31" },
  "documents_uploaded": 842,
  "documents_limit": 1000,
  "api_calls": 15230,
  "api_calls_limit": 50000,
  "storage_bytes": 1048576000,
  "storage_limit_bytes": 10737418240
}
```

---

### Audit Log

```http
GET /v1/audit
Authorization: Bearer <access_token>
```

**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | integer | Default: 50, max: 200 |
| `cursor` | string | Pagination cursor |
| `action` | string | Filter by action type |
| `actor` | string | Filter by user ID or API key prefix |
| `from` | ISO8601 | Start of time range |
| `to` | ISO8601 | End of time range |

Audit log entries are **append-only** and cannot be modified or deleted. Retained for 7 years.

---

## Webhooks

Configure webhook endpoints to receive real-time event notifications. All webhook payloads are signed with HMAC-SHA256 using your webhook secret.

### Event types

| Event | Trigger |
|-------|---------|
| `document.uploaded` | A document has been successfully uploaded |
| `document.validated` | Async validation completed (valid or invalid) |
| `document.signed` | Async signing completed |
| `document.deleted` | A document was deleted |

### Payload signature

Verify the webhook authenticity by checking the `X-SDF-Signature` header:

```typescript title="verify-webhook.ts"
import { createHmac, timingSafeEqual } from 'crypto';

function verifyWebhook(payload: string, signature: string, secret: string): boolean {
  const expected = createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return timingSafeEqual(
    Buffer.from(`sha256=${expected}`),
    Buffer.from(signature),
  );
}
```

---

## SDKs

Use the official SDKs instead of calling the API directly:

| SDK | Package | Description |
|-----|---------|-------------|
| TypeScript/Node.js | [`@etapsky/cloud-sdk`](https://www.npmjs.com/package/@etapsky/cloud-sdk) | Upload, download, sign, verify |
| TypeScript (core) | [`@etapsky/sdf-kit`](https://www.npmjs.com/package/@etapsky/sdf-kit) | Build and parse `.sdf` files locally |
| Python | [`etapsky-sdf`](https://pypi.org/project/etapsky-sdf/) | Python SDK for producers and consumers |

See [Cloud SDK →](/sdf/cloud-sdk/) for the TypeScript client reference.

---

## OpenAPI specification

The full OpenAPI 3.1 specification is available at:

```
https://api.etapsky.com/openapi.json
```

You can import it into Postman, Insomnia, or any OpenAPI-compatible tooling.
