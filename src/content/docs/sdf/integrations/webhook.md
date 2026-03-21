---
title: "Webhooks"
description: "Configure webhook endpoints to receive SDF events. HMAC-SHA256 signed payloads."
sidebar:
  label: "Webhooks"
  order: 4
---

SDF Server can send real-time HTTP notifications to your systems when SDF document events occur. Each payload is signed with HMAC-SHA256 so you can verify it originated from your SDF Server instance.

## Events

| Event | Trigger |
|-------|---------|
| `document.uploaded` | A `.sdf` file was successfully uploaded |
| `document.validated` | Asynchronous validation completed (success or failure) |
| `document.signed` | Asynchronous signing completed |
| `document.deleted` | A document was deleted |

## Registering a webhook

```http
POST /admin/tenants/:tenantId/webhooks
Authorization: Bearer <admin_jwt>

{
  "url": "https://your-system.example.com/sdf-events",
  "secret": "a-random-secret-you-choose",
  "events": ["document.uploaded", "document.signed"]
}
```

The `secret` is hashed with SHA-256 before storage. Keep the raw value — you will need it to verify signatures.

## Payload format

Every webhook request is an HTTP `POST` with a JSON body:

```json title="document.signed payload"
{
  "event": "document.signed",
  "timestamp": "2026-03-15T14:32:10.000Z",
  "tenant_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "data": {
    "document_id": "9b2a3f1c-1234-4abc-bcde-000000000001",
    "document_type": "invoice",
    "status": "signed",
    "algorithm": "ECDSA-P256"
  }
}
```

## Verifying the HMAC-SHA256 signature

Every request includes an `X-SDF-Signature` header containing an HMAC-SHA256 hex digest:

```
X-SDF-Signature: sha256=3b4e8f9a2c1d...
```

**Verification algorithm:** compute `HMAC-SHA256(secret, raw_body)` and compare it to the value in the header. Always compare using a timing-safe function.

### Node.js example

```typescript title="src/webhooks/receiver.ts"
import crypto from 'crypto';

function verifySdfWebhook(
  rawBody: Buffer,
  signatureHeader: string,
  secret: string
): boolean {
  const expected = 'sha256=' +
    crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signatureHeader),
    Buffer.from(expected)
  );
}

// Express / Fastify handler
app.post('/sdf-events', (req, res) => {
  const rawBody = req.rawBody;  // must be raw Buffer, not parsed JSON
  const signature = req.headers['x-sdf-signature'] as string;

  if (!verifySdfWebhook(rawBody, signature, process.env.WEBHOOK_SECRET!)) {
    return res.status(401).send('Invalid signature');
  }

  const event = JSON.parse(rawBody.toString());
  console.log('Received:', event.event, event.data.document_id);

  res.status(200).send('ok');
});
```

> **Important:** Verify the signature against the **raw request body bytes**, before any JSON parsing. Parsing and re-serializing can change whitespace or key order, causing valid signatures to fail.

### Python example

```python title="webhook_receiver.py"
import hashlib
import hmac

def verify_sdf_webhook(raw_body: bytes, signature_header: str, secret: str) -> bool:
    expected = 'sha256=' + hmac.new(
        secret.encode(),
        raw_body,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(signature_header, expected)
```

## Retry behavior

If your endpoint does not return HTTP `2xx` within 10 seconds, SDF Server retries the delivery:

| Attempt | Delay |
|---------|-------|
| 1st retry | 2 seconds |
| 2nd retry | 4 seconds |
| 3rd retry | 8 seconds |

After 3 failed attempts the event is moved to a dead-letter queue. Failed deliveries appear in the audit log with action `webhook.delivery_failed`.

## Best practices

- Respond with `200 OK` immediately, then process the event asynchronously.
- Always verify the HMAC signature before acting on a payload.
- Make your handler idempotent — retries can deliver the same event more than once.
- Use `document_id` as an idempotency key.
