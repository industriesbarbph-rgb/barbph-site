import { manilaDate, mapContinuousEvent, makePublicEvent, systemsStore, cleanSystemsText } from './_systems-ledger.mjs';

const SID = '1TSpt_DxEDhpsXE09lNx8S63b7cDomEXhVua--p99DGM';
const READY = new Set(['PRODUCTION_READY', 'PRODUCTION']);
const VALID_RANGE = new Set(['today','week','month','year','all']);

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      'cache-control': status === 200 ? 'public, max-age=20' : 'no-store',
      'Netlify-CDN-Cache-Control': status === 200 ? 'public, durable, s-maxage=60, stale-while-revalidate=180' : 'no-store'
    }
  });
}

function validDate(v) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));
}

function addDays(date, days) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function parseCSV(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function table(raw, header) {
  const rows = parseCSV(raw);
  const index = rows.findIndex(row => cleanSystemsText(row[0]).toLowerCase() === header.toLowerCase());
  if (index < 0) throw new Error(`${header} header not found`);
  const heads = rows[index].map(v => cleanSystemsText(v, 120));
  return rows.slice(index + 1)
    .filter(row => row.some(v => cleanSystemsText(v)))
    .map(row => Object.fromEntries(heads.map((head, i) => [head, cleanSystemsText(row[i], 500)])));
}

async function publicSources() {
  const url = `https://docs.google.com/spreadsheets/d/${SID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent('Theme Sources')}&headers=0`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    if (!response.ok) throw new Error(`Theme Sources HTTP ${response.status}`);
    const raw = await response.text();
    if (/<html|accounts\.google\.com|sign in/i.test(raw)) throw new Error('Theme Sources unavailable');
    return table(raw, 'source_name')
      .filter(row => cleanSystemsText(row.enabled).toLowerCase() === 'yes')
      .filter(row => cleanSystemsText(row.show_on_engine_report).toLowerCase() === 'yes')
      .filter(row => Number(row.weight) > 0)
      .filter(row => READY.has(cleanSystemsText(row.production_status).toUpperCase()))
      .map(row => ({
        name: cleanSystemsText(row.public_display_name || row.source_name, 120),
        order: Number(row.engine_report_order) || 999
      }))
      .filter(row => row.name)
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  } finally {
    clearTimeout(timer);
  }
}

async function listPrefix(store, prefix) {
  const keys = [];
  let cursor;
  do {
    const result = await store.list(cursor ? { prefix, cursor } : { prefix });
    const blobs = Array.isArray(result?.blobs) ? result.blobs : [];
    for (const blob of blobs) {
      const key = typeof blob === 'string' ? blob : blob?.key;
      if (key) keys.push(key);
    }
    cursor = result?.cursor || null;
  } while (cursor && keys.length < 12000);

  const docs = [];
  for (let i = 0; i < keys.length; i += 100) {
    const batch = await Promise.all(keys.slice(i, i + 100).map(key => store.get(key, { type: 'json' }).catch(() => null)));
    docs.push(...batch);
  }
  return docs.filter(doc => doc?.id && doc?.at).map(doc => makePublicEvent(doc));
}

async function permanentEvents(store, range, date, allYear = '') {
  if (range === 'today') return listPrefix(store, `systems/events/${date}/`);
  if (range === 'month') return listPrefix(store, `systems/events/${date.slice(0, 7)}`);
  if (range === 'year') return listPrefix(store, `systems/events/${date.slice(0, 4)}`);
  if (range === 'all') {
    const year = /^\d{4}$/.test(String(allYear || '')) ? String(allYear) : date.slice(0, 4);
    return listPrefix(store, `systems/events/${year}`);
  }

  const dates = Array.from({ length: 7 }, (_, i) => addDays(date, -i));
  const batches = await Promise.all(dates.map(day => listPrefix(store, `systems/events/${day}/`)));
  return batches.flat();
}

async function legacyToday(store, date) {
  const legacy = await store.get(`continuous/events/${date}`, { type: 'json' }).catch(() => null);
  const rows = Array.isArray(legacy?.events) ? legacy.events : [];
  return rows.map((row, index) => {
    const mapped = mapContinuousEvent(row.type, row, date);
    if (!mapped) return null;
    return makePublicEvent({
      ...mapped,
      id: `legacy-${date}-${index + 1}`,
      at: row.at || new Date().toISOString()
    });
  }).filter(Boolean);
}

function summarize(events) {
  const count = type => events.filter(event => event.type === type).length;
  const results = events.reduce((acc, event) => {
    acc[event.result] = (acc[event.result] || 0) + 1;
    return acc;
  }, {});
  const unresolved = results.UNRESOLVED || 0;
  const incidents = (results.INCIDENT || 0) + unresolved;
  const fallback = results.FALLBACK || 0;
  const status = unresolved ? 'UNRESOLVED' : incidents ? 'INCIDENT' : fallback ? 'FALLBACK' : 'NORMAL';
  return {
    transmissions: count('BATCH_REFRESHED') + count('SOURCE_SELECTED'),
    incidents,
    recoveries: results.RECOVERED || 0,
    barb_originals_activations: count('BARB_ORIGINALS_ENGAGED') + count('BARB_ORIGINALS_ADMIN_HOLD'),
    watchtower_sessions: count('WATCHTOWER_STARTED'),
    unresolved,
    overall_status: status
  };
}

export default async request => {
  if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
  const url = new URL(request.url);
  const range = VALID_RANGE.has(url.searchParams.get('range')) ? url.searchParams.get('range') : 'today';
  const requested = url.searchParams.get('date');
  const date = validDate(requested) ? requested : manilaDate();
  const allYear = /^\d{4}$/.test(String(url.searchParams.get('year') || '')) ? Number(url.searchParams.get('year')) : Number(date.slice(0, 4));
  const store = systemsStore(false);

  try {
    const [sources, permanent] = await Promise.all([
      publicSources().catch(() => []),
      permanentEvents(store, range, date, String(allYear))
    ]);
    let events = permanent;
    let legacy_used = false;
    if (range === 'today' && !events.length) {
      const legacy = await legacyToday(store, date);
      if (legacy.length) { events = legacy; legacy_used = true; }
    }
    events.sort((a, b) => String(b.at).localeCompare(String(a.at)));
    events = events.slice(0, 12000);

    return json({
      system: 'BARBPH SYSTEMS',
      subtitle: 'Continuous Transmission & Systems Ledger',
      date_manila: date,
      range,
      generated_at: new Date().toISOString(),
      sources: sources.map(source => source.name),
      events,
      summary: summarize(events),
      next_year: range === 'all' && allYear > 2026 ? allYear - 1 : null,
      ledger_note: legacy_used
        ? 'Displaying sanitized legacy events until the permanent SYSTEMS ledger begins recording.'
        : 'Permanent SYSTEMS ledger events are stored independently from the public viewer.'
    });
  } catch (error) {
    return json({ error: 'Systems ledger temporarily unavailable' }, 503);
  }
};
