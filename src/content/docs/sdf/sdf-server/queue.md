---
title: "Queue — Async Processing"
description: "SDF Server uses BullMQ with Redis for asynchronous job processing — validation, signing, and webhook delivery."
sidebar:
  label: "Queue"
  order: 4
---

SDF Server offloads all heavy processing to a BullMQ queue backed by Redis. HTTP endpoints return immediately with a `job_id`; workers pick up the job and process it in the background.

## Workers

Three workers run as part of the server process:

| Worker | Queue name | Triggered by |
|--------|------------|-------------|
| `validate-sdf` | `validate-sdf` | `POST /sdf` (upload) |
| `sign-sdf` | `sign-sdf` | `POST /sign/:id` |
| `webhook-delivery` | `webhook-delivery` | Job completion |

### validate-sdf

Runs the full SDF validation pipeline on a document after upload:

1. Retrieves the `.sdf` file from S3/MinIO
2. Unpacks the ZIP archive (with ZIP bomb and path traversal protection)
3. Validates `meta.json` against the meta schema
4. Validates `data.json` against the embedded `schema.json`
5. Checks `sdf_version` compatibility
6. If a `signature.sig` is present, verifies the signature
7. Updates `sdf_documents.status` to `valid` or `invalid`
8. Enqueues a `webhook-delivery` job with the result

### sign-sdf

Signs a stored SDF document using the tenant's active signing key:

1. Retrieves the `.sdf` file from S3/MinIO
2. Loads and decrypts the tenant's `signing_key.private_key_enc` (AES-256-GCM)
3. Signs the document using the configured algorithm (`ECDSA-P256` or `RSA-2048`)
4. Packs the `signature.sig` into the archive
5. Uploads the signed `.sdf` back to S3/MinIO (same storage key, atomic overwrite)
6. Updates `sdf_documents.is_signed = true`, `status = 'signed'`
7. Enqueues a `webhook-delivery` job

### webhook-delivery

Delivers event notifications to tenant-configured webhook endpoints:

1. Loads all active webhook configs for the tenant
2. Filters by the event type (e.g. `document.uploaded`, `document.signed`, `document.validated`)
3. Constructs the event payload
4. Computes an HMAC-SHA256 signature over the payload using the webhook's stored secret
5. Sends a `POST` request to the webhook URL with the `X-SDF-Signature` header
6. On `2xx` — marks delivery as succeeded
7. On non-`2xx` or network error — retries with exponential backoff

## Job priority

Jobs are processed in this priority order (highest first):

```
sign > validate > webhook
```

Signing is highest priority because it is typically user-initiated and latency-sensitive. Validation runs next. Webhook delivery is lowest priority since it is a side effect of the other two.

## Retry configuration

```typescript
{
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,  // 2 s, 4 s, 8 s
  },
}
```

After three failed attempts, the job moves to the **dead letter queue** (`{queue-name}:failed`). Failed jobs are retained for inspection and can be manually retried from the BullMQ dashboard or via the Redis CLI.

## Job IDs in HTTP responses

When an endpoint enqueues a job, the response includes a `job_id`:

```json
{
  "id": "3f8a1c2d-...",
  "status": "pending",
  "job_id": "validate-sdf:7f9e3a1b"
}
```

The `job_id` format is `{queue-name}:{bullmq-job-id}`. You can use this to look up the job status directly in Redis if needed.

## Idempotency

All workers are designed to be idempotent. If the same job is executed twice (e.g. due to a crash during processing), it will produce the same result without corrupting state. In practice:

- Uploading a signed SDF to S3 with the same key overwrites the previous object atomically
- Database `status` updates use the final determined state, not an increment
- Webhook delivery deduplication is handled at the BullMQ job-ID level

## Monitoring Redis

Use the BullMQ Board dashboard or the Redis CLI to inspect queues:

```bash
# Connect to Redis
redis-cli -u $REDIS_URL

# List pending jobs in the validate-sdf queue
LRANGE bull:validate-sdf:wait 0 -1

# Count active jobs
LLEN bull:sign-sdf:active

# Inspect a specific job
HGETALL bull:validate-sdf:7f9e3a1b
```

For production, connect [Bull Board](https://github.com/felixmosh/bull-board) or [Arena](https://github.com/bee-queue/arena) to your Redis instance for a web UI.

## Local development with Redis

The included `docker-compose.yml` starts a Redis 7 instance on port 6379. No additional configuration is needed — set `REDIS_URL=redis://localhost:6379` in your `.env` file and the workers will connect automatically on server start.

## Webhook event types

The following event types are delivered by the `webhook-delivery` worker:

| Event | Triggered when |
|-------|---------------|
| `document.uploaded` | Upload completes (before validation) |
| `document.validated` | `validate-sdf` worker finishes |
| `document.signed` | `sign-sdf` worker finishes |
| `document.deleted` | `DELETE /sdf/:id` completes |

Tenants configure which events they subscribe to in the webhook configuration (`webhooks.events` column). Unsubscribed events are not delivered.

## Webhook payload format

```json
{
  "event": "document.validated",
  "tenant_id": "c1d2e3f4-...",
  "document_id": "3f8a1c2d-...",
  "timestamp": "2026-03-15T14:35:22.000Z",
  "data": {
    "status": "valid",
    "document_type": "invoice",
    "schema_id": "invoice/v0.2"
  }
}
```

The `X-SDF-Signature` header contains `sha256=<hex>` computed with HMAC-SHA256 over the raw request body using the webhook secret.
