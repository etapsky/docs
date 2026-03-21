---
title: "Signer — signSDF() / verifySIG()"
description: "Digital signing support for SDF files. ECDSA P-256 and RSA-2048 via Web Crypto API."
sidebar:
  label: "Signer"
  order: 5
---

The signer module provides digital signing and verification for `.sdf` files. Signatures use the Web Crypto API — the same cryptographic substrate available in Node.js, browsers, Bun, and Electron — with no native bindings or OpenSSL dependency.

:::caution[Phase 4 feature]
Digital signing is a Phase 4 capability. It is not required for basic SDF document production and consumption (Phases 1–3). You can produce, read, and validate `.sdf` files without implementing signing. Add signing when your use case requires document authenticity guarantees.
:::

## Import

```typescript
import { generateSDFKeyPair, signSDF, verifySIG } from '@etapsky/sdf-kit/signer';
```

## `generateSDFKeyPair(algorithm)`

```typescript
function generateSDFKeyPair(algorithm: 'ECDSA-P256' | 'RSA-2048'): Promise<SDFKeyPair>
```

Generates a new cryptographic key pair for SDF document signing. Keys are returned as PEM-encoded strings and are not persisted — store them securely in your secrets management system.

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `algorithm` | `'ECDSA-P256' \| 'RSA-2048'` | Signing algorithm. ECDSA P-256 is preferred: shorter signatures, faster operations, equivalent security. |

### Return value

```typescript
interface SDFKeyPair {
  privateKey: string;  // PEM-encoded private key (PKCS#8)
  publicKey:  string;  // PEM-encoded public key (SubjectPublicKeyInfo)
}
```

### Algorithm comparison

| Algorithm | Signature size | Key size | Recommended for |
|-----------|---------------|----------|-----------------|
| `ECDSA-P256` | ~72 bytes | 256-bit | New deployments, performance-sensitive systems |
| `RSA-2048` | 256 bytes | 2048-bit | Legacy system compatibility requirements |

### Example

```typescript title="keygen.ts"
import { generateSDFKeyPair } from '@etapsky/sdf-kit/signer';
import { writeFile } from 'node:fs/promises';

const { privateKey, publicKey } = await generateSDFKeyPair('ECDSA-P256');

// Write to disk for development use
// In production, store in a secrets manager — never commit private keys
await writeFile('keys/private.pem', privateKey, { mode: 0o600 });
await writeFile('keys/public.pem',  publicKey);

console.log('Key pair generated.');
console.log(publicKey);
```

## `signSDF(buffer, privateKey)`

```typescript
function signSDF(buffer: Buffer | Uint8Array, privateKey: string): Promise<Buffer>
```

Signs an `.sdf` file and returns a new buffer containing the original archive plus a `signature.sig` entry. The original file is not modified.

The signature covers the canonical representation of `meta.json` and `data.json`. Changes to either file after signing will invalidate the signature.

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `buffer` | `Buffer \| Uint8Array` | Raw bytes of a valid `.sdf` file |
| `privateKey` | `string` | PEM-encoded private key (PKCS#8), as produced by `generateSDFKeyPair()` |

### Return value

`Promise<Buffer>` — a new `.sdf` buffer with `signature.sig` added to the archive.

### Throws

| Error code | Cause |
|------------|-------|
| `SDF_ERROR_NOT_ZIP` | The buffer is not a valid `.sdf` archive |
| `SDF_ERROR_MISSING_FILE` | The archive is missing required entries |
| `SDF_ERROR_INVALID_META` | `meta.json` is malformed |

## `verifySIG(buffer, publicKey)`

```typescript
function verifySIG(buffer: Buffer | Uint8Array, publicKey: string): Promise<boolean>
```

Verifies the digital signature of a signed `.sdf` file. Returns `true` if the signature is valid and the document has not been tampered with; `false` otherwise.

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `buffer` | `Buffer \| Uint8Array` | Raw bytes of a signed `.sdf` file |
| `publicKey` | `string` | PEM-encoded public key (SubjectPublicKeyInfo) corresponding to the private key used for signing |

### Return value

`Promise<boolean>` — `true` if the signature is valid, `false` if invalid or absent.

### Throws

| Error code | Cause |
|------------|-------|
| `SDF_ERROR_NOT_ZIP` | The buffer is not a valid `.sdf` archive |
| `SDF_ERROR_INVALID_SIGNATURE` | The `signature.sig` entry is present but structurally malformed (distinct from a valid-but-wrong signature, which returns `false`) |

## Complete sign and verify example

```typescript title="sign-and-verify.ts"
import { buildSDF } from '@etapsky/sdf-kit/producer';
import { generateSDFKeyPair, signSDF, verifySIG } from '@etapsky/sdf-kit/signer';
import { SDFError } from '@etapsky/sdf-kit';
import { writeFile, readFile } from 'node:fs/promises';

// 1. Generate key pair (do this once; store securely)
const { privateKey, publicKey } = await generateSDFKeyPair('ECDSA-P256');

// 2. Produce the SDF file
const buffer = await buildSDF({
  data,
  schema,
  issuer:       'Acme Supplies GmbH',
  documentType: 'invoice',
});

// 3. Sign it
const signedBuffer = await signSDF(buffer, privateKey);

// 4. Write the signed file
await writeFile('invoice-signed.sdf', signedBuffer);

// 5. Later: verify the signature before processing
const fileBuffer = await readFile('invoice-signed.sdf');
const isValid = await verifySIG(fileBuffer, publicKey);

if (isValid) {
  console.log('Signature is valid. Document is authentic and untampered.');
} else {
  console.error('Signature verification failed. Document may have been modified.');
  process.exit(1);
}
```

## Key storage recommendations

Private keys grant the ability to sign documents on behalf of the issuer. Store them with the same care as database credentials or API secrets.

**Development:**
```typescript title=".env"
SDF_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIGHAgEA..."
SDF_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\nMFkwEwYHKo..."
```

```typescript title="signer-service.ts"
import { signSDF } from '@etapsky/sdf-kit/signer';

const privateKey = process.env.SDF_PRIVATE_KEY;
if (!privateKey) throw new Error('SDF_PRIVATE_KEY is not set');

const signedBuffer = await signSDF(buffer, privateKey);
```

**Production:**

- Store private keys in AWS Secrets Manager, HashiCorp Vault, or an equivalent secrets management system.
- Grant read access only to the process that performs signing.
- Rotate keys periodically. The `signing_keys` table in `sdf-server-core` tracks key rotation via the `key_id` and `is_active` fields.
- Never commit private keys to version control.
- The `private_key_enc` field in the database stores keys encrypted with AES-256-GCM. The encryption key is the `KEY_ENCRYPTION_SECRET` environment variable — never stored in the database.

**Distributing the public key:**

Public keys can be shared freely. Common distribution mechanisms:

- Include in API responses (e.g. `GET /admin/tenants/:id/public-key`)
- Publish to a well-known URL for automated consumer verification
- Include in the `meta.json` `issuer_id` field for cross-reference
