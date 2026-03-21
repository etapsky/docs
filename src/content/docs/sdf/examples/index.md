---
title: "Examples"
description: "Working SDF examples for common document types — B2B invoices, nominations, purchase orders, and B2G government forms."
sidebar:
  label: "Overview"
  order: 1
---

This section contains complete, production-quality SDF examples for the most common document types. Each example includes `meta.json`, `data.json`, and producer code in TypeScript and Python.

## B2B examples

| Example | Document type | Use case |
|---------|--------------|----------|
| [Invoice (B2B)](/sdf/examples/invoice) | `invoice` | Supplier billing — Acme Supplies GmbH → Global Logistics AG |
| [Nomination](/sdf/examples/nomination) | `nomination` | Supplier confirms goods dispatch per a purchase order |
| [Purchase Order](/sdf/examples/purchase-order) | `purchase_order` | Buyer issues a structured purchase order to a supplier |

## B2G / G2G examples

| Example | Document type | Use case |
|---------|--------------|----------|
| [Tax Declaration](/sdf/examples/gov-tax-declaration) | `tax_declaration` | Company submits VAT or corporate tax return to a tax authority |
| [Customs Declaration](/sdf/examples/gov-customs-declaration) | `customs_declaration` | Import/export customs filing |
| [Permit Application](/sdf/examples/gov-permit-application) | `permit_application` | Company applies for an operating or construction permit |
| [Health Report](/sdf/examples/gov-health-report) | `health_report` | Healthcare provider submits a report to a public health authority (B2G / G2G) |

## Reference files

All examples correspond to the reference `.sdf` files in [`spec/examples/`](https://github.com/etapsky/sdf/tree/main/spec/examples) and the proof-of-concept archives in [`spec/poc/`](https://github.com/etapsky/sdf/tree/main/spec/poc).
