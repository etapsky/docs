---
title: "SAML 2.0 SSO"
description: "Configure SAML 2.0 SP-initiated SSO for enterprise identity providers."
sidebar:
  label: "SAML SSO"
  order: 5
---

SDF Server acts as a **SAML 2.0 Service Provider (SP)**. Enterprise tenants can authenticate their users through a corporate Identity Provider (IdP) such as Okta, Microsoft Entra ID (Azure AD), OneLogin, or Google Workspace.

## How SP-initiated SSO works

1. The user navigates to `GET /saml/login`.
2. SDF Server redirects the user to the tenant's configured IdP.
3. The user authenticates at the IdP.
4. The IdP posts a signed SAML Response back to `POST /saml/acs`.
5. SDF Server validates the signature, extracts the user identity, and issues a JWT.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/saml/metadata` | SP metadata XML — give this to your IdP administrator |
| `GET` | `/saml/login` | Begin SP-initiated SSO (redirects to IdP) |
| `POST` | `/saml/acs` | Assertion Consumer Service — receives the SAML Response from IdP |

## Configuration

Enable SAML SSO for a tenant by providing the IdP metadata URL and the SP entity ID through the Admin API:

```http
PUT /admin/tenants/:tenantId
Authorization: Bearer <admin_jwt>

{
  "saml_enabled": true,
  "saml_metadata_url": "https://your-idp.example.com/metadata.xml",
  "saml_entity_id": "https://sdf.your-company.com/saml/metadata"
}
```

| Field | Description |
|-------|-------------|
| `saml_enabled` | Enable SAML for this tenant |
| `saml_metadata_url` | URL of the IdP's SAML metadata XML |
| `saml_entity_id` | The SP entity ID to present to the IdP — typically the metadata URL of your SDF Server |

## Setting up the IdP

1. **Download SP metadata** from `GET /saml/metadata`. This XML contains the SP entity ID, ACS URL, and public key.
2. **Register the SP** in your IdP (Okta, Azure AD, etc.) using the SP metadata XML.
3. **Map attributes:** Configure your IdP to include the user's email address in the SAML assertion as `NameID` (format: `urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress`).
4. **Copy the IdP metadata URL** from your IdP and set it as `saml_metadata_url` in the tenant configuration.

### Okta

In the Okta Admin Console:
- Application type: **SAML 2.0**
- Single sign-on URL: `https://your-sdf-server/saml/acs`
- Audience URI (SP Entity ID): `https://your-sdf-server/saml/metadata`
- Name ID format: **EmailAddress**

### Microsoft Entra ID (Azure AD)

In the Azure Portal under **Enterprise Applications → New application → Create your own**:
- Reply URL (ACS): `https://your-sdf-server/saml/acs`
- Identifier (Entity ID): `https://your-sdf-server/saml/metadata`
- User attributes: set `user.mail` as the claim source for the NameID

## Security

- SAML Response signatures are validated in strict mode. Unsigned or improperly signed responses are rejected.
- IdP metadata is fetched once at startup and cached. Restart SDF Server after rotating IdP signing certificates.
- After successful SAML authentication, SDF Server issues a short-lived JWT (8-hour TTL) using the same mechanism as API key auth. The user session is subject to the same rate limits as other tenant traffic.

## Troubleshooting

**`SAML signature validation failed`** — The IdP certificate in the SAML Response does not match the certificate in the IdP metadata. Confirm the IdP metadata URL is correct and the IdP has not rotated its signing certificate since SDF Server last fetched the metadata.

**Redirect loop at `/saml/login`** — Check that `saml_metadata_url` is reachable from your SDF Server host. Firewall rules may block outbound HTTPS to the IdP.

**User not found after SAML login** — SDF Server creates or updates the user record on first SSO login. Confirm the IdP is sending the email in the NameID field.
