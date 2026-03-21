---
title: "sdf validate"
description: "Validate an SDF file and exit with 0 (valid) or 1 (invalid). Designed for CI pipelines."
sidebar:
  label: "validate"
  order: 3
---

`sdf validate` checks that an `.sdf` file conforms to the SDF specification: archive structure, meta.json validity, schema.json correctness, and data-against-schema conformance. Exits with code `0` if valid, `1` if not — making it a drop-in step in any CI pipeline.

## Usage

```bash title="Terminal"
sdf validate <file> [flags]
```

## Flags

| Flag | Description |
|------|-------------|
| `--json` | Output validation result as JSON |
| `--no-color` | Disable ANSI color output |
| `--help` | Print help and exit |

## What is validated

`sdf validate` runs the following checks in order:

1. **Archive integrity** — confirms the file is a valid ZIP and does not contain path traversal sequences
2. **Required entries** — confirms `meta.json`, `data.json`, `schema.json`, and `visual.pdf` are all present
3. **Size limits** — rejects files over 50 MB compressed or 200 MB uncompressed
4. **Meta validation** — validates `meta.json` against the `SDFMeta` schema
5. **Version check** — confirms `sdf_version` is supported
6. **Schema validity** — confirms `schema.json` is valid JSON Schema Draft 2020-12
7. **Data conformance** — validates `data.json` against `schema.json`

## Example — valid file

```bash title="Terminal"
sdf validate invoice.sdf
```

```
  SDF — Smart Document Format  @etapsky/sdf-cli 0.3.0
────────────────────────────────────────────────────────────
  validate  invoice.sdf
────────────────────────────────────────────────────────────

  ✓ archive structure  valid ZIP, no path traversal
  ✓ required entries   visual.pdf  data.json  schema.json  meta.json
  ✓ size limits        259 KB compressed / 259 KB uncompressed
  ✓ meta              f47ac10b-58cc-4372-a567-0e02b2c3d479
  ✓ sdf_version       0.1 supported
  ✓ schema            valid JSON Schema Draft 2020-12
  ✓ data              conforms to schema

  ✓ valid
```

Exit code: `0`

## Example — invalid file

```bash title="Terminal"
sdf validate broken.sdf
```

```
  SDF — Smart Document Format  @etapsky/sdf-cli 0.3.0
────────────────────────────────────────────────────────────
  validate  broken.sdf
────────────────────────────────────────────────────────────

  ✓ archive structure  valid ZIP, no path traversal
  ✓ required entries   visual.pdf  data.json  schema.json  meta.json
  ✓ size limits        42 KB
  ✓ meta              a1b2c3d4-e5f6-7890-abcd-ef1234567890
  ✓ sdf_version       0.1 supported
  ✓ schema            valid JSON Schema Draft 2020-12
  ✗ data              2 errors

    /total/amount     must be string (got number)
    /issue_date       must match format "date"

  ✗ invalid
```

Exit code: `1`

## JSON output

```bash title="Terminal"
sdf validate invoice.sdf --json
```

```json
{
  "file":  "invoice.sdf",
  "valid": true,
  "checks": {
    "archive":  { "valid": true },
    "entries":  { "valid": true },
    "size":     { "valid": true, "bytes": 265216 },
    "meta":     { "valid": true },
    "version":  { "valid": true, "sdf_version": "0.1" },
    "schema":   { "valid": true },
    "data":     { "valid": true, "errors": [] }
  }
}
```

Invalid file JSON:

```json
{
  "file":  "broken.sdf",
  "valid": false,
  "checks": {
    "archive":  { "valid": true },
    "entries":  { "valid": true },
    "size":     { "valid": true, "bytes": 43008 },
    "meta":     { "valid": true },
    "version":  { "valid": true, "sdf_version": "0.1" },
    "schema":   { "valid": true },
    "data": {
      "valid": false,
      "errors": [
        { "instancePath": "/total/amount", "message": "must be string (got number)" },
        { "instancePath": "/issue_date",   "message": "must match format \"date\"" }
      ]
    }
  }
}
```

## CI usage

### GitHub Actions

```yaml title=".github/workflows/validate-sdf.yml"
name: Validate SDF documents

on:
  push:
    paths:
      - '**.sdf'
  pull_request:
    paths:
      - '**.sdf'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install sdf-cli
        run: npm install -g @etapsky/sdf-cli

      - name: Validate SDF files
        run: |
          for f in $(find . -name '*.sdf'); do
            echo "Validating $f"
            sdf validate "$f"
          done
```

### GitLab CI

```yaml title=".gitlab-ci.yml"
validate-sdf:
  image: node:22-alpine
  script:
    - npm install -g @etapsky/sdf-cli
    - find . -name '*.sdf' -exec sdf validate {} \;
  rules:
    - changes:
        - '**/*.sdf'
```

### Shell scripting

```bash title="validate-all.sh"
#!/usr/bin/env bash
set -euo pipefail

FAILED=0

for file in documents/*.sdf; do
  if sdf validate "$file" --json | jq -e '.valid' > /dev/null; then
    echo "✓ $file"
  else
    echo "✗ $file"
    FAILED=$((FAILED + 1))
  fi
done

if [ "$FAILED" -gt 0 ]; then
  echo "$FAILED file(s) failed validation"
  exit 1
fi

echo "All documents valid."
```

## Exit codes

| Code | Meaning |
|------|---------|
| `0` | File is valid — all checks passed |
| `1` | File is invalid — one or more checks failed |
| `2` | CLI usage error (e.g. file path not provided) |
