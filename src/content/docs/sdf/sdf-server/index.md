---
title: "SDF Server"
description: "Self-hosted SDF REST server built on Fastify 5, PostgreSQL, Redis, and S3-compatible storage."
sidebar:
  label: "Overview"
  order: 1
---

SDF Server is an open-source REST server for storing, validating, signing, and distributing SDF documents. It is published as `@etapsky/sdf-server-core` on npm and ships as a runnable application under `apps/sdf-server` in the main monorepo.

## Deployment options

| Option | When to use |
|--------|-------------|
| **Self-hosted** (`apps/sdf-server`) | On-premise or private cloud. You control the data, the keys, and the infrastructure. |
| **SaaS** (`api.etapsky.com`) | Managed by Etapsky. No infrastructure to operate. Available at [portal.etapsky.com](https://portal.etapsky.com). |

Both options expose the same core API surface. The SaaS platform adds billing, team management, and the self-service portal on top.

## Architecture

```
                    ┌─────────────────────────────────────────┐
                    │             sdf-server-core              │
                    │                                          │
  HTTP clients ───► │  Fastify 5                              │
  (API keys / JWT)  │    ├── Routes (SDF, sign, schema, admin)│
                    │    ├── Auth middleware (dual)            │
                    │    └── Rate limiting (per-tenant)        │
                    │                                          │
                    │  Workers (BullMQ)                        │
                    │    ├── validate-sdf                      │
                    │    ├── sign-sdf                          │
                    │    └── webhook-delivery                  │
                    └────────────┬────────────────────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                   ▼
       PostgreSQL 17          Redis 7          S3 / MinIO
       (Drizzle ORM)      (BullMQ queues)   (native SigV4)
```

Incoming requests are authenticated, rate-limited per tenant, and routed to the appropriate handler. Heavy operations — validation, signing, webhook delivery — are executed asynchronously via BullMQ workers, keeping HTTP response times low.

## Quick start (local development)

**Prerequisites:** Docker, Bun 1.3.11+

**1. Clone and install**

```bash
git clone https://github.com/etapsky/sdf
cd sdf
bun install
```

**2. Start dependencies**

```yaml title="docker-compose.yml"
services:
  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_DB: sdf
      POSTGRES_USER: sdf
      POSTGRES_PASSWORD: sdf
    ports: ["5432:5432"]
    volumes: ["pgdata:/var/lib/postgresql/data"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"

volumes:
  pgdata:
```

```bash
docker compose up -d
```

**3. Configure environment**

```bash title=".env"
DATABASE_URL=postgresql://sdf:sdf@localhost:5432/sdf
REDIS_URL=redis://localhost:6379
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=sdf-documents
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
JWT_SECRET=change-me-in-production-min-32-chars
ADMIN_JWT_SECRET=change-admin-secret-in-production
KEY_ENCRYPTION_SECRET=change-key-encryption-secret-32c
```

**4. Run migrations and start**

```bash
cd apps/sdf-server
bun run db:migrate
bun run dev
```

The server is now running at `http://localhost:3000`.

```bash
curl http://localhost:3000/health
# {"status":"ok","version":"0.1.2"}
```

**5. Create your first tenant and API key**

```bash
# Create a tenant
curl -X POST http://localhost:3000/admin/tenants \
  -H "Authorization: Bearer <admin_jwt>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Acme Corp", "slug": "acme"}'

# Generate an API key for the tenant
curl -X POST http://localhost:3000/admin/tenants/<tenant_id>/keys \
  -H "Authorization: Bearer <admin_jwt>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Production key"}'
# Response includes the raw API key — store it, it is shown only once.
```

## Key capabilities

- **Multi-tenant isolation** — every document, key, and audit record is scoped to a tenant. Cross-tenant data access is structurally impossible.
- **Dual auth** — API keys (`X-API-Key`) for machine-to-machine and JWT (`Authorization: Bearer`) for user sessions. Both resolve to the same tenant context.
- **SAML 2.0 SSO** — per-tenant IdP configuration for enterprise SSO via the `/saml/*` endpoints.
- **Async validation and signing** — upload returns immediately; BullMQ workers process documents in the background.
- **ERP connectors** — SAP S/4HANA and Oracle Fusion Cloud connectors for matching and pushing SDF documents directly into ERP systems.
- **Webhook delivery** — HMAC-SHA256 signed payloads delivered to tenant-configured endpoints on every document event.
- **Append-only audit log** — every action is recorded and cannot be modified or deleted.

## Next steps

- [Endpoints](/sdf/sdf-server/endpoints) — complete REST API reference
- [Authentication](/sdf/sdf-server/authentication) — API keys, JWT, and admin auth
- [Queue](/sdf/sdf-server/queue) — async job processing with BullMQ
- [Storage](/sdf/sdf-server/storage) — S3-compatible object storage
- [Database](/sdf/sdf-server/database) — PostgreSQL schema and relationships
- [Environment](/sdf/sdf-server/environment) — all environment variables
