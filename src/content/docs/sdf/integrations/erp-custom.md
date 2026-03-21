---
title: "Custom ERP Integration"
description: "Build a custom ERP connector by implementing the IERPConnector interface."
sidebar:
  label: "Custom ERP"
  order: 6
---

If your ERP system is not SAP S/4HANA or Oracle Fusion Cloud, you can implement a custom connector by satisfying the `IERPConnector` interface and registering it with `ConnectorRegistry`.

## `IERPConnector` interface

```typescript title="packages/sdf-server-core/src/connectors/base/types.ts"
export interface IERPConnector {
  /**
   * Fetch document data from the ERP by external reference.
   * Returns a plain object that will be merged with SDF data.json.
   */
  fetch(documentRef: string): Promise<Record<string, unknown>>;

  /**
   * Push SDF data to the ERP.
   * @param documentId - SDF document UUID
   * @param data       - Transformed data.json content
   */
  push(documentId: string, data: Record<string, unknown>): Promise<void>;

  /**
   * Test connectivity and authentication.
   * Resolves on success, rejects with a descriptive error on failure.
   */
  healthCheck(): Promise<void>;
}
```

## `ERPHttpClient` base class

`ERPHttpClient` handles OAuth2 token caching, timeout, and retry logic for you. Extend it instead of writing raw `fetch()` calls:

```typescript title="packages/sdf-server-core/src/connectors/base/http-client.ts"
export abstract class ERPHttpClient {
  constructor(protected config: ConnectorConfig) {}

  /** Authenticated GET — token refresh handled automatically */
  protected async get<T>(path: string): Promise<T>;

  /** Authenticated POST */
  protected async post<T>(path: string, body: unknown): Promise<T>;

  /** Authenticated PUT */
  protected async put<T>(path: string, body: unknown): Promise<T>;
}
```

**Default behavior:**
- Timeout: 30 seconds
- Retry: exponential backoff on `429` and `5xx`, up to 3 attempts
- OAuth2 tokens are cached in memory and refreshed 60 seconds before expiry
- No external dependencies — uses native `fetch()`

## `FieldMapper`

`FieldMapper` translates between SDF `data.json` field paths and ERP API field names. Transformations can be plain renames or functions:

```typescript title="packages/sdf-server-core/src/connectors/base/field-mapper.ts"
export type FieldMapping = {
  [sdfPath: string]: string | { path: string; transform: (v: unknown) => unknown };
};

export class FieldMapper {
  constructor(private mapping: FieldMapping) {}

  /** SDF data.json → ERP payload */
  transform(data: Record<string, unknown>): Record<string, unknown>;

  /** ERP payload → SDF data.json */
  reverse(erpData: Record<string, unknown>): Record<string, unknown>;
}
```

## Full working example

```typescript title="src/connectors/my-erp/connector.ts"
import {
  IERPConnector,
  ERPHttpClient,
  FieldMapper,
  ConnectorConfig,
} from '@etapsky/sdf-server-core';

const MY_ERP_MAPPING = {
  'data.invoice_number': 'docNumber',
  'data.totals.gross.amount': 'totalAmount',
  'data.totals.gross.currency': 'currency',
  'data.issue_date': {
    path: 'documentDate',
    transform: (v: unknown) => String(v).replace(/-/g, ''),  // ISO → YYYYMMDD
  },
};

export class MyERPConnector extends ERPHttpClient implements IERPConnector {
  private mapper = new FieldMapper(MY_ERP_MAPPING);

  constructor(config: ConnectorConfig) {
    super(config);
  }

  async fetch(documentRef: string): Promise<Record<string, unknown>> {
    const erpDoc = await this.get<Record<string, unknown>>(
      `/api/documents/${documentRef}`
    );
    return this.mapper.reverse(erpDoc);
  }

  async push(documentId: string, data: Record<string, unknown>): Promise<void> {
    const erpPayload = this.mapper.transform(data);
    await this.post('/api/documents', {
      ...erpPayload,
      sdfRef: documentId,
    });
  }

  async healthCheck(): Promise<void> {
    await this.get('/api/ping');
  }
}
```

## Registering the connector

Register your connector factory at server startup, before routes are mounted:

```typescript title="apps/sdf-server/src/index.ts"
import { ConnectorRegistry } from '@etapsky/sdf-server-core';
import { MyERPConnector } from './connectors/my-erp/connector.js';

ConnectorRegistry.registerFactory(
  'my-erp',
  (config) => new MyERPConnector(config)
);
```

Once registered, tenants can configure it via the Connector API using `"erp_type": "my-erp"`:

```http
POST /connectors/configure

{
  "erp_type": "my-erp",
  "name": "My Custom ERP (Production)",
  "base_url": "https://erp.internal.example.com",
  "auth_type": "oauth2",
  "credentials": { ... }
}
```

## Security requirements

- Never store plaintext credentials. Pass them through the standard `credentials` field in the configure endpoint — they are encrypted with AES-256-GCM by SDF Server before storage.
- Do not add `@aws-sdk/*` or other external HTTP clients as dependencies. Use `ERPHttpClient` (which uses native `fetch()`) for all outbound calls.
- Connector instances are scoped to a `tenant_id`. Never allow data from one tenant to flow into another tenant's connector.
