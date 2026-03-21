---
title: "Object Storage"
description: "SDF Server stores .sdf files in S3-compatible object storage using native AWS SigV4. Works with AWS S3 and MinIO."
sidebar:
  label: "Storage"
  order: 5
---

SDF Server uses S3-compatible object storage to persist `.sdf` files. The storage adapter is implemented in `packages/sdf-server-core/src/storage/s3.ts` using native `fetch()` and AWS Signature Version 4. No AWS SDK is used.

## Object key format

Every `.sdf` file is stored under a deterministic key:

```
{tenant_id}/{year}/{month}/{document_id}.sdf
```

**Example:**

```
c1d2e3f4-a5b6-7c8d-9e0f-a1b2c3d4e5f6/2026/03/a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6.sdf
```

This layout naturally partitions objects by tenant and provides time-based locality for lifecycle policies.

## Why no AWS SDK

The S3 adapter uses native `fetch()` with a hand-rolled AWS Signature V4 implementation. This keeps the package dependency-free with respect to AWS — no `@aws-sdk/client-s3` is added to the lockfile. The adapter works identically against AWS S3, MinIO, Cloudflare R2, and any other S3-compatible storage backend.

## AWS S3 setup

**1. Create a bucket**

```bash
aws s3api create-bucket \
  --bucket sdf-documents-production \
  --region eu-central-1 \
  --create-bucket-configuration LocationConstraint=eu-central-1
```

**2. Block public access**

```bash
aws s3api put-public-access-block \
  --bucket sdf-documents-production \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,\
    BlockPublicPolicy=true,RestrictPublicBuckets=true
```

**3. Configure lifecycle (optional but recommended)**

```json title="lifecycle.json"
{
  "Rules": [
    {
      "ID": "archive-old-documents",
      "Status": "Enabled",
      "Filter": { "Prefix": "" },
      "Transitions": [
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        }
      ]
    }
  ]
}
```

```bash
aws s3api put-bucket-lifecycle-configuration \
  --bucket sdf-documents-production \
  --lifecycle-configuration file://lifecycle.json
```

**4. Set environment variables**

```bash
S3_ENDPOINT=https://s3.eu-central-1.amazonaws.com
S3_BUCKET=sdf-documents-production
S3_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
S3_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

## MinIO (local development)

MinIO provides an S3-compatible API and is the recommended backend for local development and testing.

The included `docker-compose.yml` starts MinIO automatically:

```yaml title="docker-compose.yml"
minio:
  image: minio/minio
  command: server /data --console-address ":9001"
  environment:
    MINIO_ROOT_USER: minioadmin
    MINIO_ROOT_PASSWORD: minioadmin
  ports:
    - "9000:9000"   # S3 API
    - "9001:9001"   # Admin UI
```

After starting MinIO, create the bucket:

```bash
# Using the MinIO CLI (mc)
mc alias set local http://localhost:9000 minioadmin minioadmin
mc mb local/sdf-documents
```

Or use the web UI at `http://localhost:9001`.

**Environment variables for MinIO:**

```bash
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=sdf-documents
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
```

## Pre-signed URLs

Download endpoints return the `.sdf` binary directly through the server by default. For large-scale deployments where you want the client to download directly from S3, the storage adapter supports generating pre-signed `GET` URLs with a 1-hour TTL:

```typescript title="storage/s3.ts"
const url = await s3.presignGet(storageKey, { expiresIn: 3600 });
// Returns a time-limited signed URL for direct S3 access
```

Pre-signed URL generation is handled inside the storage adapter without any additional dependencies.

## Supported operations

| Operation | Description |
|-----------|-------------|
| `put(key, body)` | Upload a `.sdf` file |
| `get(key)` | Download a `.sdf` file |
| `delete(key)` | Delete a `.sdf` file |
| `exists(key)` | Check if an object exists (HEAD request) |
| `presignGet(key, opts)` | Generate a pre-signed GET URL |

All operations are async and throw a typed `StorageError` on failure.

## Security

- All communication with S3/MinIO must use HTTPS in production. The `S3_ENDPOINT` must begin with `https://` in production environments.
- The server process only requires `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`, and `s3:HeadObject` on the configured bucket. No other S3 permissions are needed.
- Objects are never made publicly accessible. Access is always proxied through the server, enforcing tenant-level authorization before any object is served.
- Pre-signed URLs are scoped to a single object and expire after 1 hour.
