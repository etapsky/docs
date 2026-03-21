---
title: "MigrationEngine"
description: "Migrate SDF data payloads between schema versions using registered migration functions."
sidebar:
  label: "Migrate"
  order: 4
---

`MigrationEngine` executes version-to-version data transformations on SDF document payloads. When a schema version introduces breaking changes, you register a migration function that transforms documents still using the old schema into a shape that satisfies the new one.

## Import

```typescript
import { MigrationEngine } from '@etapsky/sdf-schema-registry';
```

## Constructor

```typescript
const engine = new MigrationEngine();
```

## Methods

### `addMigration(type, fromVersion, toVersion, fn)`

Registers a migration function for a specific `(type, fromVersion → toVersion)` path.

```typescript
engine.addMigration(
  type: string,
  fromVersion: string,
  toVersion: string,
  fn: (data: Record<string, unknown>) => Record<string, unknown>,
): void
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | `string` | Schema type, e.g. `'invoice'` |
| `fromVersion` | `string` | Source version, e.g. `'v0.1'` |
| `toVersion` | `string` | Target version, e.g. `'v0.2'` |
| `fn` | `function` | Pure function that transforms the data object |

The migration function receives the original data object and must return the transformed data object. It must be a pure function with no side effects.

```typescript title="add-migration.ts"
engine.addMigration('invoice', 'v0.1', 'v0.2', (data) => ({
  ...data,
  payment_terms: data.payment_terms ?? 'NET_30',
}));
```

### `migrate(data, type, fromVersion, toVersion)`

Runs the registered migration function and returns the transformed data.

```typescript
engine.migrate(
  data: Record<string, unknown>,
  type: string,
  fromVersion: string,
  toVersion: string,
): Record<string, unknown>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | `object` | The `data.json` payload from the SDF document |
| `type` | `string` | Schema type |
| `fromVersion` | `string` | Current version of the data |
| `toVersion` | `string` | Target version to migrate to |

Throws `MigrationNotFoundError` if no migration is registered for the requested path.

```typescript title="migrate-data.ts"
const migratedData = engine.migrate(
  originalData,
  'invoice',
  'v0.1',
  'v0.2',
);
```

## Migration function contract

A migration function must satisfy these constraints:

- **Pure** — no external I/O, no mutations of the input object
- **Total** — must handle all valid documents of the source version, including those with optional fields absent
- **Forward only** — migrations run from older to newer versions; reverse migrations are not supported by `MigrationEngine`

```typescript title="migration-best-practices.ts"
engine.addMigration('invoice', 'v0.1', 'v0.2', (data) => {
  // Spread to avoid mutating the input
  const result = { ...data };

  // Use nullish coalescing for fields that may or may not exist in v0.1
  result.payment_terms = data.payment_terms ?? 'NET_30';

  // Remove fields that no longer exist in v0.2
  delete result.legacy_field;

  // Rename fields
  if ('old_field_name' in data) {
    result.new_field_name = data.old_field_name;
    delete result.old_field_name;
  }

  return result;
});
```

## Chained (multi-hop) migrations

`MigrationEngine` supports chained migrations: if a direct `v0.1 → v0.3` migration is not registered but `v0.1 → v0.2` and `v0.2 → v0.3` are, the engine will chain them automatically.

```typescript title="chained-migrations.ts"
engine.addMigration('invoice', 'v0.1', 'v0.2', (data) => ({
  ...data,
  payment_terms: data.payment_terms ?? 'NET_30',
}));

engine.addMigration('invoice', 'v0.2', 'v0.3', (data) => ({
  ...data,
  currency_code: (data.total as any)?.currency ?? 'EUR',
}));

// Engine resolves the chain v0.1 → v0.2 → v0.3 automatically
const result = engine.migrate(data, 'invoice', 'v0.1', 'v0.3');
```

:::note
When chaining, the engine always finds the shortest registered path between the two versions. Register explicit hop migrations rather than skipping versions where possible to keep each migration function small and testable.
:::

## Error handling

```typescript title="migration-errors.ts"
import { MigrationEngine, MigrationNotFoundError } from '@etapsky/sdf-schema-registry';

const engine = new MigrationEngine();

try {
  const result = engine.migrate(data, 'invoice', 'v0.1', 'v9.9');
} catch (err) {
  if (err instanceof MigrationNotFoundError) {
    console.error(
      `No migration path from ${err.fromVersion} to ${err.toVersion} for type '${err.type}'`,
    );
  }
}
```

## Full migration workflow

A complete end-to-end example: parse an older SDF document, migrate its data payload to the current schema version, validate, and repack.

```typescript title="full-migration-workflow.ts"
import { parseSDF, validateSchema, buildSDF } from '@etapsky/sdf-kit';
import { SchemaRegistry, MigrationEngine, diffSchemas } from '@etapsky/sdf-schema-registry';
import { readFileSync, writeFileSync } from 'node:fs';

// Setup
const registry = new SchemaRegistry();
registry.register('invoice', 'v0.1', invoiceSchemaV1);
registry.register('invoice', 'v0.2', invoiceSchemaV2);

const engine = new MigrationEngine();
engine.addMigration('invoice', 'v0.1', 'v0.2', (data) => ({
  ...data,
  payment_terms: data.payment_terms ?? 'NET_30',
}));

// Process document
const buffer = readFileSync('invoice-old.sdf');
const sdf = parseSDF(buffer);

const [type, fromVersion] = sdf.meta.schema_id.split('/');
const toVersion = 'v0.2';

if (fromVersion !== toVersion) {
  // Migrate data
  const migratedData = engine.migrate(sdf.data, type, fromVersion, toVersion);

  // Validate against new schema
  const newSchema = registry.resolve(type, toVersion);
  const validation = validateSchema(migratedData, newSchema);
  if (!validation.valid) {
    throw new Error(`Migration produced invalid data: ${JSON.stringify(validation.errors)}`);
  }

  // Repack with updated meta
  const updatedMeta = {
    ...sdf.meta,
    schema_id: `${type}/${toVersion}`,
  };

  const newBuffer = await buildSDF({
    meta: updatedMeta,
    data: migratedData,
    schema: newSchema,
    pdfBytes: sdf.visual,
  });

  writeFileSync('invoice-migrated.sdf', newBuffer);
}
```

## Testing migrations

Each migration function should be tested in isolation since it is a pure function:

```typescript title="migration.test.ts"
import { describe, it, expect } from 'vitest';

const invoiceMigrationV1toV2 = (data: Record<string, unknown>) => ({
  ...data,
  payment_terms: data.payment_terms ?? 'NET_30',
});

describe('invoice v0.1 → v0.2 migration', () => {
  it('adds default payment_terms when absent', () => {
    const input = { invoice_number: 'INV-001', issue_date: '2026-03-15' };
    const output = invoiceMigrationV1toV2(input);
    expect(output.payment_terms).toBe('NET_30');
  });

  it('preserves existing payment_terms', () => {
    const input = { invoice_number: 'INV-001', payment_terms: 'NET_60' };
    const output = invoiceMigrationV1toV2(input);
    expect(output.payment_terms).toBe('NET_60');
  });

  it('does not mutate the input object', () => {
    const input = { invoice_number: 'INV-001' };
    const frozen = Object.freeze(input);
    expect(() => invoiceMigrationV1toV2(frozen)).not.toThrow();
  });
});
```
