# Global Sky prototype

Branch-only implementation scaffold. Production is untouched.

## Locked behavior
- Daily Discover remains the normal 24-hour world.
- Global Sky is eligible for a 2-minute window every 4 hours.
- The city/feed pool is dynamic; there is no fixed city list.
- Only feeds marked `cleared`, `healthy`, and enabled may enter the mosaic.
- Selection tries to include both day and night and both hemispheres when the healthy pool allows it.
- Multiple cities are shown simultaneously in one viewport.
- A public Transmission Ledger event is created only after visible playback is confirmed by the eventual viewer/controller integration.
- Failed candidates and health-check failures remain internal and are not represented publicly as aired.

## Current boundary
The registry is intentionally empty until individual live feeds pass rights/embed and technical validation. This scaffold does not claim that any city feed is cleared.

## Next implementation
1. Validate candidate providers and populate cleared feeds.
2. Add provider-specific health probes.
3. Build the branch-only mosaic viewer.
4. Add durable event storage and `/transmission-ledger/` reader.
5. Verify the full path before any production integration.
