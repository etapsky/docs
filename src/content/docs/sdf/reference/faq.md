---
title: "FAQ"
description: "Frequently asked questions about SDF — format, licensing, compatibility, and tooling."
sidebar:
  label: "FAQ"
  order: 4
---

## How is SDF different from ZUGFeRD/XRechnung?

Several key differences:

| | SDF | ZUGFeRD / XRechnung |
|--|-----|---------------------|
| **Data format** | JSON (`data.json`) | XML (embedded in PDF/A-3 or standalone) |
| **Scope** | General purpose — any document type | Invoice-specific |
| **PDF requirement** | Any PDF viewer (visual.pdf is self-contained) | PDF/A-3 required for ZUGFeRD; XRechnung is XML-only |
| **Offline validation** | Always — schema is bundled in the archive | External schema URL references are common |
| **Self-describing** | Yes — `meta.json` + `schema.json` travel with the document | Schema is referenced externally or per-spec |
| **Signing** | ECDSA P-256 or RSA-2048 (Web Crypto API) | XAdES (XML signatures) |

SDF is not a replacement for ZUGFeRD or XRechnung in jurisdictions that legally mandate those formats. A `sdf convert` command exists for importing ZUGFeRD/XRechnung data into SDF where both formats are acceptable.

## Is SDF an open standard?

The **SDF format specification** (`spec/SDF_FORMAT.md`) is licensed under **Creative Commons Attribution 4.0 (CC-BY 4.0)**. Anyone can implement the format, build tools, or extend it.

The **SDF tooling** (sdf-kit, sdf-cli, sdf-server-core, etc.) is licensed under **Business Source License 1.1 (BUSL-1.1)**, which converts automatically to **Apache 2.0 on January 1, 2030**. Production use of the tooling currently requires a license — see [etapsky.com](https://etapsky.com) for details. The format specification itself has no such restriction.

## Can I open an SDF file without SDF software?

Yes. An `.sdf` file is a standard ZIP archive. You can open it with any ZIP tool (7-Zip, macOS Archive Utility, Windows File Explorer) and:

- View the visual layer by opening `visual.pdf` in any PDF reader.
- Inspect the data by opening `data.json` in any text editor or JSON viewer.

This backward compatibility is a deliberate design decision. An `.sdf` file received today will remain inspectable decades from now, with no dependency on Etapsky software.

## Does SDF support encryption?

SDF v0.1 does not include an encryption layer. Phases 1–3 of the format focus on structure, validation, and digital signatures. Encryption of the `.sdf` archive is planned for a future version.

For sensitive documents today, use transport-layer encryption (HTTPS/TLS) and object storage server-side encryption (S3 SSE-KMS or equivalent). Do not send unencrypted `.sdf` files over insecure channels.

## What is the maximum file size?

SDF enforces two limits to protect consumers from ZIP bomb attacks:

- **50 MB** per individual entry in the archive (e.g., `visual.pdf` must be under 50 MB)
- **200 MB** total uncompressed size across all entries

Exceeding either limit causes `SDF_ERROR_ARCHIVE_TOO_LARGE`. These limits are not configurable in the current spec version.

## Can I use SDF for government documents?

Yes. SDF is designed for B2B, B2G, and G2G use cases. The format imposes no assumptions about the parties involved or the industry vertical. Government-specific examples in this documentation include:

- [Tax Declaration (B2G)](/sdf/examples/gov-tax-declaration)
- [Customs Declaration (B2G)](/sdf/examples/gov-customs-declaration)
- [Permit Application (B2G)](/sdf/examples/gov-permit-application)
- [Health Report (B2G / G2G)](/sdf/examples/gov-health-report)

Government authorities define the `schema.json` they require. Producers bundle the authority-provided schema into the `.sdf` archive.

## How do monetary amounts work?

Monetary values are always represented as objects with two string fields:

```json
{ "amount": "1713.60", "currency": "EUR" }
```

The `amount` is a string, not a floating-point number. This is a deliberate design decision: IEEE 754 floating-point arithmetic introduces precision errors for financial calculations. For example, `0.1 + 0.2` in a 64-bit float is `0.30000000000000004`. In financial documents, this is unacceptable.

Never represent monetary amounts as bare numbers in SDF `data.json`.

## Is there a validation tool?

Yes — three of them:

**CLI:**
```bash
sdf validate document.sdf
```

**TypeScript:**
```typescript
import { validateSchema, parseSDF } from '@etapsky/sdf-kit';

const sdf = await parseSDF(buffer);
const result = validateSchema(sdf.data, sdf.schema);
console.log(result.valid, result.errors);
```

**Python:**
```python
from etapsky_sdf import parse_sdf, validate_schema

sdf = parse_sdf(raw_bytes)
result = validate_schema(sdf.data, sdf.schema)
print(result.valid, result.errors)
```

All three validators are fully offline — no network requests are made during validation.

## What signing algorithms are supported?

SDF v0.1 supports two algorithms via the Web Crypto API:

| Algorithm | Recommended use |
|-----------|----------------|
| **ECDSA P-256** | Recommended for all new deployments. Smaller signatures, faster verification. |
| **RSA-2048** | Legacy compatibility. Use when the counterparty's system does not support ECC. |

Key pairs are generated with `sdf keygen` (CLI) or `generateKeyPair()` (sdf-kit). Private keys are stored encrypted at rest using AES-256-GCM when managed by SDF Server.

## Where can I get support?

- **GitHub Issues:** [github.com/etapsky/sdf/issues](https://github.com/etapsky/sdf/issues) — bug reports, feature requests, and spec questions
- **Discussions:** [github.com/orgs/etapsky/discussions](https://github.com/orgs/etapsky/discussions) — general questions and community
- **Enterprise support:** [etapsky.com](https://etapsky.com) — SLAs, dedicated support, and professional services
