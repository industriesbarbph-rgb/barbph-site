# BarbPH Randomizer Tantrum Lab

Status: **lab-only experiment**. This does not change production fallback policy and does not arm Daily Discover.

## Why it exists

The user asked to include parked/waiting source worlds as deliberate tantrum test items so the failover/randomizer mechanism can be observed before any production policy change.

## Test inputs

Parked public worlds that may be used as simulated failed sources:

- Europeana
- New York Public Library
- Biodiversity Heritage Library
- Getty Open Content
- Wildcard

`Barb Originals` is also shown in the lab, but it is treated differently because it is the emergency reserve rather than a normal public rotation world.

## Experimental randomizer behavior

For a parked public-world tantrum:

1. Treat the selected parked world as failed.
2. Build a replacement pool from the nine confirmed lab-success public sources.
3. Use Theme Sources weights when available, but ignore `enabled=no` because this is a dry-run lab.
4. Pick a confirmed replacement.
5. Call the existing Daily Discover production engine with `lab=1&force_source=...`.
6. Count the replacement as successful only if it serves its own source in `primary` mode with at least three assets.
7. If it tantrums too, remove it and randomize another confirmed source, up to the lab attempt limit.
8. If the randomizer exhausts its confirmed-source attempts, report Barb Originals as the next safety layer, followed by hard safe fallback.

The lab can also synthetically force the first 1–4 replacement attempts to tantrum so the cascade can be observed without waiting for real external failures.

## Barb Originals tantrum

If Barb Originals itself is selected as the failed item, the lab does **not** randomize into an unverified public source. It reports the expected next step as the hard safe fallback.

## Safety guarantees

- No Theme Source is enabled.
- No spreadsheet row is modified.
- Daily Discover is called only with `lab=1`.
- No daily state lock is created.
- No history is written.
- Production policy remains the currently locked policy until the user explicitly approves a change.

## Files

- `/randomizer-tantrum-test.html`
- `/netlify/functions/randomizer-tantrum-lab.mjs`
