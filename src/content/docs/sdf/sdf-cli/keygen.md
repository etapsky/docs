---
title: "sdf keygen"
description: "Generate an ECDSA P-256 or RSA-2048 key pair for SDF document signing."
sidebar:
  label: "keygen"
  order: 6
---

`sdf keygen` generates a cryptographic key pair for digitally signing SDF documents. Keys are written as PEM-encoded files to the specified output directory.

## Usage

```bash title="Terminal"
sdf keygen [flags]
```

## Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--algorithm <alg>` | Key algorithm: `ECDSA-P256` or `RSA-2048` | `ECDSA-P256` |
| `--out <dir>` | Directory to write key files into | Current directory (`.`) |
| `--no-color` | Disable ANSI color output | — |
| `--help` | Print help and exit | — |

## Algorithms

| Algorithm | Flag value | Private key size | Signature size | Recommended |
|-----------|------------|-----------------|---------------|-------------|
| ECDSA P-256 | `ECDSA-P256` | ~240 bytes PEM | ~72 bytes | Yes — new deployments |
| RSA-2048 | `RSA-2048` | ~1700 bytes PEM | 256 bytes | When RSA interoperability is required |

ECDSA P-256 is the preferred algorithm. It provides equivalent security to RSA-2048 with significantly smaller key and signature sizes, and faster signing and verification operations.

## Example

```bash title="Terminal"
# ECDSA P-256 (default)
sdf keygen --algorithm ECDSA-P256 --out keys/
```

```
  SDF — Smart Document Format  @etapsky/sdf-cli 0.3.0
────────────────────────────────────────────────────────────
  keygen
────────────────────────────────────────────────────────────

  Algorithm  ECDSA-P256

  ✓ keys/private.pem  (mode 0600)
  ✓ keys/public.pem

  Keep private.pem secret. Never commit it to version control.
  Distribute public.pem to any party that needs to verify your documents.
```

```bash title="Terminal"
# RSA-2048
sdf keygen --algorithm RSA-2048 --out keys/
```

## Output files

`sdf keygen` writes two files:

| File | Format | Contents |
|------|--------|----------|
| `private.pem` | PKCS#8 PEM | Private key. File permissions set to `0600` (owner read/write only). |
| `public.pem` | SubjectPublicKeyInfo PEM | Public key. Safe to distribute. |

The private key file is immediately set to mode `0600` on Unix systems to prevent accidental exposure.

## Security recommendations

**Never commit private keys to version control.** Add `keys/private.pem` (or your key directory) to `.gitignore`:

```bash title=".gitignore"
keys/private.pem
*.pem
```

**Store private keys in a secrets manager in production.** Options include:
- AWS Secrets Manager
- HashiCorp Vault
- GCP Secret Manager
- Azure Key Vault

**Rotate keys periodically.** Generate a new key pair on rotation. The `signing_keys` table in `sdf-server-core` tracks multiple keys per tenant via the `key_id` field and `is_active` flag — old keys can be deactivated without being deleted, preserving the ability to verify previously-signed documents.

**Back up private keys securely.** If a private key is lost, documents signed with it can still be verified (using the public key), but new documents cannot be signed until a new key pair is generated.

## Using generated keys

After generating a key pair, use it with [`sdf sign`](/sdf/sdf-cli/sign) and [`sdf verify`](/sdf/sdf-cli/verify):

```bash title="Terminal"
# Sign a document
sdf sign invoice.sdf --key keys/private.pem --out invoice-signed.sdf

# Verify the signature
sdf verify invoice-signed.sdf --key keys/public.pem
```

To use the keys programmatically with `@etapsky/sdf-kit`:

```typescript title="sign-with-kit.ts"
import { signSDF, verifySIG } from '@etapsky/sdf-kit/signer';
import { readFile } from 'node:fs/promises';

const privateKey = await readFile('keys/private.pem', 'utf-8');
const publicKey  = await readFile('keys/public.pem',  'utf-8');

const signedBuffer = await signSDF(sdfBuffer, privateKey);
const isValid = await verifySIG(signedBuffer, publicKey);
```
