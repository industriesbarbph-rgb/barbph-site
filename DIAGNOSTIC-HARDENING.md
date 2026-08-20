# BarbPH Diagnostic Hardening

Status: COMPLETE — safe diagnostic layer hardened on 2026-08-20 (Asia/Manila).

## Purpose

Make the existing internal labs easier to trust before homepage integration without changing the official homepage, arming Daily Discover, starting Patroller, or changing live content controls.

## Locked safety invariants

- Daily Discover remains intentionally OFF until explicit approval to enable Theme Sources.
- The safe diagnostics page never invokes the Daily Discover production endpoint.
- Diagnostic requests do not write Daily Discover history or change spreadsheet controls.
- Homepage priority remains Sponsor Takeover → Theme Override → Daily Discover.
- All diagnostic lab pages remain `noindex,nofollow` and are disallowed in `robots.txt`.
- Barb Originals is classified as an emergency reserve, not an ordinary rotation source.
- Source inventory is expected to remain 15/15 accounted for: 9 confirmed lab-success worlds + 6 parked/waiting worlds.

## Hardened checks

`diagnostic-hardening-test.html` runs a read-only set of checks:

1. Daily Discover is still intentionally OFF.
2. 15/15 source worlds are accounted for.
3. Exactly 9 confirmed lab-success worlds are reported.
4. No unverified/parked source is enabled.
5. The reserve gate remains visible and reports its exact count.
6. Sponsor mock wins the priority controller.
7. Theme Override mock wins the priority controller.
8. Daily Discover mock wins only when the first two priorities are absent in the synthetic test.
9. The real priority controller returns one of the three locked modes.
10. All internal lab pages are blocked from crawler discovery in `robots.txt`.

The Production Gate Lab and Homepage Priority Lab now also use request timeouts, elapsed-time reporting, and request locking to reduce false conclusions from overlapping or hung tests.

## Explicitly not changed

- No `index.html`.
- No official homepage visuals.
- No Daily Discover source was enabled.
- No Barb Originals reserve image was added.
- No Patroller work.
- No Partnerships work.
- No Ticker Bones redesign.
