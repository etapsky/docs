---
title: "@etapsky/sdf-schema-registry"
description: "Schema versioning, diff analysis, and migration engine for SDF schemas. Register, resolve, diff, and migrate across schema versions."
sidebar:
  label: "Overview"
  order: 1
---

`@etapsky/sdf-schema-registry` provides the schema lifecycle layer for SDF. It covers three distinct responsibilities:

- **Registry** — register, resolve, and list versioned schemas
- **Diff** — analyze breaking and non-breaking changes between two schema versions
- **Migration** — transform SDF data payloads from one schema version to another

## Installation

```bash
npm install @etapsky/sdf-schema-registry
# or
bun add @etapsky/sdf-schema-registry
```

## Package overview

| Export | Purpose |
|--------|---------|
| `SchemaRegistry` | In-memory (or persistent) schema store |
| `diffSchemas()` | Structural diff between two JSON Schema versions |
| `MigrationEngine` | Register and execute version-to-version data migrations |

## Quick example

```typescript title="schema-lifecycle.ts"
import {
  SchemaRegistry,
  diffSchemas,
  MigrationEngine,
} from '@etapsky/sdf-schema-registry';

// 1. Register schemas
const registry = new SchemaRegistry();
registry.register('invoice', 'v0.1', invoiceSchemaV1);
registry.register('invoice', 'v0.2', invoiceSchemaV2);

// 2. Diff versions before publishing
const diff = diffSchemas(invoiceSchemaV1, invoiceSchemaV2);
if (diff.breaking.length > 0) {
  console.warn('Breaking changes detected:', diff.breaking);
}

// 3. Migrate existing data
const engine = new MigrationEngine();
engine.addMigration('invoice', 'v0.1', 'v0.2', (data) => ({
  ...data,
  payment_terms: data.payment_terms ?? 'NET_30',
}));

const migratedData = engine.migrate(data, 'invoice', 'v0.1', 'v0.2');
```

## When to use this package

Use `sdf-schema-registry` whenever you need to:

- **Publish a new schema version** — register both the old and new version, run `diffSchemas()` to understand the impact before distributing documents.
- **Support multiple active schema versions** — resolve the correct schema at parse or validation time based on `meta.json → schema_id`.
- **Maintain backward compatibility** — add migration functions so consumers of older SDF documents can upgrade the data payload to a newer schema without manual transformation logic.

## Schema ID convention

Schema IDs within SDF follow the `{type}/v{major}.{minor}` convention defined in `spec/SDF_FORMAT.md`:

```
invoice/v0.1
invoice/v0.2
nomination/v1.0
purchase-order/v1.0
```

The `SchemaRegistry` stores schemas by `(type, version)` tuple. The `schema_id` field in `meta.json` acts as the lookup key at runtime.

## Compatibility with sdf-kit

`@etapsky/sdf-schema-registry` is a standalone package with no runtime dependency on `@etapsky/sdf-kit`. However, they are designed to work together:

```typescript title="integration-with-sdf-kit.ts"
import { validateSchema } from '@etapsky/sdf-kit';
import { SchemaRegistry } from '@etapsky/sdf-schema-registry';

const registry = new SchemaRegistry();

// At validation time, resolve the schema from the registry
const schema = registry.resolve('invoice', 'v0.2');
const result = validateSchema(data, schema);
```

## Next steps

- [SchemaRegistry](/sdf/sdf-schema-registry/registry) — register, resolve, and list schemas
- [diffSchemas()](/sdf/sdf-schema-registry/diff) — analyze changes between versions
- [MigrationEngine](/sdf/sdf-schema-registry/migrate) — migrate data between versions
