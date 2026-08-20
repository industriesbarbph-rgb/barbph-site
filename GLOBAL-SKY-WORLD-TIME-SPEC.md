# BarbPH Global Sky / World Time / Seasons — Planned Spec

Status: **concept approved; not yet implemented**.

## Core idea

The atmospheric sky direction used in the Ticker Bones lab can evolve into a BarbPH global visual/theme layer. It should make the site feel aware of the world in real time without turning the homepage into a conventional dashboard.

## Proposed interlude sequence

After a Daily Discover source completes its normal image rotation, a World Time interlude may appear.

1. **City moments** — one major city at a time, full bleed.
2. Show the city name, country, continent, live local time, and appropriate season context.
3. Move through the selected major-city set.
4. **World view** — show the major cities together at the same instant.
5. Return to the next Daily Discover/source sequence.

The exact duration, city list, and transition choreography are not locked yet.

## Time engine

Prefer a key-free implementation using:

- IANA time-zone IDs such as `Asia/Manila`, `Europe/London`, `America/New_York`
- JavaScript `Intl.DateTimeFormat`
- the visitor/device clock as the current instant

A paid world-clock API is not required for the basic live-time feature.

## City/theme database — planned fields

Potential fields:

- city
- country
- continent
- IANA time zone
- latitude / longitude
- hemisphere
- display priority
- season model
- theme tags
- optional representative image/theme family

The exact schema is not locked until implementation.

## Seasons

The system may deliberately choose representative cities so all four conventional seasons can be visible around the world at the same moment.

Guardrail: do not label every city with a simplistic four-season model. Tropical/equatorial locations may use different seasonal patterns. If a location does not naturally fit spring/summer/autumn/winter terminology, the display should use a locally appropriate label or omit the season until a sound model is defined.

## Visual direction

- full-bleed atmospheric treatment
- city/time moments should feel cinematic, not like rows in a spreadsheet
- world view may use points for countries/continents/cities
- visual language should coexist with the future homepage controls rather than compete with them
- exact map treatment is not locked yet

## Relationship to Daily Discover

World Time is an **interlude/theme layer**, not a replacement for Daily Discover source rotation.

The current concept begins after a source's normal set (currently commonly 3 images) has finished. Any production integration must preserve the existing Sponsor > Theme Override > Daily Discover priority logic.

## Not included yet

- live weather
- paid weather/time APIs
- final list of "major cities"
- final map style
- final seasonal classification model for all climates
- production homepage integration
