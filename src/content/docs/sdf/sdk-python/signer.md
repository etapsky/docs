---
title: "Signer — SDFSigner"
description: "Digital signing for SDF files in Python. ECDSA P-256 and RSA-2048."
sidebar:
  label: "Signer"
  order: 5
---

`SDFSigner` adds and verifies digital signatures on `.sdf` files. Signing appends a `signature.sig` file to the archive. Verification reads and validates that file against the public key.

**Requires:** `pip install "etapsky-sdf[signing]"` (installs `cryptography>=42.0`)

## Import

```python
from sdf.signer import SDFSigner
```

## Class: SDFSigner

### Constructor

```python
signer = SDFSigner()
```

### `generate_key_pair(algorithm)`

Generates a new asymmetric key pair.

```python
signer.generate_key_pair(algorithm: str = "ECDSA-P256") -> tuple[PrivateKey, PublicKey]
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `algorithm` | `str` | `"ECDSA-P256"` (default) or `"RSA-2048"` |

**Returns:** `(private_key, public_key)` — cryptography library key objects.

```python title="keygen.py"
from sdf.signer import SDFSigner

signer = SDFSigner()

# ECDSA P-256 (recommended)
private_key, public_key = signer.generate_key_pair("ECDSA-P256")

# RSA-2048
private_key_rsa, public_key_rsa = signer.generate_key_pair("RSA-2048")
```

### `export_private_key(private_key, password=None)`

Exports a private key to PEM format. Pass a `password` to encrypt the PEM.

```python
signer.export_private_key(
    private_key: PrivateKey,
    password: bytes | None = None,
) -> str
```

```python title="export-keys.py"
priv_pem = signer.export_private_key(private_key)
pub_pem = signer.export_public_key(public_key)

with open("private.pem", "w") as f:
    f.write(priv_pem)

with open("public.pem", "w") as f:
    f.write(pub_pem)
```

### `export_public_key(public_key)`

Exports a public key to PEM format.

```python
signer.export_public_key(public_key: PublicKey) -> str
```

### `load_private_key(pem, password=None)`

Loads a private key from a PEM string.

```python
signer.load_private_key(pem: str, password: bytes | None = None) -> PrivateKey
```

### `load_public_key(pem)`

Loads a public key from a PEM string.

```python
signer.load_public_key(pem: str) -> PublicKey
```

### `sign(buffer, private_key)`

Signs an `.sdf` archive and returns a new archive with `signature.sig` added.

```python
signer.sign(buffer: bytes, private_key: PrivateKey) -> bytes
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `buffer` | `bytes` | Unsigned `.sdf` archive |
| `private_key` | `PrivateKey` | ECDSA P-256 or RSA-2048 private key |

**Returns:** `bytes` — new `.sdf` archive containing `signature.sig`.

The signature is computed over the concatenated contents of `meta.json`, `data.json`, and `schema.json` in that order, then stored in `signature.sig`.

### `verify(buffer, public_key)`

Verifies the `signature.sig` in an `.sdf` archive.

```python
signer.verify(buffer: bytes, public_key: PublicKey) -> bool
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `buffer` | `bytes` | Signed `.sdf` archive |
| `public_key` | `PublicKey` | Corresponding public key |

**Returns:** `True` if the signature is valid, `False` otherwise.

Does not raise on invalid signatures — check the return value.

## Full signing workflow

```python title="signing-workflow.py"
from sdf import SDFProducer, SDFMeta
from sdf.signer import SDFSigner

# 1. Generate a key pair and persist it
signer = SDFSigner()
private_key, public_key = signer.generate_key_pair("ECDSA-P256")

priv_pem = signer.export_private_key(private_key)
pub_pem = signer.export_public_key(public_key)

with open("signing-private.pem", "w") as f:
    f.write(priv_pem)
with open("signing-public.pem", "w") as f:
    f.write(pub_pem)

# 2. Produce the SDF document
producer = SDFProducer()
meta = SDFMeta(
    issuer="Acme Supplies GmbH",
    issuer_id="DE123456789",
    document_type="invoice",
)
sdf_bytes = producer.build(data=invoice_data, schema=invoice_schema, meta=meta)

# 3. Sign
signed_bytes = signer.sign(sdf_bytes, private_key)

with open("invoice-signed.sdf", "wb") as f:
    f.write(signed_bytes)

print(f"Signed SDF: {len(signed_bytes):,} bytes")

# 4. Verify on the receiving end
with open("signing-public.pem") as f:
    pub_pem = f.read()
pub_key = signer.load_public_key(pub_pem)

with open("invoice-signed.sdf", "rb") as f:
    incoming = f.read()

is_valid = signer.verify(incoming, pub_key)
print(f"Signature valid: {is_valid}")  # True
```

## Loading a persisted key pair

```python title="load-keys.py"
from sdf.signer import SDFSigner

signer = SDFSigner()

with open("signing-private.pem") as f:
    private_key = signer.load_private_key(f.read())

with open("signing-public.pem") as f:
    public_key = signer.load_public_key(f.read())
```

## Choosing an algorithm

| Algorithm | Key size | Signature size | Recommended for |
|-----------|----------|----------------|-----------------|
| `ECDSA-P256` | 256-bit | ~72 bytes | Default choice. Modern, compact, fast. |
| `RSA-2048` | 2048-bit | 256 bytes | When RSA is required by the receiving system or regulation. |

ECDSA P-256 is the default and is recommended for all new integrations. RSA-2048 is provided for compatibility with legacy systems that require RSA.

## Verifying a signed document end-to-end

```python title="verify-full.py"
from sdf import parse_sdf
from sdf.signer import SDFSigner
from sdf.errors import SDFError

signer = SDFSigner()

with open("signing-public.pem") as f:
    public_key = signer.load_public_key(f.read())

with open("invoice-signed.sdf", "rb") as f:
    buffer = f.read()

# Parse the document
result = parse_sdf(buffer)

if result.signature is None:
    raise SDFError("SDF_ERROR_INVALID_SIGNATURE", "Document is not signed")

# Verify the signature
is_valid = signer.verify(buffer, public_key)

if not is_valid:
    raise SDFError("SDF_ERROR_INVALID_SIGNATURE", "Signature verification failed")

print(f"Document {result.meta.document_id} — signature verified")
print(f"Issuer: {result.meta.issuer}")
print(f"Type: {result.meta.document_type}")
```
