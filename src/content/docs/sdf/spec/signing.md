---
title: "Digital Signing"
description: "SDF supports optional digital signatures via signature.sig using ECDSA P-256 or RSA-2048. Phase 4 feature."
sidebar:
  label: "Signing"
  order: 7
---

# Digital Signing

SDF supports optional digital signatures via the `signature.sig` file. A signed SDF document provides cryptographic assurance that the four required layers (`visual.pdf`, `data.json`, `schema.json`, `meta.json`) have not been modified since signing.

**Status:** Phase 4 feature. Signing is not required in v0.1 Phase 1–3 documents.

:::caution
Phase 1–3 SDF files MUST NOT include a `signature.sig` entry. Consumers that encounter `signature.sig` in a Phase 1–3 context SHOULD log a warning. Phase 4 consumers SHOULD verify any `signature.sig` that is present.
:::

---

## Algorithms

Two signing algorithms are supported in SDF v0.1:

| Algorithm | Identifier | Recommendation |
|-----------|-----------|----------------|
| ECDSA P-256 | `ECDSA-P256` | Recommended — compact signatures, strong security |
| RSA-2048 | `RSA-2048` | Supported — for compatibility with legacy PKI infrastructure |

Producers SHOULD use ECDSA P-256 for new implementations. RSA-2048 is provided for compatibility with existing enterprise PKI and HSM setups that may not support elliptic curve algorithms.

---

## What Is Signed

The digital signature covers the canonical content of the four required archive entries:

1. `meta.json` — raw UTF-8 bytes
2. `data.json` — raw UTF-8 bytes
3. `schema.json` — raw UTF-8 bytes
4. `visual.pdf` — raw bytes

The signing input is the SHA-256 hash of each file's raw bytes, concatenated in the fixed order above, then signed as a single input. This order is deterministic and MUST NOT vary between implementations.

```
signing_input = SHA256(meta.json) || SHA256(data.json) || SHA256(schema.json) || SHA256(visual.pdf)
signature     = Sign(private_key, signing_input)
```

The `signature.sig` file is not included in its own signature computation. `vendor/*` entries are not included.

---

## signature.sig Structure

`signature.sig` is a JSON file containing the signature value and metadata required for verification:

```json title="signature.sig"
{
  "algorithm": "ECDSA-P256",
  "key_id": "key-2026-03-01",
  "signer": "Acme Supplies GmbH",
  "signed_at": "2026-03-15T14:35:00+01:00",
  "signature": "base64url-encoded-signature-bytes",
  "public_key": "base64url-encoded-DER-public-key"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `algorithm` | MUST | `"ECDSA-P256"` or `"RSA-2048"` |
| `key_id` | SHOULD | Identifier for key rotation tracking |
| `signer` | SHOULD | Human-readable signer name |
| `signed_at` | MUST | ISO 8601 timestamp of signing |
| `signature` | MUST | Base64url-encoded raw signature bytes |
| `public_key` | MUST | Base64url-encoded DER-encoded public key |

---

## Key Generation

Use the `sdf-kit` `generateKeyPair()` function or the `sdf-cli keygen` command to generate signing key pairs.

```typescript title="Key generation with sdf-kit"
import { generateKeyPair } from '@etapsky/sdf-kit/signer';

// Generate ECDSA P-256 key pair
const keyPair = await generateKeyPair('ECDSA-P256');

console.log(keyPair.publicKeyPem);   // PEM-encoded public key
console.log(keyPair.privateKeyPem);  // PEM-encoded private key — store securely

// Generate RSA-2048 key pair
const rsaKeyPair = await generateKeyPair('RSA-2048');
```

```bash title="Key generation with sdf-cli"
sdf keygen --algorithm ECDSA-P256 --output ./keys/signing-key
# Writes: signing-key.pub.pem, signing-key.priv.pem
```

Private keys MUST be stored securely. When used with the SDF server, private keys are stored encrypted (AES-256-GCM) in the `signing_keys` table. Plaintext private keys MUST NOT be stored in a database or version control system.

---

## Signing Flow

```typescript title="Signing an SDF file with sdf-kit"
import { sign } from '@etapsky/sdf-kit/signer';
import { readFileSync, writeFileSync } from 'fs';

const sdfBuffer = readFileSync('./invoice.sdf');
const privateKeyPem = readFileSync('./keys/signing-key.priv.pem', 'utf8');

const signedSdfBuffer = await sign(sdfBuffer, {
  privateKeyPem,
  algorithm: 'ECDSA-P256',
  keyId: 'key-2026-03-01',
  signer: 'Acme Supplies GmbH',
});

writeFileSync('./invoice-signed.sdf', signedSdfBuffer);
```

The `sign()` function:
1. Reads `meta.json`, `data.json`, `schema.json`, and `visual.pdf` from the archive.
2. Computes SHA-256 of each file's raw bytes.
3. Concatenates the hashes in the fixed order.
4. Signs the concatenated hash with the private key using the Web Crypto API.
5. Writes `signature.sig` into the archive.
6. Returns the updated archive buffer.

---

## Verification Flow

```typescript title="Verifying an SDF signature with sdf-kit"
import { verify } from '@etapsky/sdf-kit/signer';
import { readFileSync } from 'fs';

const sdfBuffer = readFileSync('./invoice-signed.sdf');

const result = await verify(sdfBuffer);

if (result.valid) {
  console.log('Signature is valid.');
  console.log('Signed by:', result.signer);
  console.log('Signed at:', result.signedAt);
} else {
  console.error('Signature verification failed:', result.error);
  // result.error will be 'SDF_ERROR_INVALID_SIGNATURE'
}
```

```bash title="Verification with sdf-cli"
sdf verify ./invoice-signed.sdf
# Output:
#   Signature: VALID
#   Algorithm: ECDSA-P256
#   Signed by: Acme Supplies GmbH
#   Signed at: 2026-03-15T14:35:00+01:00
#   Key ID:    key-2026-03-01
```

---

## Web Crypto API

SDF signing and verification is implemented using the [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) (`crypto.subtle`). This API is available natively in Node.js 18+, browsers, and Bun. No external cryptography library is required for the reference implementation.

```typescript title="Low-level signing with Web Crypto API (reference)"
// Import private key from PEM
const privateKey = await crypto.subtle.importKey(
  'pkcs8',
  pemToDer(privateKeyPem),
  { name: 'ECDSA', namedCurve: 'P-256' },
  false,
  ['sign']
);

// Compute signing input
const signingInput = new Uint8Array([
  ...await sha256(metaBytes),
  ...await sha256(dataBytes),
  ...await sha256(schemaBytes),
  ...await sha256(pdfBytes),
]);

// Sign
const signatureBytes = await crypto.subtle.sign(
  { name: 'ECDSA', hash: 'SHA-256' },
  privateKey,
  signingInput
);
```

---

## Key Rotation

When a signing key is rotated, the `key_id` field in `signature.sig` identifies which key was used. The SDF server stores all signing keys in the `signing_keys` table, allowing historical verification of documents signed with previous keys.

Producers SHOULD rotate signing keys at least annually. Revoked keys MUST be retained for historical verification purposes. Old keys MUST NOT be deleted; set `is_active = false` in the `signing_keys` table.
