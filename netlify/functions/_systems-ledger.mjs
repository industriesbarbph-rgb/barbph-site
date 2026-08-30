import { getStore, getDeployStore } from '@netlify/blobs';

export const SYSTEMS_STORE = 'barbph-daily-discover';
export const SYSTEMS_TZ = 'Asia/Manila';

const RESULT_SET = new Set(['NORMAL','NOTICE','RECOVERED','FALLBACK','INCIDENT','UNRESOLVED']);

export function cleanSystemsText(value, max = 240) {
  return String(value ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

export function manilaDate(input = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: SYSTEMS_TZ,
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(input);
  const get = type => parts.find(p => p.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function systemsStore(lab = false) {
  if (lab) return getDeployStore(`${SYSTEMS_STORE}-lab`);
  const production = Netlify.context?.deploy?.context === 'production';
  return production
    ? getStore(SYSTEMS_STORE, { consistency: 'strong' })
    : getDeployStore(SYSTEMS_STORE);
}

function safeResult(value) {
  const result = cleanSystemsText(value, 24).toUpperCase();
  return RESULT_SET.has(result) ? result : 'NOTICE';
}

function safeIdPart(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90) || 'event';
}

function timeKey(iso) {
  return String(iso).replace(/[-:.TZ]/g, '').slice(0, 17);
}

export function makePublicEvent(input = {}) {
  const at = /^\d{4}-\d{2}-\d{2}T/.test(String(input.at || ''))
    ? new Date(input.at).toISOString()
    : new Date().toISOString();
  const event = {
    id: cleanSystemsText(input.id, 120) || crypto.randomUUID(),
    at,
    date_manila: cleanSystemsText(input.date_manila, 10) || manilaDate(new Date(at)),
    type: cleanSystemsText(input.type, 80).toUpperCase() || 'SYSTEM_NOTICE',
    system: cleanSystemsText(input.system, 80) || 'BarbPH',
    expected: cleanSystemsText(input.expected, 220),
    happened: cleanSystemsText(input.happened, 280),
    action: cleanSystemsText(input.action, 280),
    result: safeResult(input.result),
    related_event_id: cleanSystemsText(input.related_event_id, 120) || null
  };
  return Object.freeze(event);
}

export async function recordPublicSystemEvent(input = {}, { lab = false, dedupeKey = '', storeOverride = null } = {}) {
  const store = storeOverride || systemsStore(lab);
  const event = makePublicEvent(input);
  const stable = dedupeKey ? safeIdPart(dedupeKey) : `${timeKey(event.at)}-${safeIdPart(event.id)}`;
  const key = `systems/events/${event.date_manila}/${stable}`;

  if (dedupeKey) {
    const existing = await store.get(key, { type: 'json' }).catch(() => null);
    if (existing?.id) return existing;
  }

  await store.setJSON(key, event);
  return event;
}

export function mapContinuousEvent(type, data = {}, date = manilaDate()) {
  const source = cleanSystemsText(data.scheduled_source || data.source || '', 100) || 'Daily Discover source';
  const count = Number(data.asset_count) || 0;
  const generation = Number(data.generation) || 0;

  const base = { date_manila: date, system: 'Daily Discover', type: String(type || '').toUpperCase() };
  switch (String(type || '')) {
    case 'source_selected':
      return { ...base, expected: 'Assign an enabled production source for the Manila day', happened: `${source} was selected`, action: 'Daily source assignment locked', result: 'NORMAL' };
    case 'batch_refreshed':
      return { ...base, expected: `Receive a fresh eligible batch from ${source}`, happened: count ? `${source} delivered ${count} eligible assets` : `${source} delivered a fresh eligible batch`, action: generation ? `Accepted generation ${generation}` : 'Accepted new source batch', result: 'NORMAL' };
    case 'source_degraded':
      return { ...base, expected: `${source} should return eligible source material`, happened: `${source} became temporarily unavailable`, action: 'Protected the live stage and entered controlled retry/backoff', result: 'NOTICE' };
    case 'same_source_cache_engaged':
      return { ...base, expected: `Fresh material from ${source}`, happened: 'Fresh retrieval was temporarily unavailable', action: `Kept the last-known-good ${source} material on screen`, result: 'FALLBACK' };
    case 'barb_originals_engaged':
      return { ...base, expected: `Primary material from ${source}`, happened: 'The primary source could not provide a usable batch', action: 'Barb Originals emergency reserve engaged', result: 'FALLBACK' };
    case 'source_recovered':
      return { ...base, expected: `${source} should return to normal service`, happened: `${source} resumed eligible delivery`, action: 'Primary source service restored', result: 'RECOVERED' };
    case 'admin_hold_engaged':
      return { ...base, expected: `${source} to remain production-eligible`, happened: `${source} was placed on Admin hold`, action: 'Stopped serving institutional material from the held source', result: 'NOTICE' };
    case 'barb_originals_admin_hold':
      return { ...base, expected: `${source} as the scheduled source`, happened: `${source} remained on Admin hold`, action: 'Barb Originals emergency reserve engaged', result: 'FALLBACK' };
    case 'camera_offline':
      return { ...base, system: 'Watchtower', expected: 'Load the scheduled Watchtower live view', happened: 'The live view did not become ready within the grace window', action: 'Closed the interlude and returned BarbPH to normal display', result: 'INCIDENT' };
    case 'watchtower_ended':
      return { ...base, system: 'Watchtower', expected: 'Complete the scheduled live world window', happened: 'The observed Watchtower interval ended', action: 'Closed the live world window', result: 'NORMAL' };
    case 'barbph_returned':
      return { ...base, system: 'Homepage', expected: 'Resume BarbPH after the Watchtower interval', happened: 'BarbPH returned to the visual world', action: 'Continuous source resync requested', result: cleanSystemsText(data.watchtower_outcome).toLowerCase() === 'offline' ? 'RECOVERED' : 'NORMAL' };
    default:
      return null;
  }
}

export async function mirrorContinuousEvent(type, data = {}, date = manilaDate(), options = {}) {
  const mapped = mapContinuousEvent(type, data, date);
  if (!mapped) return null;
  const dedupeKey = cleanSystemsText(data.systems_dedupe_key, 120);
  return recordPublicSystemEvent(mapped, { ...options, dedupeKey: dedupeKey || options.dedupeKey || '' });
}
