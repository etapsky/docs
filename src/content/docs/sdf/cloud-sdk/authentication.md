---
title: "Authentication"
description: "Authenticate with the Etapsky Cloud API using API keys."
sidebar:
  label: "Authentication"
  order: 2
---

The Etapsky Cloud API uses **API keys** for authentication. Every request must include a valid key; requests without one are rejected with HTTP `401`.

## API key format

All Etapsky API keys begin with the `sdf_k` prefix followed by a cryptographically random suffix:

```
sdf_k1a2b3c4d5e6f7a8b9c0...
```

The first 8 characters after `sdf_k` form the **key prefix** (e.g., `sdf_k1a2`), which is visible in the portal for identification purposes. The full raw key is only shown **once** at creation time — it cannot be retrieved again.

## Getting an API key

1. Sign in to [portal.etapsky.com](https://portal.etapsky.com).
2. Navigate to **Settings → API Keys**.
3. Click **Create Key**, give it a descriptive name (e.g., `production-erp`), and optionally set an expiry date.
4. Copy the key immediately — it will not be shown again.

Keys can be revoked at any time from the same screen.

## Storing the key securely

Never hard-code an API key in source code or commit it to version control. Store it as an environment variable:

```bash title=".env"
ETAPSKY_API_KEY=sdf_k1a2b3c4d5e6f7a8b9c0...
```

Load it in your application using a tool like `dotenv` or your platform's secret manager (AWS Secrets Manager, HashiCorp Vault, etc.).

## Passing the key to the SDK

Pass the key through the `SDFCloudClient` constructor:

```typescript
import { SDFCloudClient } from '@etapsky/cloud-sdk';

const client = new SDFCloudClient({
  apiKey: process.env.ETAPSKY_API_KEY,
});
```

The SDK attaches the key to every outgoing request as an `X-API-Key` header. You do not need to manage headers manually.

## Key rotation

Rotate keys periodically or immediately after a suspected leak:

1. Create a new key in the portal.
2. Update the `ETAPSKY_API_KEY` environment variable in all environments.
3. Revoke the old key.

Because revocation takes effect immediately, any in-flight requests using the old key will fail with HTTP `401` after it is revoked. Plan rotations during low-traffic windows.

## Key expiry

Keys can be created with an optional expiry timestamp. Expired keys are rejected with HTTP `401` and the error code `API_KEY_EXPIRED`. Set expiry dates that align with your security policy — 90-day rotation is a common baseline for production systems.

## Rate limits

Each key inherits the rate limit of the tenant it belongs to. The default is **60 requests per minute**. Exceeding the limit returns HTTP `429`. The `Retry-After` header indicates when the next request is accepted.
