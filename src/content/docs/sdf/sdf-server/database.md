---
title: "Database"
description: "PostgreSQL 17 schema for SDF Server — tables, relationships, and migration."
sidebar:
  label: "Database"
  order: 6
---

SDF Server uses PostgreSQL 17 with Drizzle ORM. The full schema is defined in `packages/sdf-server-core/src/db/schema.ts`. Migrations are managed by Drizzle Kit.

## Tables overview

| Table | Purpose |
|-------|---------|
| `tenants` | Multi-tenant root — every other table references this |
| `api_keys` | B2B API access keys (hash-only storage) |
| `users` | Portal user accounts |
| `sessions` | Refresh token records for user sessions |
| `sdf_documents` | Metadata index for stored `.sdf` files |
| `signing_keys` | Per-tenant ECDSA/RSA key pairs (encrypted at rest) |
| `connector_configs` | SAP and Oracle ERP connection configurations |
| `webhooks` | Tenant webhook endpoint registrations |
| `audit_log` | Append-only immutable event log |

## Relationship diagram

```
tenants
  ├── api_keys          (1:N)  — B2B API access keys
  ├── users             (1:N)  — portal accounts
  │     └── sessions   (1:N)  — refresh token records
  ├── sdf_documents     (1:N)  — uploaded .sdf files
  ├── signing_keys      (1:N)  — ECDSA/RSA key pairs
  ├── connector_configs (1:N)  — SAP/Oracle ERP connections
  ├── webhooks          (1:N)  — webhook endpoints
  └── audit_log         (1:N)  — append-only event log
```

Every row in every table (except `tenants` itself) carries a `tenant_id` foreign key. There is no cross-tenant join anywhere in the codebase — data isolation is structural, not just policy.

## Table definitions

### `tenants`

The root of multi-tenancy. Every other resource is scoped to a tenant.

```sql
CREATE TABLE tenants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,       -- URL-safe identifier
  rate_limit_rpm  INT DEFAULT 60,             -- requests/minute
  saml_enabled    BOOL DEFAULT false,
  saml_metadata_url TEXT,
  saml_entity_id  TEXT,
  created_at      TIMESTAMP DEFAULT now()
);
```

### `api_keys`

Stores hashed API keys for machine-to-machine authentication. The raw key is never written to the database.

```sql
CREATE TABLE api_keys (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  key_hash    TEXT NOT NULL,         -- SHA-256 + salt
  key_prefix  VARCHAR(8) NOT NULL,   -- first 8 chars for UI display
  name        TEXT,
  expires_at  TIMESTAMP,             -- NULL = no expiry
  revoked_at  TIMESTAMP,             -- NULL = active
  created_at  TIMESTAMP DEFAULT now()
);
```

### `users`

Portal user accounts. `password_hash` is `NULL` for SAML-only users.

```sql
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT,              -- Argon2id. NULL for SAML users.
  role            TEXT NOT NULL DEFAULT 'member',  -- 'owner' | 'admin' | 'member'
  email_verified  BOOL DEFAULT false,
  totp_enabled    BOOL DEFAULT false,
  totp_secret     TEXT,              -- AES-256-GCM encrypted TOTP secret
  created_at      TIMESTAMP DEFAULT now(),
  updated_at      TIMESTAMP DEFAULT now()
);
```

### `sessions`

Refresh token records. The raw token lives only on the client; only its SHA-256 hash is stored.

```sql
CREATE TABLE sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash  TEXT NOT NULL,
  expires_at          TIMESTAMP NOT NULL,
  revoked_at          TIMESTAMP,    -- NULL = active
  ip_address          TEXT,
  user_agent          TEXT,
  created_at          TIMESTAMP DEFAULT now()
);
```

On every token refresh, the current session is revoked and a new session record is created (token rotation). If a revoked token is presented, all sessions for that user are revoked immediately (theft detection).

### `sdf_documents`

Metadata index for every `.sdf` file stored in S3/MinIO. The binary is not stored in the database.

```sql
CREATE TABLE sdf_documents (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  document_id         TEXT NOT NULL,           -- UUID from meta.json
  storage_key         TEXT NOT NULL,           -- S3 object key
  document_type       TEXT,
  schema_id           TEXT,                    -- "invoice/v0.2"
  sdf_version         TEXT DEFAULT '0.1',
  is_signed           BOOL DEFAULT false,
  signature_algorithm TEXT,                    -- 'ECDSA-P256' | 'RSA-2048'
  file_size_bytes     INT,
  status              TEXT DEFAULT 'pending',  -- pending | valid | invalid | signed
  created_at          TIMESTAMP DEFAULT now(),
  updated_at          TIMESTAMP DEFAULT now()
);
```

### `signing_keys`

Per-tenant ECDSA P-256 and RSA-2048 key pairs. Private keys are encrypted with AES-256-GCM using the `KEY_ENCRYPTION_SECRET` environment variable before being written to the database.

```sql
CREATE TABLE signing_keys (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  algorithm        TEXT NOT NULL,    -- 'ECDSA-P256' | 'RSA-2048'
  public_key       TEXT NOT NULL,    -- PEM format, plaintext
  private_key_enc  TEXT NOT NULL,    -- AES-256-GCM encrypted PEM
  is_active        BOOL DEFAULT true,
  key_id           TEXT,             -- rotation reference identifier
  created_at       TIMESTAMP DEFAULT now()
);
```

### `connector_configs`

ERP connection credentials. The `credentials_enc` field holds AES-256-GCM encrypted JSON containing usernames, passwords, or OAuth2 client secrets.

```sql
CREATE TABLE connector_configs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  erp_type          TEXT NOT NULL,   -- 'SAP' | 'ORACLE'
  name              TEXT,
  base_url          TEXT NOT NULL,
  auth_type         TEXT NOT NULL,   -- 'basic' | 'oauth2' | 'bearer'
  credentials_enc   TEXT NOT NULL,   -- AES-256-GCM encrypted JSON
  is_active         BOOL DEFAULT true,
  last_health_check TIMESTAMP,
  health_status     TEXT,            -- 'healthy' | 'unhealthy' | 'unknown'
  created_at        TIMESTAMP DEFAULT now()
);
```

### `webhooks`

Tenant-registered webhook endpoints. Events are delivered with an HMAC-SHA256 signature computed using the stored secret.

```sql
CREATE TABLE webhooks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  url          TEXT NOT NULL,
  secret_hash  TEXT NOT NULL,  -- SHA-256 hash of the webhook secret
  events       TEXT[],         -- e.g. ['document.uploaded', 'document.signed']
  is_active    BOOL DEFAULT true,
  created_at   TIMESTAMP DEFAULT now()
);
```

### `audit_log`

Immutable append-only event log. Rows are never updated or deleted — this is a legal requirement.

```sql
CREATE TABLE audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  action      TEXT NOT NULL,   -- upload | download | sign | verify | delete | login | ...
  resource_id TEXT,
  actor       TEXT,            -- user_id or 'api_key:sdf_k1a2'
  ip_address  TEXT,
  metadata    JSONB,
  created_at  TIMESTAMP DEFAULT now()
);
```

## Running migrations

```bash
# Apply all pending migrations
bun run db:migrate

# Push schema changes directly (dev only)
bun run db:push

# Generate migration file from schema changes
bun run db:generate
```

Migrations are stored as SQL files in `apps/sdf-server/src/db/migrations/`.

## Why PostgreSQL 17

Four capabilities make PostgreSQL 17 the right choice for this schema:

**JSONB** — `audit_log.metadata` stores action-specific context (file size, error codes, field values) without requiring a rigid schema per action type. JSONB supports GIN indexing, so filtering audit records by metadata fields is fast.

**Drizzle ORM compatibility** — Drizzle ORM is PostgreSQL-first. Its type-safe query builder, `drizzle-kit` migration tooling, and `defaultRandom()` UUID helpers are all designed around PostgreSQL conventions. There is no impedance mismatch.

**Row-Level Security readiness** — all tables are structured with a `tenant_id` column on every row. Adding PostgreSQL RLS policies for an additional layer of database-level tenant isolation requires no schema changes.

**AWS RDS PostgreSQL 17** — the production Terraform configuration (`infra/sdf-cloud/terraform/main.tf`) provisions an RDS PostgreSQL 17 instance. The schema is tested against this exact engine version in CI.
