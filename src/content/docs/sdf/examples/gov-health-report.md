---
title: "Health Report Example (B2G / G2G)"
description: "An SDF health report submitted by a healthcare provider to a public health authority, or exchanged between health authorities (G2G)."
sidebar:
  label: "Health Report (B2G/G2G)"
  order: 8
---

A **health report** SDF document is used in two scenarios:

- **B2G:** A hospital or healthcare provider submits an epidemiological or patient statistics report to a national or regional public health authority.
- **G2G:** One public health authority shares anonymized aggregated data with another (e.g., a regional health office reporting to a federal authority, or cross-border disease surveillance).

This example shows a weekly influenza surveillance report submitted from a regional hospital group to a national health authority.

## meta.json

```json title="meta.json"
{
  "sdf_version": "0.1",
  "document_id": "f7a8b9c0-1234-4ef0-f012-666666666666",
  "document_type": "health_report",
  "schema_id": "health_report/v0.1",
  "issuer": "München Klinik gGmbH",
  "issuer_id": "DE-KLINIK-MUC-001",
  "created_at": "2026-03-21T06:00:00+01:00",
  "recipient": "Robert Koch-Institut"
}
```

## data.json

```json title="data.json"
{
  "document_type": "health_report",
  "report_number": "SURV-2026-W12-MUC-001",
  "report_type": "influenza_surveillance",
  "reporting_period": {
    "week": 12,
    "year": 2026,
    "from": "2026-03-16",
    "to": "2026-03-22"
  },
  "reporter": {
    "name": "München Klinik gGmbH",
    "id": "DE-KLINIK-MUC-001",
    "type": "hospital_group",
    "region": "Bavaria",
    "country": "DE"
  },
  "recipient_authority": {
    "name": "Robert Koch-Institut",
    "country": "DE",
    "department": "Abteilung für Infektionskrankheiten"
  },
  "summary": {
    "total_cases_examined": 312,
    "influenza_a_confirmed": 47,
    "influenza_b_confirmed": 12,
    "influenza_negative": 253,
    "hospitalizations": 8,
    "icu_admissions": 1,
    "fatalities": 0
  },
  "age_distribution": [
    { "age_group": "0-4", "cases": 9 },
    { "age_group": "5-14", "cases": 11 },
    { "age_group": "15-59", "cases": 24 },
    { "age_group": "60+", "cases": 15 }
  ],
  "vaccination_status": {
    "vaccinated": 18,
    "unvaccinated": 38,
    "unknown": 3
  },
  "notes": "Slight increase in A(H3N2) detections compared to week 11. No unusual severity observed.",
  "submission_date": "2026-03-21"
}
```

## Privacy and data protection

All data in this example is **anonymized and aggregated**. SDF health reports must never include individual patient identifiers (names, dates of birth, insurance IDs) unless the schema and jurisdiction explicitly require them and appropriate data protection measures are in place.

When personally identifiable health data is required by law, consult your data protection officer and apply appropriate access controls at the SDF Server layer before transmission.

## G2G usage

For government-to-government data exchange, both sides operate SDF Server instances. The sending authority produces and signs the health report SDF; the receiving authority's SDF Server validates the signature and imports the structured data directly into their surveillance system.

```bash
sdf validate health_report.sdf
sdf sign health_report.sdf --key-id g2g-signing-key
sdf verify health_report.sdf
```
