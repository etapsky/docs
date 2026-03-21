---
title: "SchemaRegistry"
description: "Register, resolve, and list SDF schemas with SchemaRegistry."
sidebar:
  label: "Registry"
  order: 2
---

`SchemaRegistry` is an in-memory store for versioned JSON Schema definitions. It maps `(type, version)` pairs to schema objects and lets you resolve the correct schema at runtime based on the `schema_id` in a document's `meta.json`.

## Import

```typescript
import { SchemaRegistry } from '@etapsky/sdf-schema-registry';
```

## Constructor

```typescript
const registry = new SchemaRegistry();
```

Creates a new empty registry. Each instance is independent — there is no global singleton.

## Methods

### `register(type, version, schema)`

Registers a JSON Schema under a `(type, version)` key.

```typescript
registry.register(type: string, version: string, schema: object): void
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | `string` | Schema type, e.g. `'invoice'`, `'nomination'` |
| `version` | `string` | Schema version, e.g. `'v0.1'`, `'v1.0'` |
| `schema` | `object` | A valid JSON Schema Draft 2020-12 object |

```typescript title="register-schemas.ts"
import invoiceSchemaV1 from './schemas/invoice.v0.1.json';
import invoiceSchemaV2 from './schemas/invoice.v0.2.json';

const registry = new SchemaRegistry();
registry.register('invoice', 'v0.1', invoiceSchemaV1);
registry.register('invoice', 'v0.2', invoiceSchemaV2);
registry.register('nomination', 'v1.0', nominationSchema);
```

Registering the same `(type, version)` pair twice overwrites the existing entry.

### `resolve(type, version)`

Returns the schema for a given `(type, version)` pair.

```typescript
registry.resolve(type: string, version: string): object
```

Throws `SchemaNotFoundError` if the requested `(type, version)` pair is not registered.

```typescript title="resolve-schema.ts"
const schema = registry.resolve('invoice', 'v0.2');
// schema → the full JSON Schema object
```

**Resolving from a document's `meta.json`:**

```typescript title="resolve-from-meta.ts"
import { parseSDF } from '@etapsky/sdf-kit';
import { SchemaRegistry } from '@etapsky/sdf-schema-registry';

const registry = new SchemaRegistry();
// ... register schemas ...

const sdf = parseSDF(buffer);
const [type, version] = sdf.meta.schema_id.split('/');
// schema_id example: "invoice/v0.2" → type="invoice", version="v0.2"

const schema = registry.resolve(type, version);
```

### `list()`

Returns all registered schemas grouped by type.

```typescript
registry.list(): Array<{ type: string; versions: string[] }>
```

```typescript title="list-schemas.ts"
const schemas = registry.list();
// [
//   { type: 'invoice', versions: ['v0.1', 'v0.2'] },
//   { type: 'nomination', versions: ['v1.0'] },
//   { type: 'purchase-order', versions: ['v1.0'] },
// ]
```

Versions within each entry are sorted in registration order.

## Error handling

```typescript title="error-handling.ts"
import { SchemaRegistry, SchemaNotFoundError } from '@etapsky/sdf-schema-registry';

const registry = new SchemaRegistry();

try {
  const schema = registry.resolve('invoice', 'v9.9');
} catch (err) {
  if (err instanceof SchemaNotFoundError) {
    console.error(`Schema not found: ${err.type}/${err.version}`);
  }
}
```

## Populating from sdf-server-core

When running `sdf-server-core`, schemas registered via `POST /schemas` are persisted in the database. On startup, the server hydrates a `SchemaRegistry` instance from the stored schemas. The same registry is then used to resolve schemas during document validation and signing.

If you are building a custom consumer, initialize your registry from the same source:

```typescript title="hydrate-from-db.ts"
import { db } from './db/client';
import { SchemaRegistry } from '@etapsky/sdf-schema-registry';

async function buildRegistry(): Promise<SchemaRegistry> {
  const registry = new SchemaRegistry();
  const rows = await db.query.schemaRegistryEntries.findMany({
    where: (t, { eq }) => eq(t.isPublished, true),
  });
  for (const row of rows) {
    registry.register(row.schemaId, row.version, row.schemaJson);
  }
  return registry;
}
```

## Full example

```typescript title="registry-full.ts"
import { SchemaRegistry } from '@etapsky/sdf-schema-registry';
import { validateSchema } from '@etapsky/sdf-kit';

const registry = new SchemaRegistry();
registry.register('invoice', 'v0.1', {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  required: ['invoice_number', 'issue_date', 'total'],
  properties: {
    invoice_number: { type: 'string' },
    issue_date: { type: 'string', format: 'date' },
    total: {
      type: 'object',
      required: ['amount', 'currency'],
      properties: {
        amount: { type: 'string' },
        currency: { type: 'string', pattern: '^[A-Z]{3}$' },
      },
    },
  },
});

const data = {
  invoice_number: 'INV-2026-001',
  issue_date: '2026-03-15',
  total: { amount: '1250.00', currency: 'EUR' },
};

const schema = registry.resolve('invoice', 'v0.1');
const result = validateSchema(data, schema);

console.log(result.valid); // true
```
