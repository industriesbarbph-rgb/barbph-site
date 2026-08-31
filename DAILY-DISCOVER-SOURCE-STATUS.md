# Daily Discover Source Status

Current reconciliation: **2026-08-31 (Manila)**

This file is the current source-accounting record. Earlier 15-entry snapshots are preserved below as historical context rather than deleted.

## Current accounting

The live `Theme Sources` configuration currently contains **21 configured source entries**.

- **11 enabled + production-ready**
- **10 disabled / held / building / parked / pending / ingestion-required**
- **Barb Originals is separate** and remains the emergency reserve

## Enabled + production-ready

| Source | Region | Status |
| --- | --- | --- |
| The Met Open Access | Global / USA | PRODUCTION_READY |
| NASA | Global / USA | PRODUCTION_READY |
| Smithsonian Open Access | Global / USA | PRODUCTION_READY |
| Library of Congress | USA | PRODUCTION_READY |
| NOAA | USA | PRODUCTION_READY |
| USGS | USA | PRODUCTION_READY |
| Art Institute of Chicago | USA | PRODUCTION_READY |
| Cleveland Museum of Art | USA | PRODUCTION_READY |
| National Gallery of Art | USA | PRODUCTION_READY |
| NHCP National Memory Project | Philippines | PRODUCTION_READY |
| National Heritage Board Singapore | Singapore | PRODUCTION_READY |

## Disabled / not in automatic production

| Source | Status | Current reason / unlock condition |
| --- | --- | --- |
| Europeana | HOLD | Complete rights/API verification and live adapter proof. |
| New York Public Library | HOLD | Complete API access and live retrieval proof. |
| Biodiversity Heritage Library | HOLD | Complete API access and public-domain-only retrieval proof. |
| Getty Open Content | HOLD | Finish rights filtering and live retrieval validation. |
| Wildcard | HOLD | Create a pre-approved rights-safe catalogue. |
| National Diet Library | BUILDING | Finish NDL Image Bank adapter and pass live/rights tests. |
| National Folk Museum of Korea | PARKED | Revisit later and obtain approved API access if activation is desired. |
| National Palace Museum | PENDING_API_KEY | Finish the open-data/CC0 retrieval path and pass live proof; API key only if still needed. |
| Old Photos of Hong Kong | INGESTION_REQUIRED | Build/import the rights-cleared photo catalogue and pass continuous-stream testing. |
| Khastara / National Library of Indonesia | BUILDING | Build a verified rights-cleared catalogue subset and pass retrieval testing. |

## Eligibility rule

The continuous engine does not use a fixed hard-coded list of nine sources anymore. Runtime eligibility is status-driven.

A source enters the automatic pool only when:

- `enabled=yes`
- weight is above zero
- `adapter_key` exists
- `production_status` is `PRODUCTION_READY` or `PRODUCTION`

The readiness endpoint flags a source that is enabled while not production-ready or missing an adapter.

## Barb Originals reserve

Barb Originals is not one of the 21 Theme Sources entries and does not compete by weight. It is the safety reserve used after same-source continuity options are exhausted or when an Admin hold prevents continued institutional serving.

## Historical source accounting

### 2026-08-20 snapshot

At that stage the architecture was documented as 15 accounted entries: nine lab-success public sources, five parked/waiting public worlds, and Barb Originals as reserve.

That snapshot remains useful history but is no longer the current inventory. New Asian/public-data source work and the continuous engine expanded the configured source catalogue after that date.
