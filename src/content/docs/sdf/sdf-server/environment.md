---
title: "Environment Variables"
description: "Complete environment variable reference for SDF Server."
sidebar:
  label: "Environment"
  order: 7
---

SDF Server validates all environment variables at startup using Zod. The server will not start if any required variable is missing or malformed.

## Required variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `S3_ENDPOINT` | S3 or MinIO endpoint URL |
| `S3_BUCKET` | Object storage bucket name |
| `S3_ACCESS_KEY` | Storage access key ID |
| `S3_SECRET_KEY` | Storage secret access key |
| `JWT_SECRET` | HMAC secret for signing tenant JWTs |
| `ADMIN_JWT_SECRET` | HMAC secret for signing admin JWTs |
| `KEY_ENCRYPTION_SECRET` | AES-256-GCM key for encrypting private keys and ERP credentials at rest |

## Optional variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP port the server listens on |
| `LOG_LEVEL` | `'info'` | Pino log level: `trace`, `debug`, `info`, `warn`, `error`, `fatal` |
| `RATE_LIMIT_DEFAULT` | `60` | Default rate limit in requests per minute, applied to tenants without an explicit limit |

## Variable details

### DATABASE_URL

Standard PostgreSQL connection string.

```
postgresql://user:password@host:5432/database
```

For AWS RDS, use the cluster endpoint in the connection string. SSL is required in production — append `?sslmode=require`.

```
postgresql://sdf:secret@sdf.cluster.eu-central-1.rds.amazonaws.com:5432/sdf?sslmode=require
```

### REDIS_URL

Standard Redis connection string.

```
redis://localhost:6379
redis://:password@host:6379/0
rediss://host:6380  # TLS
```

For AWS ElastiCache, use the primary endpoint and enable TLS (`rediss://`).

### S3_ENDPOINT

The base URL of the S3-compatible API. For AWS S3, use the regional endpoint:

```
https://s3.eu-central-1.amazonaws.com
```

For MinIO in local development:

```
http://localhost:9000
```

For Cloudflare R2:

```
https://<account_id>.r2.cloudflarestorage.com
```

### S3_BUCKET

The name of the bucket where `.sdf` files are stored. The bucket must exist before the server starts — the server does not create it.

### JWT_SECRET

Used to sign and verify JWTs issued to tenant users and machine clients. Must be at least 32 characters. Use a cryptographically random value.

Generate a secure value:

```bash
openssl rand -hex 32
```

### ADMIN_JWT_SECRET

Used exclusively for admin JWTs (`/admin/*` routes). Must be different from `JWT_SECRET` — using the same value for both defeats the purpose of the separation.

```bash
openssl rand -hex 32
```

### KEY_ENCRYPTION_SECRET

A 32-byte (256-bit) base64-encoded key used to encrypt `signing_keys.private_key_enc` and `connector_configs.credentials_enc` with AES-256-GCM before writing them to the database.

```bash
openssl rand -base64 32
```

:::caution
Losing this secret means losing the ability to decrypt stored private keys and ERP credentials. Back it up securely in a secrets manager (AWS Secrets Manager, HashiCorp Vault). Rotation requires re-encrypting all affected rows.
:::

## Example configuration files

### Local development

```bash title=".env"
DATABASE_URL=postgresql://sdf:sdf@localhost:5432/sdf
REDIS_URL=redis://localhost:6379
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=sdf-documents
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
JWT_SECRET=dev-jwt-secret-change-in-production-32c
ADMIN_JWT_SECRET=dev-admin-secret-change-in-production
KEY_ENCRYPTION_SECRET=ZGV2LWtleS1lbmNyeXB0aW9uLXNlY3JldC0zMmM=
PORT=3000
LOG_LEVEL=debug
```

### Production (Docker / ECS)

```bash title=".env.production"
DATABASE_URL=postgresql://sdf:${DB_PASSWORD}@${RDS_ENDPOINT}:5432/sdf?sslmode=require
REDIS_URL=rediss://:${REDIS_TOKEN}@${ELASTICACHE_ENDPOINT}:6380
S3_ENDPOINT=https://s3.eu-central-1.amazonaws.com
S3_BUCKET=sdf-documents-production
S3_ACCESS_KEY=${AWS_ACCESS_KEY_ID}
S3_SECRET_KEY=${AWS_SECRET_ACCESS_KEY}
JWT_SECRET=${JWT_SECRET}
ADMIN_JWT_SECRET=${ADMIN_JWT_SECRET}
KEY_ENCRYPTION_SECRET=${KEY_ENCRYPTION_SECRET}
PORT=3000
LOG_LEVEL=info
```

In ECS/Fargate deployments, inject secrets via AWS Secrets Manager or SSM Parameter Store rather than environment variable literals.

## Docker Compose (full stack)

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
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U sdf"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes: ["minio-data:/data"]

  api:
    image: etapsky/sdf-server:latest
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://sdf:sdf@postgres:5432/sdf
      REDIS_URL: redis://redis:6379
      S3_ENDPOINT: http://minio:9000
      S3_BUCKET: sdf-documents
      S3_ACCESS_KEY: minioadmin
      S3_SECRET_KEY: minioadmin
      JWT_SECRET: change-me-in-production-min-32-chars
      ADMIN_JWT_SECRET: change-admin-secret-in-production-32c
      KEY_ENCRYPTION_SECRET: ZGV2LWtleS1lbmNyeXB0aW9uLXNlY3JldC0zMmM=
      PORT: 3000
      LOG_LEVEL: info
    ports: ["3000:3000"]

volumes:
  pgdata:
  minio-data:
```
