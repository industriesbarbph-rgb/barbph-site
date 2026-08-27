# BarbPH Global Sky / World Time / Seasons — Implementation Spec

Status: **approved for implementation; production not yet changed**.

## Core idea

BarbPH keeps the scheduled Daily Discover theme as the main 24-hour visual world. Every **4 hours**, the homepage may enter a **2-minute Global Sky interlude** that shows multiple cleared live city feeds **simultaneously** in one viewport.

This is not a fixed-city showcase. The system must use a dynamic pool of feeds that are both:

1. already cleared for BarbPH use/embedding; and
2. healthy/live at the moment the interlude is prepared.

The objective is to show the world **as it is at one shared instant**: some cities in daylight, some at night, some in opposite hemispheres, with different seasonal or climate states visible together.

## Locked cadence

- Main state: scheduled Daily Discover theme for the Manila day.
- Global Sky cadence: **once every 4 hours**.
- Global Sky duration: **2 minutes**.
- After 2 minutes, return to the same scheduled Daily Discover theme.
- Global Sky must not replace the 24-hour theme or alter the Daily Discover source lock.

Exact transition choreography remains visual-design work and must be approved before production integration.

## Dynamic feed pool — no fixed city list

There is no permanent list of featured cities.

The engine operates from a **cleared live-feed registry**. A feed may enter the active interlude only when it is:

- rights/embedding cleared for BarbPH;
- currently reachable/healthy;
- genuinely live or near-live according to the provider's own delivery;
- associated with a known city/location and IANA timezone;
- suitable for the simultaneous mosaic layout.

If a cleared feed is offline at interlude time, skip it. When it becomes healthy again, it may automatically re-enter eligibility.

A newly discovered feed does **not** auto-enter production merely because it is reachable. Discovery may be automated, but first-time rights/embedding clearance remains a gate.

## Composition objective

Global Sky should deliberately favor a visually meaningful mix when the healthy pool allows it:

- opposing or distant timezones;
- daylight and nighttime feeds at the same shared instant;
- Northern and Southern Hemisphere locations;
- visibly different seasonal/climate conditions;
- broad geographic distribution;
- no requirement that every tile be a famous or predefined "major city".

The system may use scoring/selection logic to maximize contrast and geographic spread, but it must not fabricate weather, daylight, or season states.

## Simultaneous world view

The approved visual direction is a **multi-feed live mosaic in one viewport**, not one city at a time.

Each tile may expose a restrained label layer containing only fields that are factually known, such as:

- city/location;
- country;
- live local time;
- timezone abbreviation or UTC offset;
- season/climate label when a sound classification model exists;
- LIVE state.

The live camera remains the dominant content. The page must not become a conventional data-heavy dashboard.

## Time engine

Use key-free browser/server time-zone handling where practical:

- IANA timezone IDs, e.g. `Asia/Manila`, `Europe/London`, `America/New_York`;
- JavaScript `Intl.DateTimeFormat`;
- one shared current instant converted into each city's local timezone.

A paid world-clock API is not required for the basic time feature.

## Day/night state

Do not infer day/night from arbitrary clock ranges when a more accurate method is available. The implementation may calculate sun state from location coordinates and current instant, or simply let the live feed visually show the state while the label remains neutral.

No synthetic claim such as "sunny", "raining", or "snowing" may be published from visual guesswork alone.

## Seasons and climate truthfulness

Do not force every location into spring/summer/autumn/winter.

For temperate locations, a hemisphere/calendar season model may be used if clearly defined. Tropical/equatorial locations may use a locally appropriate seasonal model or omit the season label until one is safely defined.

The purpose is to show real differences around Earth at one instant, not to manufacture four conventional season labels simultaneously.

## Live-feed failure behavior

- No live feed = no tile for that feed.
- Do not substitute an old static city image and present it as current/live.
- If a feed fails before it is actually shown, it is skipped and does not count as aired.
- If a feed fails while already on-screen, the public ledger records the interlude as interrupted for that feed only if the feed truly reached the viewing surface.
- The remaining healthy tiles may continue if the layout still meets the minimum viable grid rule defined during implementation.

## Relationship to Daily Discover

Global Sky is an **interlude layer**, not a replacement for Daily Discover.

Production integration must preserve the existing priority controller and must not alter the locked Daily Discover source selection/history behavior.

## Transmission Ledger relationship

Every Global Sky interlude that actually reaches the public viewing surface must produce an automated broadcast footprint for the public **Transmission Ledger** at `/transmission-ledger/`.

The ledger records what actually aired, not merely what was scheduled. Full logging rules are defined in `TRANSMISSION-LEDGER-SPEC.md`.

## Implementation phases

1. Cleared-feed registry schema.
2. Feed-health evaluation layer.
3. Contrast-aware selection/composition logic.
4. Off-production simultaneous mosaic prototype.
5. 4-hour / 2-minute scheduler.
6. Automated Transmission Ledger event logger/store.
7. `/transmission-ledger/` public page.
8. Publication routing link.
9. Controlled production integration after visual and functional approval.

## Explicitly not locked yet

- minimum/maximum number of simultaneous tiles;
- exact tile geometry and responsive breakpoints;
- exact feed providers;
- weather API usage;
- exact season/climate taxonomy;
- transition animation;
- production activation date.
