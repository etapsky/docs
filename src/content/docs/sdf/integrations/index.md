---
title: "Integrations"
description: "Connect SDF Server to enterprise ERP systems, configure webhooks, and set up SAML SSO."
sidebar:
  label: "Overview"
  order: 1
---

SDF Server integrates with enterprise systems out of the box. This section covers all available integration points.

## ERP Connectors

SDF Server ships with connectors for the two most widely deployed ERP platforms. Documents uploaded to SDF Server can be matched against existing ERP records, pushed directly into ERP workflows, or enriched with ERP metadata.

| Connector | Protocol | Auth | Guide |
|-----------|----------|------|-------|
| SAP S/4HANA | OData v4 | OAuth2 / Basic | [SAP S/4HANA](/sdf/integrations/sap) |
| Oracle Fusion Cloud | REST API | OAuth2 | [Oracle Fusion](/sdf/integrations/oracle) |
| Custom ERP | HTTP (any) | Configurable | [Custom ERP](/sdf/integrations/erp-custom) |

Connector credentials are stored encrypted at rest using AES-256-GCM. Plaintext credentials never touch the database.

## Webhooks

SDF Server can push real-time event notifications to any HTTP endpoint when documents are uploaded, validated, signed, or deleted. Payloads are signed with HMAC-SHA256 so your receiver can verify authenticity.

See [Webhooks](/sdf/integrations/webhook).

## SAML 2.0 SSO

Enterprise tenants can authenticate via their corporate identity provider (IdP) using SAML 2.0 SP-initiated SSO. Compatible with Okta, Azure AD (Microsoft Entra ID), OneLogin, Google Workspace, and any SAML 2.0-compliant IdP.

See [SAML SSO](/sdf/integrations/saml-sso).

## Architecture note

All integration configuration is tenant-scoped. One SDF Server instance can serve multiple tenants, each with independent ERP connections, webhook endpoints, and IdP configurations. No cross-tenant data leakage is architecturally possible.
