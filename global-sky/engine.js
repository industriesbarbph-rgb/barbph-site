export const GLOBAL_SKY = Object.freeze({ intervalMs: 4 * 60 * 60 * 1000, durationMs: 2 * 60 * 1000, maxTiles: 12 });

export function inInterlude(now = new Date()) {
  const ms = now.getTime();
  return (ms % GLOBAL_SKY.intervalMs) < GLOBAL_SKY.durationMs;
}

export function eligibleFeeds(registry) {
  return (registry?.feeds || []).filter(f => f.clearance === 'cleared' && f.health === 'healthy' && f.enabled !== false);
}

function localHour(timeZone, now) {
  return Number(new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', hour12: false }).format(now));
}

function daylightBucket(feed, now) {
  const h = localHour(feed.time_zone, now);
  return h >= 6 && h < 18 ? 'day' : 'night';
}

export function chooseMosaic(registry, now = new Date(), limit = GLOBAL_SKY.maxTiles) {
  const pool = eligibleFeeds(registry).map(feed => ({ ...feed, daylight_bucket: daylightBucket(feed, now) }));
  const selected = [];
  const take = predicate => {
    const i = pool.findIndex(f => predicate(f) && !selected.some(s => s.id === f.id));
    if (i >= 0) selected.push(pool[i]);
  };

  take(f => f.daylight_bucket === 'day' && f.hemisphere === 'north');
  take(f => f.daylight_bucket === 'night' && f.hemisphere === 'north');
  take(f => f.daylight_bucket === 'day' && f.hemisphere === 'south');
  take(f => f.daylight_bucket === 'night' && f.hemisphere === 'south');

  for (const feed of pool) {
    if (selected.length >= limit) break;
    if (!selected.some(s => s.id === feed.id)) selected.push(feed);
  }
  return selected.slice(0, limit);
}

export function publicStartEvent(feed, sessionId, now = new Date()) {
  return {
    event: 'START',
    session_id: sessionId,
    feed_id: feed.id,
    city: feed.city,
    country: feed.country,
    time_zone: feed.time_zone,
    aired_at_utc: now.toISOString(),
    aired_at_manila: new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', dateStyle: 'short', timeStyle: 'medium' }).format(now),
    aired_at_local: new Intl.DateTimeFormat('en-CA', { timeZone: feed.time_zone, dateStyle: 'short', timeStyle: 'medium' }).format(now)
  };
}
