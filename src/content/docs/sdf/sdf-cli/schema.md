---
title: "sdf schema"
description: "Schema registry operations — list, version history, diff analysis, and local validation."
sidebar:
  label: "schema"
  order: 9
---

`sdf schema` provides subcommands for working with the SDF schema registry. You can list registered schemas, view version history, compare schema versions for breaking changes, and validate a local data file against a registered schema.

## Usage

```bash title="Terminal"
sdf schema <subcommand> [args] [flags]
```

## Subcommands

| Subcommand | Description |
|------------|-------------|
| `list` | List all schemas registered in the registry |
| `versions <schema-id>` | List all versions of a specific schema |
| `diff <schema-id> <v1> <v2>` | Compare two versions of a schema — breaking and non-breaking changes |
| `validate <data-file> --schema <schema-ref>` | Validate a local data file against a registered schema |

## `sdf schema list`

Lists all schemas registered in the schema registry.

```bash title="Terminal"
sdf schema list
```

```
  SDF — Smart Document Format  @etapsky/sdf-cli 0.3.2
────────────────────────────────────────────────────────────
  schema  list
────────────────────────────────────────────────────────────

  Schema ID          Versions  Latest    Published
  ─────────────────────────────────────────────────────────
  invoice            3         v0.3      ✓
  purchase_order     2         v0.2      ✓
  nomination         1         v0.1      ✓
  goods_receipt      1         v0.1      ✗ (draft)
  payment_advice     2         v0.2      ✓

  5 schemas
```

### Flags

| Flag | Description |
|------|-------------|
| `--json` | Output as JSON |
| `--no-color` | Disable ANSI color output |

### JSON output

```bash title="Terminal"
sdf schema list --json
```

```json
{
  "schemas": [
    { "id": "invoice",        "versions": 3, "latest": "v0.3", "published": true },
    { "id": "purchase_order", "versions": 2, "latest": "v0.2", "published": true },
    { "id": "nomination",     "versions": 1, "latest": "v0.1", "published": true },
    { "id": "goods_receipt",  "versions": 1, "latest": "v0.1", "published": false },
    { "id": "payment_advice", "versions": 2, "latest": "v0.2", "published": true }
  ]
}
```

## `sdf schema versions <schema-id>`

Lists all registered versions of a specific schema, including their publication status and registration date.

```bash title="Terminal"
sdf schema versions invoice
```

```
  SDF — Smart Document Format  @etapsky/sdf-cli 0.3.2
────────────────────────────────────────────────────────────
  schema  versions  invoice
────────────────────────────────────────────────────────────

  Version  Published  Registered
  ────────────────────────────────────────
  v0.1     ✓          2025-10-01
  v0.2     ✓          2026-01-15
  v0.3     ✓          2026-03-10

  3 versions
```

### Flags

| Flag | Description |
|------|-------------|
| `--json` | Output as JSON |
| `--no-color` | Disable ANSI color output |

## `sdf schema diff <schema-id> <v1> <v2>`

Compares two versions of a schema and classifies each change as breaking or non-breaking.

**Breaking changes** prevent older documents from validating against the new schema — for example, adding a required field or changing a field's type. Breaking changes require a new major schema version.

**Non-breaking changes** are backward-compatible — for example, adding an optional field or relaxing a constraint.

```bash title="Terminal"
sdf schema diff invoice v0.1 v0.2
```

```
  SDF — Smart Document Format  @etapsky/sdf-cli 0.3.2
────────────────────────────────────────────────────────────
  schema  diff  invoice  v0.1 → v0.2
────────────────────────────────────────────────────────────

  Non-breaking changes (3)
  ────────────────────────────────────────────────────────
  + /properties/due_date              added optional field
  + /properties/notes                 added optional field
  ~ /properties/seller/properties/    added optional field: website

  Breaking changes (1)
  ────────────────────────────────────────────────────────
  ! /required                         added required field: vat_breakdown

  ⚠  1 breaking change — existing documents may fail v0.2 validation
```

```bash title="Terminal"
sdf schema diff invoice v0.2 v0.3
```

```
  Non-breaking changes (2)
  ────────────────────────────────────────────────────────
  + /properties/attachments           added optional array field
  ~ /properties/total                 added optional field: vat_amount

  Breaking changes (0)
  ────────────────────────────────────────────────────────
  (none)

  ✓ fully backward-compatible
```

### Flags

| Flag | Description |
|------|-------------|
| `--json` | Output diff as JSON |
| `--no-color` | Disable ANSI color output |

### JSON diff output

```bash title="Terminal"
sdf schema diff invoice v0.1 v0.2 --json
```

```json
{
  "schema_id": "invoice",
  "from":      "v0.1",
  "to":        "v0.2",
  "breaking": [
    {
      "path":        "/required",
      "change":      "added",
      "description": "added required field: vat_breakdown"
    }
  ],
  "non_breaking": [
    {
      "path":        "/properties/due_date",
      "change":      "added",
      "description": "added optional field"
    },
    {
      "path":        "/properties/notes",
      "change":      "added",
      "description": "added optional field"
    },
    {
      "path":        "/properties/seller/properties/website",
      "change":      "added",
      "description": "added optional field"
    }
  ],
  "has_breaking_changes": true
}
```

## `sdf schema validate <data-file> --schema <schema-ref>`

Validates a local `data.json` file against a schema from the registry. The schema reference uses the format `<schema-id>/<version>` (e.g. `invoice/v0.2`).

```bash title="Terminal"
sdf schema validate data.json --schema invoice/v0.2
```

```
  SDF — Smart Document Format  @etapsky/sdf-cli 0.3.2
────────────────────────────────────────────────────────────
  schema  validate  data.json
────────────────────────────────────────────────────────────

  Schema  invoice/v0.2

  ✓ valid
```

```bash title="Terminal"
sdf schema validate broken-data.json --schema invoice/v0.2
```

```
  Schema  invoice/v0.2

  ✗ invalid  (2 errors)

  /total/amount     must be string
  /vat_breakdown    required property missing
```

### Flags

| Flag | Description | Required |
|------|-------------|----------|
| `--schema <ref>` | Schema reference in `<id>/<version>` format (e.g. `invoice/v0.2`) | Yes |
| `--json` | Output as JSON | No |
| `--no-color` | Disable ANSI color output | No |

### Exit codes

| Code | Meaning |
|------|---------|
| `0` | Data is valid against the specified schema |
| `1` | Data is invalid, schema not found, or file cannot be read |
| `2` | CLI usage error |

### JSON output

```bash title="Terminal"
sdf schema validate data.json --schema invoice/v0.2 --json
```

```json
{
  "file":      "data.json",
  "schema":    "invoice/v0.2",
  "valid":     false,
  "errors": [
    { "instancePath": "/total/amount",  "message": "must be string" },
    { "instancePath": "/vat_breakdown", "message": "required property missing" }
  ]
}
```

## Registry configuration

By default, `sdf schema` commands connect to the Etapsky hosted schema registry. To use a self-hosted registry, set the `SDF_REGISTRY_URL` environment variable:

```bash title="Terminal"
export SDF_REGISTRY_URL=https://registry.example.com
sdf schema list
```

Or pass it per-command:

```bash title="Terminal"
SDF_REGISTRY_URL=https://registry.example.com sdf schema list
```
