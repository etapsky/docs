---
title: "diffSchemas()"
description: "Analyze breaking and non-breaking changes between two SDF schema versions."
sidebar:
  label: "Diff"
  order: 3
---

`diffSchemas()` compares two JSON Schema versions and classifies every structural change as either breaking or non-breaking. Use it before publishing a new schema version to understand the impact on existing SDF documents and consumers.

## Import

```typescript
import { diffSchemas } from '@etapsky/sdf-schema-registry';
```

## Signature

```typescript
diffSchemas(schemaV1: object, schemaV2: object): DiffResult
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `schemaV1` | `object` | The current (old) JSON Schema |
| `schemaV2` | `object` | The new JSON Schema being evaluated |

Returns a `DiffResult` object.

## Return type

```typescript
interface DiffResult {
  breaking: BreakingChange[];
  nonBreaking: NonBreakingChange[];
}

interface BreakingChange {
  type: BreakingChangeType;
  path: string;       // JSON pointer to the changed location
  description: string;
  before?: unknown;
  after?: unknown;
}

interface NonBreakingChange {
  type: NonBreakingChangeType;
  path: string;
  description: string;
  before?: unknown;
  after?: unknown;
}
```

## Breaking vs non-breaking

A change is **breaking** if it can cause a previously valid SDF document to become invalid under the new schema, or if it removes information that consumers may depend on.

| Change | Classification |
|--------|---------------|
| Removing a required field | Breaking |
| Adding a new required field | Breaking |
| Narrowing a field type (e.g. `string` → `enum`) | Breaking |
| Removing an `enum` value | Breaking |
| Decreasing `maxLength` | Breaking |
| Increasing `minLength` | Breaking |
| Removing an optional field from `properties` | Breaking |
| Adding an optional field | Non-breaking |
| Widening a type (e.g. `enum` → `string`) | Non-breaking |
| Adding a new `enum` value | Non-breaking |
| Increasing `maxLength` | Non-breaking |
| Decreasing `minLength` | Non-breaking |
| Adding `description` or `title` | Non-breaking |
| Updating `default` value | Non-breaking |

## Basic usage

```typescript title="diff-versions.ts"
import { diffSchemas } from '@etapsky/sdf-schema-registry';
import invoiceSchemaV1 from './schemas/invoice.v0.1.json';
import invoiceSchemaV2 from './schemas/invoice.v0.2.json';

const result = diffSchemas(invoiceSchemaV1, invoiceSchemaV2);

console.log(`Breaking changes: ${result.breaking.length}`);
console.log(`Non-breaking changes: ${result.nonBreaking.length}`);

for (const change of result.breaking) {
  console.warn(`[BREAKING] ${change.path}: ${change.description}`);
}

for (const change of result.nonBreaking) {
  console.log(`[OK] ${change.path}: ${change.description}`);
}
```

## Example output

Given a schema update that:
1. Adds a new required field `payment_terms`
2. Adds an optional field `notes`
3. Adds a new `description` to the `invoice_number` field

```typescript title="diff-output-example.ts"
const result = diffSchemas(v1, v2);

// result.breaking → [
//   {
//     type: 'required-field-added',
//     path: '/required',
//     description: "New required field 'payment_terms' added",
//     before: ['invoice_number', 'issue_date', 'total'],
//     after: ['invoice_number', 'issue_date', 'total', 'payment_terms'],
//   }
// ]

// result.nonBreaking → [
//   {
//     type: 'optional-field-added',
//     path: '/properties/notes',
//     description: "Optional field 'notes' added",
//   },
//   {
//     type: 'description-changed',
//     path: '/properties/invoice_number/description',
//     description: "Field description updated",
//     before: undefined,
//     after: 'Supplier-assigned invoice identifier',
//   },
// ]
```

## Gating schema publication

A common pattern is to block publication of new schema versions that contain breaking changes unless explicitly approved:

```typescript title="publish-gate.ts"
import { diffSchemas } from '@etapsky/sdf-schema-registry';

async function publishSchema(
  type: string,
  version: string,
  newSchema: object,
  currentSchema: object,
  options: { allowBreaking?: boolean } = {},
) {
  const diff = diffSchemas(currentSchema, newSchema);

  if (diff.breaking.length > 0 && !options.allowBreaking) {
    throw new Error(
      `Cannot publish ${type}/${version}: ${diff.breaking.length} breaking change(s) detected.\n` +
      diff.breaking.map((c) => `  - ${c.path}: ${c.description}`).join('\n'),
    );
  }

  // proceed with registration
  registry.register(type, version, newSchema);
}
```

## Checking schema compatibility before migration

`diffSchemas()` pairs naturally with `MigrationEngine`. Use the diff to verify you have a migration path before deploying a breaking change:

```typescript title="diff-before-migrate.ts"
import { diffSchemas, MigrationEngine } from '@etapsky/sdf-schema-registry';

const diff = diffSchemas(schemaV1, schemaV2);

if (diff.breaking.length > 0) {
  // Ensure a migration is registered before proceeding
  const engine = new MigrationEngine();
  engine.addMigration('invoice', 'v0.1', 'v0.2', (data) => ({
    ...data,
    payment_terms: data.payment_terms ?? 'NET_30',
  }));

  // Safe to migrate existing documents
  const migrated = engine.migrate(legacyData, 'invoice', 'v0.1', 'v0.2');
}
```
