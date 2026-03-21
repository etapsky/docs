---
title: "Authentication"
description: "SDF Server authentication — API keys and JWT. Dual auth middleware."
sidebar:
  label: "Authentication"
  order: 3
---

SDF Server supports two authentication methods: **API keys** for machine-to-machine access and **JWTs** for user sessions. Both resolve to the same tenant context and are handled by a single dual-auth middleware.

## Dual auth middleware

Every incoming request passes through `authMiddleware`, which checks for credentials in this order:

1. `X-API-Key` header — triggers API key verification
2. `Authorization: Bearer <token>` header — triggers JWT verification

If neither is present, the request is rejected with `401 Unauthorized`. If both are present, `X-API-Key` takes precedence.

On success, the middleware injects the resolved `tenant_id` into the request context. All downstream handlers use this context — there is no other way to identify the tenant.

## API keys

API keys are the primary authentication method for automated clients: ERP connectors, CI pipelines, and third-party integrations.

### Key format

```
sdf_k1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7
```

Every API key starts with the `sdf_k` prefix followed by a cryptographically random suffix. The first 8 characters of the full key (e.g. `sdf_k1a2`) form the **key prefix**, which is displayed in the admin UI so you can identify a key without revealing the secret.

### Security model

- The raw key is only returned **once** — at generation time. It is never stored on the server.
- The server stores only a **SHA-256 + salt hash** of the raw key.
- Verification uses `crypto.timingSafeEqual()` to prevent timing attacks.
- Keys support expiry (`expires_at`) and instant revocation (`revoked_at`).

### Usage

```http
POST /sdf HTTP/1.1
X-API-Key: sdf_k1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7
Content-Type: multipart/form-data
...
```

### Generating a key

API keys are generated via the admin API. See [Endpoints — Admin](/sdf/sdf-server/endpoints#generate-api-key----post-admintenantsidkeys).

```bash
curl -X POST http://localhost:3000/admin/tenants/<tenant_id>/keys \
  -H "Authorization: Bearer <admin_jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "SAP S/4HANA connector",
    "expires_at": "2027-01-01T00:00:00.000Z"
  }'
```

```json
{
  "id": "k1a2b3c4-...",
  "key": "sdf_k1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7",
  "key_prefix": "sdf_k1a2",
  "name": "SAP S/4HANA connector",
  "expires_at": "2027-01-01T00:00:00.000Z"
}
```

Store the `key` value immediately. It will not be returned again.

### Revoking a key

```bash
curl -X DELETE http://localhost:3000/admin/keys/<key_id> \
  -H "Authorization: Bearer <admin_jwt>"
```

Revocation is immediate. The key will be rejected on its next use.

## JWT authentication

JWTs are used when a user authenticates through the portal or a custom frontend. The server issues JWTs with the following characteristics:

| Property | Value |
|----------|-------|
| Algorithm | HS256 |
| TTL | 8 hours |
| Claims | `tenant_id`, `sub` (user or service ID), `iat`, `exp` |
| Secret | Configured via `JWT_SECRET` environment variable |

### Usage

```http
GET /sdf HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token validation

The middleware validates:

1. The token signature using `JWT_SECRET`
2. The `exp` claim (token must not be expired)
3. The `tenant_id` claim (must reference an existing tenant)

Invalid or expired tokens are rejected with `401 Unauthorized`.

## Admin authentication

Admin endpoints (`/admin/*`) require a separate admin JWT signed with `ADMIN_JWT_SECRET`. This is enforced by `adminAuthMiddleware`, which runs in addition to — not instead of — the standard auth check.

Using a regular tenant JWT on an admin endpoint returns `403 Forbidden`.

```http
POST /admin/tenants HTTP/1.1
Authorization: Bearer <admin_jwt>
Content-Type: application/json
```

The admin JWT is generated outside the normal auth flow — typically by a deployment script or operator tooling that has direct access to `ADMIN_JWT_SECRET`.

## Rate limiting

Rate limiting is applied per tenant after authentication. The default limit is 60 requests per minute and is configurable per tenant via `tenants.rate_limit_rpm`.

When a tenant exceeds its limit, the server returns:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 43
```

The event is written to the audit log. One tenant exceeding its rate limit has no effect on other tenants.

## Audit log entries

Every authenticated request that modifies state produces an `audit_log` record:

```json
{
  "tenant_id": "c1d2e3f4-...",
  "action": "upload",
  "resource_id": "3f8a1c2d-...",
  "actor": "api_key:sdf_k1a2",
  "ip_address": "203.0.113.45",
  "metadata": { "document_type": "invoice", "file_size_bytes": 48291 }
}
```

The `actor` field uses the format `api_key:<key_prefix>` for API key requests and a user ID for JWT requests. Audit log records are append-only and can never be deleted.

## SAML 2.0 SSO

Enterprises can configure per-tenant SAML 2.0 SSO through the admin API. On successful SAML authentication, the server issues a standard JWT. From that point, the request flow is identical to password-based JWT auth.

SAML configuration is stored per tenant:

| Field | Description |
|-------|-------------|
| `saml_enabled` | Enables the SAML flow for this tenant |
| `saml_metadata_url` | URL of the IdP's SAML metadata document |
| `saml_entity_id` | The SP entity ID to present to the IdP |

See [Endpoints — SAML](/sdf/sdf-server/endpoints#saml-20) for the endpoint details.
