# Meanwhile, Around the World — Active Build Spec

Status: **implementation underway off-production**.

## Core behavior
- The normal BarbPH state remains the scheduled 24-hour theme.
- Every 4 hours, a 2-minute interlude may replace the theme with **Meanwhile, Around the World**.
- The interlude is a simultaneous mosaic of real current city cameras, not one city at a time.
- There is no fixed city roster.
- The eligible pool is whatever feeds are **cleared + enabled + healthy** at that moment.
- Selection should deliberately seek contrast across local day/night, time zones, hemispheres, and truthful seasonal context where available.
- The system must never invent or force a four-season label for locations where that model is inappropriate.

## Feed admission
A feed may enter the active pool only after:
1. the source is genuinely current/live;
2. an embeddable path is available;
3. BarbPH's use is permitted by the provider/source terms;
4. required attribution is preserved;
5. the feed is technically healthy enough for the interlude.

A provider can be discovered automatically, but a newly discovered feed does not become cleared automatically.

## Initial implementation pool
The first registry includes cleared feeds for London, Venice, Tokyo, and Buenos Aires, plus Auckland as a candidate held disabled because the published no-cost embed permission is narrower than BarbPH's confirmed use case.

The registry is not a permanent city list. It is only the current cleared/candidate state.

## Viewer behavior
- Up to 9 eligible feeds may appear simultaneously in the prototype mosaic.
- Each tile preserves provider attribution.
- Each tile calculates current local clock time from its IANA time zone.
- Day/night is derived from local clock hour for prototype contrast selection only; it is not a weather claim.
- Temperate season labels are hemisphere-aware calendar context, not live weather observations.
- The viewer must not claim rain, snow, cloud, temperature, or other current conditions unless a separate verified current-data source is added.

## Interlude timing
- Cadence: every 4 hours.
- Duration: 120 seconds.
- Production scheduling must use a stable shared definition of the interlude window so visitors do not receive contradictory states.
- The prototype supports `?preview=1` to force the mosaic outside the production window.

## Transmission Ledger
Public route: `/transmission-ledger/`.

The ledger records **what actually aired**, not merely what was scheduled or attempted.

A public event may be created only after the interlude is confirmed visible. Internal logs may retain failed/skipped candidates separately.

Required public evidence includes:
- event type;
- visible start timestamp in Manila;
- visible end timestamp in Manila;
- duration;
- cities/feeds that were actually on screen;
- each city's local timestamp/time zone at start;
- completion or interruption state.

## Current boundary
No production homepage integration has been made by this build branch. The current work is a branch prototype and registry only.
