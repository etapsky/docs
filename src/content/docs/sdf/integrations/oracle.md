---
title: "Oracle Fusion Cloud Integration"
description: "Connect SDF Server to Oracle Fusion Cloud using REST API."
sidebar:
  label: "Oracle Fusion"
  order: 3
---

The Oracle Fusion Cloud connector uses the **Oracle Fusion Cloud REST API** to exchange SDF documents with Oracle ERP.

## Prerequisites

- Oracle Fusion Cloud ERP with REST API access enabled
- An Oracle integration user with the `Accounts Payable Manager` (or equivalent) role
- OAuth2 client credentials issued from your Oracle Identity Cloud Service (IDCS) or Oracle Access Manager

## Configuration

### Registering the connector via the API

```http
POST /connectors/configure
Authorization: X-API-Key: sdf_k...

{
  "erp_type": "ORACLE",
  "name": "Production Oracle Fusion",
  "base_url": "https://your-oracle-instance.oraclecloud.com",
  "auth_type": "oauth2",
  "credentials": {
    "client_id": "...",
    "client_secret": "...",
    "token_url": "https://your-idcs-instance.identity.oraclecloud.com/oauth2/v1/token",
    "scope": "urn:opc:resource:consumer::all"
  }
}
```

Credentials are encrypted with AES-256-GCM before storage. The connector caches OAuth2 tokens and refreshes them before expiry.

## How it works

When you call `POST /connectors/push-to-erp/:id`, the connector:

1. Downloads the `.sdf` file from object storage.
2. Extracts `data.json`.
3. Transforms SDF fields to Oracle REST API field names using the field mapper.
4. Posts the payload to the appropriate Oracle REST endpoint (e.g., `/fscmRestApi/resources/11.13.18.05/invoices`).

All HTTP calls use a 30-second timeout with exponential backoff retry (attempts: 3) on `429` and `5xx` responses.

## Field mapping

SDF `data.json` fields map to Oracle Fusion REST API fields as follows:

| SDF field | Oracle REST field | Notes |
|-----------|-------------------|-------|
| `data.invoice_number` | `InvoiceNumber` | |
| `data.totals.gross.amount` | `InvoiceAmount` | String in SDF, number in Oracle |
| `data.totals.gross.currency` | `InvoiceCurrencyCode` | ISO 4217 code |
| `data.issue_date` | `InvoiceDate` | ISO 8601 (`YYYY-MM-DD`) — no conversion needed |
| `data.due_date` | `PaymentDueDate` | ISO 8601 |
| `data.issuer.id` | `SupplierNumber` | Oracle supplier number |
| `data.issuer.name` | `SupplierName` | |
| `data.recipient.id` | `BusinessUnit` | Oracle business unit code |
| `data.order_ref` | `PONumber` | Optional |

> **Date format:** Oracle Fusion uses ISO 8601 (`YYYY-MM-DD`), which matches SDF's native date format. No conversion is required, unlike the SAP connector which uses `YYYYMMDD`.

## Supported document types

| Oracle REST resource | SDF `document_type` |
|---|---|
| `/invoices` (Payables) | `invoice` |
| `/purchaseOrders` | `purchase_order` |
| `/receipts` | `nomination` |

## Health check

```http
GET /connectors/health
Authorization: X-API-Key: sdf_k...
```

Returns `{ "status": "healthy" }` if SDF Server can reach the Oracle REST endpoint and obtain a valid OAuth2 token. The result is cached for 60 seconds.

## Troubleshooting

**`401 Unauthorized`** — Verify the OAuth2 client credentials and that the scope includes access to the target REST resources.

**`403 Forbidden`** — The integration user lacks the required role. Assign `Accounts Payable Manager` (for invoices) or `Purchasing Manager` (for purchase orders) in Oracle.

**`422 Unprocessable Entity`** — A required Oracle field has no value in `data.json`. Check the Oracle error response body for the specific field name, then add it to your SDF `data.json` or extend the field mapper.
