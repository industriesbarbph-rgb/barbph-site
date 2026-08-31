# BarbPH Site Repository

Current-state map reconciled: **2026-08-31 (Manila)**

This repository contains the current BarbPH public site, production infrastructure, control integrations, internal diagnostics, and historical build evidence.

## Start here

For current production truth, read **`BARBPH-SOURCE-OF-TRUTH.md` first**. Dated launch notes and older implementation specs remain in the repository as historical evidence and are not erased when the architecture evolves.

## Current production surfaces

- Homepage: `/`
- Products: `/products`
- Programs: `/programs`
- Publications: `/publications`
- Partnerships: `/partnership`
- Systems & Transmission Logs: opened from the homepage Systems control; `/systems` redirects into that homepage view
- EE / Everything Else: an external published Google Slides destination linked from the homepage tab

## Control architecture

BarbPH is not only a set of static pages. Current production combines:

- the `barbph-admin` Google Sheet for Products, Programs, Publications, The Bulletin, Theme Sources, Sponsor Takeovers, Theme Override, Partnership Config, Barb Originals, and related controls;
- this `barbph-site` repository for the public site, browser controllers, Netlify Functions, documentation, and diagnostic surfaces;
- the separate public `barbph-media` repository for product/program/media assets;
- Netlify Functions and Netlify Blobs for live control reads, continuous source state, health, history, and the Systems ledger.

## Products and Programs catalog

Products and Programs have two complementary paths:

1. **Live path:** the pages request `/.netlify/functions/catalog-feed`, so published Admin Sheet changes can be reflected when a visitor loads the page.
2. **Static fallback / source sync:** `.github/workflows/rebuild.yml` runs the catalog builder hourly and updates the generated card blocks only when the Sheet-backed HTML changes.

The August 31 reconciliation repairs the catalog builder for the repository's ES-module configuration and fixes Programs live rendering so `photo_url` is actually rendered instead of being discarded.

## Homepage priority

The locked homepage priority remains:

1. Sponsor Takeover
2. Theme Override
3. Daily Discover

When the first two controls do not win, the homepage hands off to the continuous Daily Discover public stream.

## Daily Discover continuous source engine

Daily Discover is now a continuous source-of-the-day system rather than the earlier fixed three-image daily-set architecture.

The live `Theme Sources` configuration currently accounts for **21 configured source entries**:

- **11 enabled and production-ready**
- **10 disabled, held, building, parked, pending, or awaiting ingestion**

Barb Originals is separate from those 21 entries and remains the emergency reserve.

The current engine uses one scheduled source for the Manila day, configurable continuous batches, same-source last-known-good caching, retry backoff, an Admin hold/kill-switch path, Barb Originals fallback, persistent history, and Watchtower resynchronization.

See `DAILY-DISCOVER-SOURCE-STATUS.md`, `DAILY-DISCOVER-PRODUCTION-ENGINE.md`, `DAILY-DISCOVER-PRODUCTION-READINESS.md`, and `DAILY-DISCOVER-EMERGENCY-RESERVE.md`.

## Watchtower

Watchtower remains a separate live observation destination and also appears as an hourly BarbPH interlude. The homepage preloads it around the top of the hour, allows a bounded loading window, shows the interlude for the configured period, unloads it afterward, and requests a Daily Discover resynchronization on return.

## Systems & Transmission Logs

BarbPH now maintains a public operational paper trail for the source/transmission machinery. The ledger records sanitized system events such as source selection, batch refresh, degradation, cache use, fallback, recovery, Watchtower transitions, Admin hold events, and unresolved conditions.

The public permanent Systems history begins **2026-08-30**. Internal diagnostics may retain more technical detail than the public ledger.

## Historical architecture is intentionally retained

The repository still contains Satellite tab files, the mechanical Transmission Register work, older fixed-set Daily Discover functions/tests, and dated launch-hardening records. These are retained to show how BarbPH evolved.

Current public architecture supersedes the old Satellite live-telecast tab. The Satellite UI was removed from the homepage on August 30, while its files remain as historical implementation evidence.

## Documentation classes

### Current-state documents

- `BARBPH-SOURCE-OF-TRUTH.md`
- `README.md`
- `DAILY-DISCOVER-SOURCE-STATUS.md`
- `DAILY-DISCOVER-PRODUCTION-ENGINE.md`
- `DAILY-DISCOVER-PRODUCTION-READINESS.md`
- `DAILY-DISCOVER-EMERGENCY-RESERVE.md`
- `HOMEPAGE-PRIORITY-CONTROLLER.md`
- `SEO-SITEWIDE-PLUMBING.md`

### Historical evidence

Dated launch/audit files and superseded Satellite/fixed-set implementation material remain useful for chronology. Do not reinterpret them as current production truth.

### Planned / not production

`GLOBAL-SKY-WORLD-TIME-SPEC.md` remains a planned concept. A planned spec does not become production merely because it exists in the repository.

## Guardrails

- A source name in the Admin Sheet does not make it production-eligible.
- Production requires `enabled=yes`, positive weight, an adapter key, and a production-ready status.
- Disabled/held/unverified worlds must not leak into automatic rotation.
- Barb Originals is reserve protection, not an ordinary weighted institutional source.
- Lab state must remain isolated from production state.
- Historical files are not deleted merely because a newer architecture supersedes them.
