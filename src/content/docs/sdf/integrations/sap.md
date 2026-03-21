---
title: "SAP S/4HANA Integration"
description: "Connect SDF Server to SAP S/4HANA using OData v4. Field mapping, document types, and configuration."
sidebar:
  label: "SAP S/4HANA"
  order: 2
---

The SAP S/4HANA connector uses the **OData v4** API to exchange SDF documents with SAP. It supports supplier invoices, purchase orders, and delivery notes (nominations).

## Prerequisites

- SAP S/4HANA Cloud or on-premises with OData v4 enabled
- A dedicated SAP service user (`sdf_service_user` or equivalent) with API access to the relevant OData services
- Network connectivity from your SDF Server host to the SAP host on port 8443 (or the port your SAP OData gateway uses)

## Configuration

### Environment variables

Set the following environment variables on your SDF Server:

```bash title=".env"
SAP_HOST=https://your-sap-host:8443
SAP_CLIENT=100
SAP_USERNAME=sdf_service_user
SAP_PASSWORD=your-password
```

### Registering the connector via the API

```http
POST /connectors/configure
Authorization: X-API-Key: sdf_k...

{
  "erp_type": "SAP",
  "name": "Production SAP S/4HANA",
  "base_url": "https://your-sap-host:8443",
  "auth_type": "oauth2",
  "credentials": {
    "client_id": "...",
    "client_secret": "...",
    "token_url": "https://your-sap-host:8443/sap/bc/sec/oauth2/token"
  }
}
```

The `credentials` object is encrypted with AES-256-GCM before being stored. The plaintext value is discarded immediately after encryption.

### OAuth2 vs Basic auth

OAuth2 (`"auth_type": "oauth2"`) is strongly recommended. Basic auth is supported for legacy on-premises deployments that do not expose an OAuth2 token endpoint.

## How it works

When you call `POST /connectors/push-to-erp/:id`, the connector:

1. Downloads the `.sdf` file from object storage.
2. Extracts `data.json`.
3. Transforms SDF fields to SAP field names using the field mapper (see table below).
4. Posts the resulting payload to the appropriate SAP OData entity.

The connector automatically caches OAuth2 access tokens and refreshes them before expiry. All HTTP calls use a 30-second timeout with exponential backoff retry (attempts: 3) on `429` and `5xx` responses.

## Field mapping

SDF `data.json` field paths map to SAP OData fields as follows:

| SDF field | SAP OData field | Notes |
|-----------|----------------|-------|
| `data.invoice_number` | `SupplierInvoiceID` | |
| `data.totals.gross.amount` | `GrossAmount` | String in SDF, decimal in SAP |
| `data.totals.gross.currency` | `TransactionCurrency` | ISO 4217 code |
| `data.issue_date` | `DocumentDate` | SAP format: `YYYYMMDD` (converted automatically) |
| `data.issuer.id` | `Supplier` | SAP vendor ID |
| `data.recipient.id` | `CompanyCode` | SAP company code |
| `data.order_ref` | `PurchaseOrder` | Optional |

> **Date format:** SAP OData v4 uses `YYYYMMDD` for date fields — not ISO 8601. The connector converts automatically. If you are building a custom connector, be aware of this difference. Oracle Fusion uses ISO 8601.

## Supported document types

| SAP Object | SDF `document_type` |
|---|---|
| Supplier Invoice (`A_SupplierInvoice`) | `invoice` |
| Purchase Order (`A_PurchaseOrder`) | `purchase_order` |
| Delivery Note / Outbound Delivery | `nomination` |

## Health check

```http
GET /connectors/health
Authorization: X-API-Key: sdf_k...
```

Returns `{ "status": "healthy" }` if SDF Server can reach the SAP OData gateway and authenticate successfully. The result is cached for 60 seconds and stored in `connector_configs.health_status`.

## Troubleshooting

**`ECONNREFUSED` on health check** — Verify `SAP_HOST` is reachable from your SDF Server host. Check firewall rules and SAP OData gateway configuration.

**`401 Unauthorized` from SAP** — Confirm the service user credentials and that the OAuth2 scope includes the required OData services.

**`400 Bad Request` on push** — Check the SAP application log. Common cause: a required SAP field has no mapping in `data.json`. Add the field to `data.json` or extend the field mapper.
