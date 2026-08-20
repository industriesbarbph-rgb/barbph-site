# Daily Discover Emergency Reserve — Locked Policy

## Purpose
Barb Originals is the emergency reserve for Daily Discover. It is not part of the normal public-world rotation.

## Production duty order
1. Choose the scheduled public source for the Manila day.
2. Use a valid cached set for that source if one already exists.
3. If no valid cached set exists, retry the scheduled source and its approved retrieval path(s).
4. If the scheduled source still cannot produce the required rights-safe set, switch the entire Manila day to Barb Originals.
5. Once Barb Originals takes over, it remains the acting source until the next Manila day. Do not bounce between sources during the same day.
6. If Barb Originals itself cannot provide the required set, use the site's hard safe fallback rather than serving questionable third-party media.

## Reserve rules
- Reserve assets must come only from the `Barb Originals` sheet tab.
- `enabled=yes` is required.
- **3 enabled unique valid images is the minimum readiness threshold, not a maximum.**
- The reserve may contain 4, 6, 12, 20, or more valid enabled images.
- All valid enabled unique reserve images may be eligible for reserve selection.
- A larger reserve is preferred because it reduces repetition and increases resilience.
- Optional family/category labels may later be used to balance variety (for example skies, landscapes, flowers, textures, abstract, dark/light moods), but categories are not required for basic readiness.
- Assets are treated as user-owned material.
- Barb Originals does not compete by weight with The Met, NASA, Smithsonian, NOAA, USGS, or other public source worlds.
- Parked or unverified public worlds must never be chosen as emergency substitutes.

## Visitor behavior
Visitors simply see the acting source for the day. A failed scheduled source does not need to be publicly announced. Internal diagnostics/history should retain both the scheduled source and the acting source for troubleshooting.

## Lab behavior
Manual source test buttons should continue exposing source failures instead of silently using Barb Originals. This keeps the lab useful for diagnostics. Emergency reserve takeover belongs to automatic/production mode.
