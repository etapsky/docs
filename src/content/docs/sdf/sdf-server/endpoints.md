---
title: "REST Endpoints"
description: "Complete SDF Server REST API reference — all endpoints, request/response formats, and authentication."
sidebar:
  label: "Endpoints"
  order: 2
---

All endpoints require a valid `X-API-Key` or `Authorization: Bearer <jwt>` header unless otherwise noted. Admin endpoints require a separate admin JWT. See [Authentication](/sdf/sdf-server/authentication) for details.

## SDF Documents

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/sdf` | Upload a `.sdf` file |
| `GET` | `/sdf/:id` | Download a `.sdf` file |
| `GET` | `/sdf/:id/meta` | Retrieve `meta.json` |
| `GET` | `/sdf/:id/data` | Retrieve `data.json` |
| `DELETE` | `/sdf/:id` | Delete a document and its storage object |
| `GET` | `/sdf` | List documents (paginated) |

### Upload — `POST /sdf`

Upload a `.sdf` file. The server stores it in S3/MinIO and enqueues a background validation job.

**Request:**

```http
POST /sdf HTTP/1.1
X-API-Key: sdf_k1a2b3c4d5e6f7...
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="file"; filename="invoice.sdf"
Content-Type: application/octet-stream

<binary SDF data>
--boundary--
```

**Response `201 Created`:**

```json
{
  "id": "3f8a1c2d-e4f5-4a6b-b7c8-9d0e1f2a3b4c",
  "document_id": "a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6",
  "document_type": "invoice",
  "schema_id": "invoice/v0.2",
  "sdf_version": "0.1",
  "is_signed": false,
  "status": "pending",
  "file_size_bytes": 48291,
  "job_id": "validate-sdf:7f9e3a1b",
  "created_at": "2026-03-15T14:30:00.000Z"
}
```

The `status` field moves from `pending` → `valid` or `invalid` once the `validate-sdf` worker completes. Poll `GET /sdf/:id` or receive a webhook notification.

### Download — `GET /sdf/:id`

Returns the raw `.sdf` binary (ZIP).

```http
GET /sdf/3f8a1c2d-e4f5-4a6b-b7c8-9d0e1f2a3b4c HTTP/1.1
X-API-Key: sdf_k1a2b3c4d5e6f7...
```

**Response `200 OK`:**

```
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="invoice.sdf"

<binary>
```

### Get meta — `GET /sdf/:id/meta`

Returns the parsed `meta.json` from inside the SDF archive.

**Response `200 OK`:**

```json
{
  "sdf_version": "0.1",
  "document_id": "a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6",
  "document_type": "invoice",
  "schema_id": "invoice/v0.2",
  "issuer": { "name": "Acme Supplies GmbH", "id": "DE123456789" },
  "issued_at": "2026-03-15T12:00:00.000Z",
  "locale": "de-DE"
}
```

### Get data — `GET /sdf/:id/data`

Returns the parsed `data.json` from inside the SDF archive.

**Response `200 OK`:**

```json
{
  "invoice_number": "INV-2026-001",
  "issue_date": "2026-03-15",
  "due_date": "2026-04-14",
  "payment_terms": "NET_30",
  "total": { "amount": "1250.00", "currency": "EUR" }
}
```

### List documents — `GET /sdf`

Returns a paginated list of documents for the authenticated tenant.

**Query parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | `number` | `1` | Page number |
| `limit` | `number` | `20` | Items per page (max 100) |
| `status` | `string` | — | Filter by status: `pending`, `valid`, `invalid`, `signed` |
| `document_type` | `string` | — | Filter by document type |

**Response `200 OK`:**

```json
{
  "data": [
    {
      "id": "3f8a1c2d-...",
      "document_id": "a1b2c3d4-...",
      "document_type": "invoice",
      "schema_id": "invoice/v0.2",
      "is_signed": true,
      "status": "signed",
      "file_size_bytes": 48291,
      "created_at": "2026-03-15T14:30:00.000Z"
    }
  ],
  "total": 142,
  "page": 1,
  "limit": 20
}
```

---

## Signing

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/sign/:id` | Sign an SDF document (async) |
| `POST` | `/verify/:id` | Verify a document's signature |

### Sign — `POST /sign/:id`

Enqueues a `sign-sdf` job. The SDF is signed using the tenant's active `signing_key` and re-uploaded to S3.

**Response `202 Accepted`:**

```json
{
  "job_id": "sign-sdf:9c2e4f1a",
  "status": "queued"
}
```

Once the job completes, the document `status` becomes `signed` and `is_signed` becomes `true`.

### Verify — `POST /verify/:id`

Synchronously verifies the digital signature on the document.

**Response `200 OK`:**

```json
{
  "valid": true,
  "algorithm": "ECDSA-P256",
  "key_id": "key-2026-03"
}
```

**Response `200 OK` (invalid signature):**

```json
{
  "valid": false,
  "error": "SDF_ERROR_INVALID_SIGNATURE"
}
```

---

## Validation

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/validate` | Synchronous full validation |

### Validate — `POST /validate`

Validates a `.sdf` file without storing it. Returns the full validation report synchronously.

**Request:**

```http
POST /validate HTTP/1.1
X-API-Key: sdf_k1a2b3c4d5e6f7...
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="file"; filename="invoice.sdf"
...
```

**Response `200 OK`:**

```json
{
  "valid": true,
  "sdf_version": "0.1",
  "document_type": "invoice",
  "schema_id": "invoice/v0.2",
  "is_signed": false,
  "errors": []
}
```

**Response `200 OK` (validation failed):**

```json
{
  "valid": false,
  "errors": [
    {
      "code": "SDF_ERROR_SCHEMA_MISMATCH",
      "message": "data.json does not satisfy schema.json",
      "details": [
        { "path": "/total/currency", "message": "must match pattern ^[A-Z]{3}$" }
      ]
    }
  ]
}
```

---

## Schema Registry

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/schemas` | List registered schemas |
| `GET` | `/schemas/:id` | Get schema by ID |
| `POST` | `/schemas` | Register a new schema version |

### List schemas — `GET /schemas`

```json
[
  { "schema_id": "invoice", "versions": ["v0.1", "v0.2"] },
  { "schema_id": "nomination", "versions": ["v1.0"] }
]
```

### Get schema — `GET /schemas/:id`

The `:id` path parameter uses the format `{type}:{version}`, e.g. `invoice:v0.2`.

**Response `200 OK`:**

```json
{
  "schema_id": "invoice",
  "version": "v0.2",
  "schema": { "$schema": "...", "type": "object", "properties": { ... } },
  "is_published": true,
  "created_at": "2026-02-01T10:00:00.000Z"
}
```

### Register schema — `POST /schemas`

```json
{
  "schema_id": "invoice",
  "version": "v0.3",
  "schema": { "$schema": "https://json-schema.org/draft/2020-12/schema", ... }
}
```

**Response `201 Created`:**

```json
{
  "id": "7d9f3a1b-...",
  "schema_id": "invoice",
  "version": "v0.3",
  "is_published": false,
  "created_at": "2026-03-21T09:00:00.000Z"
}
```

---

## SAML 2.0

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/saml/metadata` | SP metadata XML for IdP configuration |
| `GET` | `/saml/login` | Initiate SP-initiated SSO |
| `POST` | `/saml/acs` | Assertion Consumer Service callback |

These endpoints do not require an API key or JWT. See your IdP documentation for SAML 2.0 SP setup. Configure the tenant's IdP in the admin API before using these endpoints.

---

## Admin

All admin endpoints require `Authorization: Bearer <admin_jwt>`. The admin JWT is signed with `ADMIN_JWT_SECRET`, which is separate from `JWT_SECRET`.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/admin/tenants` | Create a new tenant |
| `GET` | `/admin/tenants` | List all tenants |
| `PUT` | `/admin/tenants/:id` | Update tenant |
| `DELETE` | `/admin/tenants/:id` | Delete tenant |
| `POST` | `/admin/tenants/:id/keys` | Generate an API key |
| `DELETE` | `/admin/keys/:keyId` | Revoke an API key |
| `GET` | `/admin/audit` | Query the audit log |

### Create tenant — `POST /admin/tenants`

```json
{
  "name": "Acme Corp",
  "slug": "acme",
  "rate_limit_rpm": 120
}
```

**Response `201 Created`:**

```json
{
  "id": "c1d2e3f4-...",
  "name": "Acme Corp",
  "slug": "acme",
  "rate_limit_rpm": 120,
  "created_at": "2026-03-21T09:00:00.000Z"
}
```

### Generate API key — `POST /admin/tenants/:id/keys`

```json
{
  "name": "ERP integration key",
  "expires_at": "2027-03-21T00:00:00.000Z"
}
```

**Response `201 Created`:**

```json
{
  "id": "k1a2b3c4-...",
  "key": "sdf_k1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7",
  "key_prefix": "sdf_k1a2",
  "name": "ERP integration key",
  "expires_at": "2027-03-21T00:00:00.000Z"
}
```

:::caution
The `key` field is only returned once. Store it immediately — it cannot be retrieved again. Only the SHA-256 hash is stored server-side.
:::

### Query audit log — `GET /admin/audit`

| Parameter | Type | Description |
|-----------|------|-------------|
| `tenant_id` | `string` | Filter by tenant |
| `action` | `string` | Filter by action type |
| `from` | `string` | ISO 8601 start timestamp |
| `to` | `string` | ISO 8601 end timestamp |
| `page` | `number` | Page number (default 1) |
| `limit` | `number` | Items per page (default 50, max 500) |

---

## ERP Connectors

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/connectors/configure` | Save ERP connection config |
| `GET` | `/connectors/health` | Test ERP connection |
| `POST` | `/connectors/match` | Match an SDF nomination in the ERP |
| `GET` | `/connectors/erp-status/:ref` | Get document status from ERP |
| `POST` | `/connectors/push-to-erp/:id` | Push SDF document to ERP |

---

## Health

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness check |

**Response `200 OK`:**

```json
{
  "status": "ok",
  "version": "0.1.2",
  "uptime": 3728
}
```

---

## Error responses

All error responses use a consistent JSON envelope:

```json
{
  "error": {
    "code": "SDF_ERROR_SCHEMA_MISMATCH",
    "message": "Human-readable description",
    "statusCode": 422
  }
}
```

| Status | When |
|--------|------|
| `400` | Malformed request body or missing required fields |
| `401` | Missing or invalid authentication credentials |
| `403` | Valid credentials but insufficient permissions |
| `404` | Document or resource not found |
| `422` | SDF validation error |
| `429` | Rate limit exceeded (per-tenant) |
| `500` | Internal server error |
