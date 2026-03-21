---
title: "@etapsky/cloud-sdk"
description: "TypeScript client for the Etapsky SaaS API at api.etapsky.com."
sidebar:
  label: "Overview"
  order: 1
---

`@etapsky/cloud-sdk` is the official TypeScript client for the [Etapsky SaaS API](https://api.etapsky.com). It lets you upload, download, sign, verify, and manage SDF documents from any Node.js or browser environment.

## Installation

```bash
npm install @etapsky/cloud-sdk
# or
bun add @etapsky/cloud-sdk
```

## Quick start

```typescript
import { SDFCloudClient } from '@etapsky/cloud-sdk';

const client = new SDFCloudClient({
  apiKey: process.env.ETAPSKY_API_KEY,
});

// Upload an SDF document
const { documentId } = await client.upload(sdfBuffer, { type: 'invoice' });

// Download it back
const buffer = await client.download(documentId);

// Sign it (asynchronous — returns a job ID)
const { jobId } = await client.sign(documentId);
const result = await client.waitForJob(jobId);

// Verify the signature
const { valid } = await client.verify(documentId);
```

## What the SDK covers

| Method | Description |
|--------|-------------|
| `upload()` | Upload a `.sdf` buffer and trigger validation |
| `download()` | Download a document by ID |
| `sign()` | Request asynchronous signing |
| `verify()` | Verify a document's digital signature |
| `waitForJob()` | Poll until an async job completes |

## Base URL

The SDK defaults to `https://api.etapsky.com`. You can override this for self-hosted deployments:

```typescript
const client = new SDFCloudClient({
  apiKey: process.env.ETAPSKY_API_KEY,
  baseUrl: 'https://sdf.internal.example.com',
});
```

## Authentication

All requests are authenticated with an API key issued from [portal.etapsky.com](https://portal.etapsky.com). See [Authentication](/sdf/cloud-sdk/authentication) for details.

## Next steps

- [Authentication](/sdf/cloud-sdk/authentication) — how API keys work and how to keep them secure
- [SDK Reference](/sdf/cloud-sdk/reference) — complete method signatures and return types
