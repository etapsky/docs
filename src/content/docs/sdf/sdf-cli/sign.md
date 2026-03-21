---
title: "sdf sign"
description: "Digitally sign an SDF file using ECDSA P-256 or RSA-2048."
sidebar:
  label: "sign"
  order: 4
---

`sdf sign` adds a digital signature to an `.sdf` file, producing a new file with a `signature.sig` entry added to the archive. The original file is not modified.

:::caution[Phase 4 feature]
Digital signing is a Phase 4 capability and is not required for producing and consuming SDF documents in standard workflows. Implement signing when document authenticity and tamper-evidence are required by your use case or regulatory context.
:::

## Usage

```bash title="Terminal"
sdf sign <file> [flags]
```

## Flags

| Flag | Description | Required |
|------|-------------|----------|
| `--key <path>` | Path to the PEM-encoded private key file | Yes |
| `--out <path>` | Output file path for the signed `.sdf`. Defaults to `<input>-signed.sdf` | No |
| `--algorithm <alg>` | Algorithm override: `ECDSA-P256` or `RSA-2048`. Inferred from key if omitted. | No |
| `--no-color` | Disable ANSI color output | No |
| `--help` | Print help and exit | No |

## Example

```bash title="Terminal"
# Generate a key pair first (if you haven't already)
sdf keygen --algorithm ECDSA-P256 --out keys/

# Sign the document
sdf sign invoice.sdf --key keys/private.pem --out invoice-signed.sdf
```

```
  SDF — Smart Document Format  @etapsky/sdf-cli 0.3.0
────────────────────────────────────────────────────────────
  sign  invoice.sdf
────────────────────────────────────────────────────────────

  Algorithm  ECDSA-P256
  Key        keys/private.pem

  ✓ signature added

  Output  invoice-signed.sdf
```

## What gets signed

The signature covers the canonical (deterministically serialized) form of `meta.json` and `data.json`. Any modification to either file after signing will cause verification to fail. The `visual.pdf` and `schema.json` entries are not directly covered by the signature but are validated as part of the overall archive check.

## Algorithm selection

| Algorithm | Recommended | Notes |
|-----------|-------------|-------|
| `ECDSA-P256` | Yes | Shorter signatures (~72 bytes), faster, modern. Preferred for new deployments. |
| `RSA-2048` | When required | Larger signatures (256 bytes). Use when interoperating with systems that require RSA. |

The algorithm is inferred from the key file format. Pass `--algorithm` explicitly only if the inference fails.

## Using a key from an environment variable

In automated pipelines, store the private key in a secret and pass it via a temporary file:

```bash title=".github/workflows/sign.yml (step)"
- name: Sign SDF document
  run: |
    echo "$SDF_PRIVATE_KEY" > /tmp/private.pem
    sdf sign invoice.sdf --key /tmp/private.pem --out invoice-signed.sdf
    rm /tmp/private.pem
  env:
    SDF_PRIVATE_KEY: ${{ secrets.SDF_PRIVATE_KEY }}
```

## Exit codes

| Code | Meaning |
|------|---------|
| `0` | Signing succeeded |
| `1` | Signing failed (invalid key, unreadable file, etc.) |
| `2` | CLI usage error |
