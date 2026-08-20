# BarbPH Site Repository

This repository contains the current BarbPH public pages, internal labs, homepage infrastructure, and locked implementation specs.

## Start here

For the current state of the project, read **`BARBPH-SOURCE-OF-TRUTH.md` first**. It records what is implemented, what is locked, what is intentionally off, and what is only planned.

## Core specs

- `BARBPH-SOURCE-OF-TRUTH.md` — master current-state record
- `TICKER-BONES-SPEC.md` — approved exchange-board ticker interaction and layout
- `ALIVE-FAB-SPEC.md` — approved 3P FAB interaction; final skin still pending
- `GLOBAL-SKY-WORLD-TIME-SPEC.md` — approved concept, not yet implemented
- `HOMEPAGE-PRIORITY-CONTROLLER.md` — Sponsor > Theme Override > Daily Discover logic
- `DAILY-DISCOVER-PRODUCTION-ENGINE.md` — Daily Discover production engine
- `DAILY-DISCOVER-EMERGENCY-RESERVE.md` — Barb Originals emergency reserve policy
- `DAILY-DISCOVER-SOURCE-STATUS.md` — current source-world accounting
- `DAILY-DISCOVER-PRODUCTION-READINESS.md` — readiness rules
- `DIAGNOSTIC-HARDENING.md` — internal safety/diagnostic layer
- `SEO-SITEWIDE-PLUMBING.md` — crawl/indexing policy and Search Console handoff

## Important guardrails

- There is intentionally **no official `index.html` homepage yet**.
- Daily Discover must remain **unarmed** until explicitly approved.
- Parked/unverified source worlds must not enter production rotation.
- Barb Originals is an **emergency reserve**, not a normal weighted public source world.
- Internal labs remain `noindex,nofollow` and excluded from the sitemap.
- Patroller work remains gated until the Daily Discover source-world phase is considered ready.

## Internal labs

Current internal lab pages include the Daily Discover source lab, Production Gate lab, Homepage Priority lab, Alive FAB prototype, Ticker Bones prototype, and Safe System Diagnostics. These are test surfaces only and are not the future BarbPH homepage.
