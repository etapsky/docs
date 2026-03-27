---
title: "sdf verify"
description: "Verify the digital signature of a signed SDF file."
sidebar:
  label: "verify"
  order: 5
---

`sdf verify` verifies the digital signature of a signed `.sdf` file. It checks that the document has not been modified since it was signed and that the signature was produced by the holder of the corresponding private key.

## Usage

```bash title="Terminal"
sdf verify <file> [flags]
```

## Flags

| Flag | Description | Required |
|------|-------------|----------|
| `--key <path>` | Path to the PEM-encoded public key file | Yes |
| `--json` | Output result as JSON | No |
| `--no-color` | Disable ANSI color output | No |
| `--help` | Print help and exit | No |

## Example — valid signature

```bash title="Terminal"
sdf verify invoice-signed.sdf --key keys/public.pem
```

```
  SDF — Smart Document Format  @etapsky/sdf-cli 0.3.2
────────────────────────────────────────────────────────────
  verify  invoice-signed.sdf
────────────────────────────────────────────────────────────

  Algorithm  ECDSA-P256
  Key        keys/public.pem

  ✓ signature valid

  Document  f47ac10b-58cc-4372-a567-0e02b2c3d479
  Issuer    Acme Supplies GmbH
```

## Example — invalid signature

```bash title="Terminal"
sdf verify tampered.sdf --key keys/public.pem
```

```
  SDF — Smart Document Format  @etapsky/sdf-cli 0.3.2
────────────────────────────────────────────────────────────
  verify  tampered.sdf
────────────────────────────────────────────────────────────

  Algorithm  ECDSA-P256
  Key        keys/public.pem

  ✗ signature invalid

  The document content does not match its signature.
  The file may have been modified after signing.
```

## Example — unsigned file

```bash title="Terminal"
sdf verify invoice.sdf --key keys/public.pem
```

```
  ✗ no signature found

  invoice.sdf does not contain a signature.sig entry.
  Use sdf sign to sign the document first.
```

## JSON output

```bash title="Terminal"
sdf verify invoice-signed.sdf --key keys/public.pem --json
```

```json
{
  "file":       "invoice-signed.sdf",
  "valid":      true,
  "signed":     true,
  "algorithm":  "ECDSA-P256",
  "document_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "issuer":     "Acme Supplies GmbH"
}
```

## Exit codes

| Code | Meaning |
|------|---------|
| `0` | Signature is valid |
| `1` | Signature is invalid, absent, or the file cannot be read |
| `2` | CLI usage error |

## Using in a pipeline

Because `sdf verify` exits `1` on failure, it integrates naturally into shell pipelines:

```bash title="Terminal"
sdf verify invoice-signed.sdf --key keys/public.pem \
  && echo "Signature valid — processing document" \
  || { echo "Signature invalid — aborting"; exit 1; }
```

```yaml title=".github/workflows/verify.yml (step)"
- name: Verify SDF signature
  run: sdf verify documents/invoice-signed.sdf --key keys/public.pem
```

## Obtaining the public key

The public key used for verification must correspond to the private key used for signing. Common distribution methods:

- Include the public key in your organization's developer documentation
- Expose it via an API endpoint (e.g. `GET /v1/signing-keys/public`)
- Publish it to a well-known URL on your domain (e.g. `https://example.com/.well-known/sdf-public-key.pem`)
