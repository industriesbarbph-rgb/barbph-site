import { getStore } from '@netlify/blobs';

const STORE = getStore({ name: 'global-sky', consistency: 'strong' });
const REGISTRY_KEY = 'camera-registry-v1';
const STATE_KEY = 'camera-scout-state-v1';
const EVENTS_KEY = 'stage-events-v1';
const CURRENT_SESSION_KEY = 'session/current';

export const CITY_QUEUE = [
  { city: 'Manila', country: 'Philippines', region: 'Asia-Pacific' },
  { city: 'Tokyo', country: 'Japan', region: 'Asia-Pacific' },
  { city: 'Seoul', country: 'South Korea', region: 'Asia-Pacific' },
  { city: 'Singapore', country: 'Singapore', region: 'Asia-Pacific' },
  { city: 'Bangkok', country: 'Thailand', region: 'Asia-Pacific' },
  { city: 'Sydney', country: 'Australia', region: 'Asia-Pacific' },
  { city: 'Auckland', country: 'New Zealand', region: 'Asia-Pacific' },
  { city: 'London', country: 'United Kingdom', region: 'Europe' },
  { city: 'Paris', country: 'France', region: 'Europe' },
  { city: 'New York', country: 'United States', region: 'North America' },
  { city: 'Vancouver', country: 'Canada', region: 'North America' },
  { city: 'Rio de Janeiro', country: 'Brazil', region: 'Latin America' },
  { city: 'Cape Town', country: 'South Africa', region: 'Africa' },
  { city: 'Dubai', country: 'United Arab Emirates', region: 'Middle East' }
];

const nowIso = () => new Date().toISOString();
const clone = (x) => JSON.parse(JSON.stringify(x));

const seed = [
  {
    camera_id: 'CAM-UK-LONDON-POC-001', city: 'London', country: 'United Kingdom', region: 'Europe', timezone: 'Europe/London', provider: 'Port of Cams',
    feed_type: 'iframe', embed_url: 'https://portofcams.com/embed/windy-london/', source_page: 'https://portofcams.com/', enabled: true, priority: 90,
    status: 'APPROVED', health: { score: 90, failures: 0, last_reason: 'seeded verified source' }, eligibility: { embed_confirmed: true, rights_status: 'embed_observed' }
  },
  {
    camera_id: 'CAM-IT-VENICE-OCC-301430', city: 'Venice', country: 'Italy', region: 'Europe', timezone: 'Europe/Rome', provider: 'OpenCCTV',
    feed_type: 'iframe', embed_url: 'https://opencctv.org/cameras/italy/veneto/venice/grand-canal-venice-301430', source_page: 'https://opencctv.org/cameras/italy/veneto/venice/grand-canal-venice-301430', enabled: true, priority: 88,
    status: 'LIVE', health: { score: 96, failures: 0, last_reason: 'seeded live source' }, eligibility: { embed_confirmed: true, rights_status: 'provider_publishes_iframe_embed_code' }
  },
  {
    camera_id: 'CAM-JP-TOKYO-CS-001', city: 'Tokyo', country: 'Japan', region: 'Asia-Pacific', timezone: 'Asia/Tokyo', provider: 'CamStreamer',
    feed_type: 'iframe', embed_url: 'https://camstreamer.com/embed/gvwteHj04P0qq1ygIgt8sEVQYPotE1ZfaeALWlKl?rel=0', source_page: 'https://camstreamer.com/', enabled: true, priority: 92,
    status: 'APPROVED', health: { score: 90, failures: 0, last_reason: 'seeded verified source' }, eligibility: { embed_confirmed: true, rights_status: 'embed_observed' }
  },
  {
    camera_id: 'CAM-SG-MIDVIEW-OCC-302651', city: 'Singapore', country: 'Singapore', region: 'Asia-Pacific', timezone: 'Asia/Singapore', provider: 'OpenCCTV',
    feed_type: 'iframe', embed_url: 'https://opencctv.org/cameras/singapore/central/singapore/singapore-midview-city-cctv-live-view-302651', source_page: 'https://opencctv.org/cameras/singapore/central/singapore/singapore-midview-city-cctv-live-view-302651', enabled: true, priority: 86,
    status: 'LIVE', health: { score: 96, failures: 0, last_reason: 'seeded live source' }, eligibility: { embed_confirmed: true, rights_status: 'provider_publishes_iframe_embed_code' }
  },
  {
    camera_id: 'CAM-AR-BUENOSAIRES-OCC-301693', city: 'Buenos Aires', country: 'Argentina', region: 'Latin America', timezone: 'America/Argentina/Buenos_Aires', provider: 'OpenCCTV',
    feed_type: 'iframe', embed_url: 'https://opencctv.org/cameras/argentina/autonomous-city-of-buenos-aires/autonomous-city-of-buenos-aires/autonomous-city-of-buenos-aires-oficina-externa-301693', source_page: 'https://opencctv.org/cameras/argentina/autonomous-city-of-buenos-aires/autonomous-city-of-buenos-aires/autonomous-city-of-buenos-aires-oficina-externa-301693', enabled: true, priority: 84,
    status: 'LIVE', health: { score: 96, failures: 0, last_reason: 'seeded live source' }, eligibility: { embed_confirmed: true, rights_status: 'provider_publishes_iframe_embed_code' }
  },
  {
    camera_id: 'CAM-AR-VILLAGESELL-OCC-290897', city: 'Villa Gesell', country: 'Argentina', region: 'Latin America', timezone: 'America/Argentina/Buenos_Aires', provider: 'OpenCCTV',
    feed_type: 'iframe', embed_url: 'https://opencctv.org/cameras/argentina/buenos-aires/villa-gesell/buenos-aires-y-playa-villa-gesell-290897', source_page: 'https://opencctv.org/cameras/argentina/buenos-aires/villa-gesell/buenos-aires-y-playa-villa-gesell-290897', enabled: true, priority: 72,
    status: 'LIVE', health: { score: 95, failures: 0, last_reason: 'seeded live source' }, eligibility: { embed_confirmed: true, rights_status: 'provider_publishes_iframe_embed_code' }
  },
  {
    camera_id: 'CAM-PH-EDSA-CUBAO-OCC-282196', city: 'Quezon City', country: 'Philippines', region: 'Asia-Pacific', timezone: 'Asia/Manila', provider: 'OpenCCTV',
    feed_type: 'iframe', embed_url: 'https://opencctv.org/cameras/philippines/metro-manila/quezon-city/edsa-cubao-282196', source_page: 'https://opencctv.org/cameras/philippines/metro-manila/quezon-city/edsa-cubao-282196', enabled: true, priority: 95,
    status: 'OFFLINE', health: { score: 20, failures: 5, last_reason: 'known offline baseline' }, eligibility: { embed_confirmed: true, rights_status: 'provider_publishes_iframe_embed_code' }
  },
  {
    camera_id: 'CAM-PH-NLEX-MINDANAO-OCC-282233', city: 'Quezon City', country: 'Philippines', region: 'Asia-Pacific', timezone: 'Asia/Manila', provider: 'OpenCCTV',
    feed_type: 'iframe', embed_url: 'https://opencctv.org/cameras/philippines/metro-manila/quezon-city/nlex-mindanao-avenue-282233', source_page: 'https://opencctv.org/cameras/philippines/metro-manila/quezon-city/nlex-mindanao-avenue-282233', enabled: true, priority: 94,
    status: 'OFFLINE', health: { score: 20, failures: 5, last_reason: 'known offline baseline' }, eligibility: { embed_confirmed: true, rights_status: 'provider_publishes_iframe_embed_code' }
  },
  {
    camera_id: 'CAM-JP-TOKYO-STATION-20260905', city: 'Tokyo Station – Marunouchi Plaza', country: 'Japan', region: 'Asia-Pacific', timezone: 'Asia/Tokyo', provider: 'Otemachi-Marunouchi-Yurakucho District Council / SeeTheView',
    feed_type: 'iframe', embed_url: 'https://seetheview.com/cam/1811/tokyo-station-marunouchi-plaza-live-camera', source_page: 'https://seetheview.com/cam/1811/tokyo-station-marunouchi-plaza-live-camera', enabled: true, priority: 99,
    status: 'LIVE', health: { score: 99, failures: 0, last_reason: 'verified 24/7 on 2026-09-05' }, eligibility: { embed_confirmed: true, rights_status: 'reuse_allowed_with_attribution' }, attribution: '(一社)大手町・丸の内・有楽町地区まちづくり協議会'
  },
  {
    camera_id: 'CAM-JP-YOKOSUKA-NAGAI-20260905', city: 'Nagai Fishing Harbor', country: 'Japan', region: 'Asia-Pacific', timezone: 'Asia/Tokyo', provider: 'Yokosuka City Official Channel / SeeTheView',
    feed_type: 'iframe', embed_url: 'https://seetheview.com/cam/2470/nagai-fishing-harbor-main-port-disaster-surveillance-camera', source_page: 'https://seetheview.com/cam/2470/nagai-fishing-harbor-main-port-disaster-surveillance-camera', enabled: true, priority: 100,
    status: 'LIVE', health: { score: 100, failures: 0, last_reason: 'official city disaster camera; verified 24/7 on 2026-09-05' }, eligibility: { embed_confirmed: true, rights_status: 'platform_embedding_available' }
  },
  {
    camera_id: 'CAM-JP-SHINJUKU-EAST-20260905', city: 'Shinjuku Station East Exit', country: 'Japan', region: 'Asia-Pacific', timezone: 'Asia/Tokyo', provider: 'Cross Shinjuku Vision',
    feed_type: 'iframe', embed_url: 'https://sibch.tv/japan/tokyo/cross-space-shinjuku/', source_page: 'https://sibch.tv/japan/tokyo/cross-space-shinjuku/', enabled: true, priority: 94,
    status: 'APPROVED', health: { score: 92, failures: 0, last_reason: '24/7 live listing verified 2026-09-05' }, eligibility: { embed_confirmed: true, rights_status: 'embed_observed; operator rights not independently broadened' }
  },
  {
    camera_id: 'CAM-KR-SEOUL-NAMSAN-20260905', city: 'Namsan / YTN Seoul Tower', country: 'South Korea', region: 'Asia-Pacific', timezone: 'Asia/Seoul', provider: 'YTN Seoul Tower',
    feed_type: 'iframe', embed_url: 'https://seoulytn.ytn.co.kr/en', source_page: 'https://seoulytn.ytn.co.kr/en', enabled: true, priority: 98,
    status: 'APPROVED', health: { score: 96, failures: 0, last_reason: 'official operator advertises LiveSeoul live streaming; verified 2026-09-05' }, eligibility: { embed_confirmed: true, rights_status: 'official live page; external redistribution terms not broadened' }
  },
  {
    camera_id: 'CAM-JP-HAKONE-JUKKOKU-20260905', city: 'Jukkoku Pass – Panorama Terrace 1059', country: 'Japan', region: 'Asia-Pacific', timezone: 'Asia/Tokyo', provider: 'Fujiyama NAVI / Jukkoku Pass / SeeTheView',
    feed_type: 'iframe', embed_url: 'https://seetheview.com/cam/2534/jukkoku-pass-mt-fuji-view-live-camera', source_page: 'https://seetheview.com/cam/2534/jukkoku-pass-mt-fuji-view-live-camera', enabled: true, priority: 96,
    status: 'LIVE', health: { score: 97, failures: 0, last_reason: 'verified 24/7 on 2026-09-05' }, eligibility: { embed_confirmed: true, rights_status: 'platform_embedding_available' }
  },
  {
    camera_id: 'CAM-JP-FUJI-VIEW-HOTEL-20260905', city: 'Fuji View Hotel', country: 'Japan', region: 'Asia-Pacific', timezone: 'Asia/Tokyo', provider: 'Fuji View Hotel / SeeTheView',
    feed_type: 'iframe', embed_url: 'https://seetheview.com/cam/2537/mt-fuji-from-fuji-view-hotel', source_page: 'https://seetheview.com/cam/2537/mt-fuji-from-fuji-view-hotel', enabled: true, priority: 95,
    status: 'LIVE', health: { score: 96, failures: 0, last_reason: 'verified 24/7 on 2026-09-05' }, eligibility: { embed_confirmed: true, rights_status: 'platform_embedding_available' }
  },
  {
    camera_id: 'CAM-ID-BALI-TROPICAL-20260905', city: 'Bali Tropical Beach', country: 'Indonesia', region: 'Asia-Pacific', timezone: 'Asia/Makassar', provider: 'Luxury Island / SeeTheView',
    feed_type: 'iframe', embed_url: 'https://seetheview.com/cam/395/bali-tropical-beach-live-ocean-waves-sounds-24-7', source_page: 'https://seetheview.com/cam/395/bali-tropical-beach-live-ocean-waves-sounds-24-7', enabled: true, priority: 82,
    status: 'LIVE', health: { score: 88, failures: 0, last_reason: 'continuous 24/7 stream verified 2026-09-05' }, eligibility: { embed_confirmed: true, rights_status: 'platform_embedding_available; independent operator' }
  }
];

function normalizeCamera(camera) {
  return {
    status: 'APPROVED',
    enabled: true,
    priority: 50,
    region: 'Unknown',
    health: { score: 80, failures: 0, last_reason: 'not checked yet' },
    eligibility: { embed_confirmed: false, rights_status: 'unverified' },
    ...camera,
    health: { score: 80, failures: 0, last_reason: 'not checked yet', ...(camera.health || {}) },
    eligibility: { embed_confirmed: false, rights_status: 'unverified', ...(camera.eligibility || {}) }
  };
}

export async function loadRegistry() {
  let registry = await STORE.get(REGISTRY_KEY, { type: 'json' });
  if (!Array.isArray(registry) || !registry.length) {
    registry = seed.map(normalizeCamera);
    await STORE.setJSON(REGISTRY_KEY, registry);
  }
  return registry.map(normalizeCamera);
}

export async function saveRegistry(registry) {
  await STORE.setJSON(REGISTRY_KEY, registry.map(normalizeCamera));
}

export async function loadScoutState() {
  const existing = await STORE.get(STATE_KEY, { type: 'json' });
  return existing || { queue_index: 0, total_runs: 0, last_city: null, last_message: 'Scout initialized', recent: [] };
}

export async function saveScoutState(state) {
  await STORE.setJSON(STATE_KEY, state);
}

export async function appendEvent(event) {
  const events = (await STORE.get(EVENTS_KEY, { type: 'json' })) || [];
  events.push({ timestamp_utc: nowIso(), ...event });
  const trimmed = events.slice(-1000);
  await STORE.setJSON(EVENTS_KEY, trimmed);
  return trimmed[trimmed.length - 1];
}

export async function getEvents(broadcastId = null) {
  const events = (await STORE.get(EVENTS_KEY, { type: 'json' })) || [];
  return broadcastId ? events.filter((x) => x.broadcast_id === broadcastId) : events;
}

function broadcastWindow(now = Date.now()) {
  const slot = Math.floor(now / 120000);
  const started = slot * 120000;
  return { slot, started, next: started + 120000 };
}

export function broadcastId(now = Date.now()) {
  const { started } = broadcastWindow(now);
  const d = new Date(started);
  const p = (n) => String(n).padStart(2, '0');
  return `MWAW-${d.getUTCFullYear()}${p(d.getUTCMonth()+1)}${p(d.getUTCDate())}-${p(d.getUTCHours())}${p(d.getUTCMinutes())}`;
}

function cameraEligible(c) {
  return c.enabled !== false && ['LIVE', 'APPROVED'].includes(c.status) && c.eligibility?.embed_confirmed && c.embed_url;
}

function seededHash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export function selectCameras(registry, id, count = 7) {
  const eligible = registry.filter(cameraEligible);
  const ranked = eligible.map((camera) => ({
    camera,
    rank: (camera.priority || 0) * 1000 + (camera.health?.score || 0) * 10 + (seededHash(`${id}:${camera.camera_id}`) % 1000)
  })).sort((a,b) => b.rank - a.rank);

  const chosen = [];
  const countries = new Map();
  for (const item of ranked) {
    if (chosen.length >= count) break;
    const n = countries.get(item.camera.country) || 0;
    if (n >= 2 && ranked.length > count) continue;
    chosen.push(item.camera);
    countries.set(item.camera.country, n + 1);
  }
  if (chosen.length < count) {
    for (const item of ranked) {
      if (chosen.length >= count) break;
      if (!chosen.some((c) => c.camera_id === item.camera.camera_id)) chosen.push(item.camera);
    }
  }
  return chosen.map((camera, index) => ({ slot: index + 1, camera: clone(camera) }));
}

export async function currentSession() {
  const id = broadcastId();
  let session = await STORE.get(CURRENT_SESSION_KEY, { type: 'json' });
  if (!session || session.broadcast_id !== id) {
    const registry = await loadRegistry();
    const { started, next } = broadcastWindow();
    session = {
      broadcast_id: id,
      status: 'ACTIVE',
      started_at_utc: new Date(started).toISOString(),
      next_set_utc: new Date(next).toISOString(),
      selected: selectCameras(registry, id, 7),
      standby: [], decisions: []
    };
    await STORE.setJSON(CURRENT_SESSION_KEY, session);
    await STORE.setJSON(`session/${id}`, session);
    await appendEvent({ broadcast_id: id, event_type: 'SESSION_STARTED', message: `${session.selected.length} cameras selected.` });
  }
  return session;
}

async function fetchHead(url, timeoutMs = 8000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'follow', signal: ctrl.signal, headers: { 'User-Agent': 'CoachDollPatrols-GlobalSky/1.0' } });
    return { ok: res.ok, status: res.status, finalUrl: res.url };
  } catch (error) {
    return { ok: false, status: 0, error: String(error?.name || error) };
  } finally { clearTimeout(timer); }
}

function updateHealth(camera, result) {
  const failures = result.ok ? 0 : (camera.health?.failures || 0) + 1;
  let status = camera.status;
  if (!result.ok && failures >= 3) status = 'OFFLINE';
  else if (!result.ok) status = 'DEGRADED';
  else if (['OFFLINE', 'DEGRADED', 'APPROVED'].includes(status)) status = 'LIVE';
  const prior = camera.health?.score ?? 80;
  const score = result.ok ? Math.min(100, prior + 2) : Math.max(0, prior - 18);
  return {
    ...camera,
    status,
    health: { ...camera.health, score, failures, last_checked_at: nowIso(), last_http_status: result.status, last_reason: result.ok ? 'public source responded' : `source check failed${result.status ? ` HTTP ${result.status}` : ''}` }
  };
}

export async function healthCheckBatch(limit = 8) {
  const registry = await loadRegistry();
  const candidates = registry.filter((c) => c.enabled !== false && c.source_page).sort((a,b) => String(a.health?.last_checked_at||'').localeCompare(String(b.health?.last_checked_at||''))).slice(0, limit);
  const ids = new Set(candidates.map((c) => c.camera_id));
  const results = new Map();
  for (const camera of candidates) results.set(camera.camera_id, await fetchHead(camera.source_page));
  const next = registry.map((camera) => ids.has(camera.camera_id) ? updateHealth(camera, results.get(camera.camera_id)) : camera);
  await saveRegistry(next);
  return next;
}

export async function youtubeDiscover(city) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return { discovered: [], message: 'YouTube discovery skipped: YOUTUBE_API_KEY is not configured.' };
  const query = `${city.city} ${city.country} live camera webcam`;
  const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
  searchUrl.search = new URLSearchParams({ part: 'snippet', eventType: 'live', type: 'video', maxResults: '10', q: query, key }).toString();
  const sr = await fetch(searchUrl);
  if (!sr.ok) return { discovered: [], message: `YouTube search failed HTTP ${sr.status}.` };
  const sj = await sr.json();
  const ids = (sj.items || []).map((x) => x.id?.videoId).filter(Boolean);
  if (!ids.length) return { discovered: [], message: `No live YouTube candidates found for ${city.city}.` };
  const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
  detailsUrl.search = new URLSearchParams({ part: 'snippet,status,liveStreamingDetails', id: ids.join(','), key }).toString();
  const dr = await fetch(detailsUrl);
  if (!dr.ok) return { discovered: [], message: `YouTube verification failed HTTP ${dr.status}.` };
  const dj = await dr.json();
  const discovered = (dj.items || []).filter((v) => v.snippet?.liveBroadcastContent === 'live' && v.status?.privacyStatus === 'public' && v.status?.embeddable === true).map((v) => normalizeCamera({
    camera_id: `CAM-YT-${v.id}`,
    city: city.city, country: city.country, region: city.region, timezone: null,
    provider: v.snippet?.channelTitle || 'YouTube Live',
    feed_type: 'iframe', embed_url: `https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&mute=1&playsinline=1&rel=0`, source_page: `https://www.youtube.com/watch?v=${v.id}`,
    enabled: true, priority: 70, status: 'LIVE',
    title: v.snippet?.title || '',
    health: { score: 88, failures: 0, last_checked_at: nowIso(), last_reason: 'YouTube Data API says live/public/embeddable' },
    eligibility: { embed_confirmed: true, rights_status: 'platform_embedding_allowed' },
    evidence: { verified_at: nowIso(), adapter: 'youtube-data-api-v3' }
  }));
  return { discovered, message: `${discovered.length} live/public/embeddable YouTube candidate(s) verified for ${city.city}.` };
}

export async function runScoutOnce() {
  let state = await loadScoutState();
  const city = CITY_QUEUE[state.queue_index % CITY_QUEUE.length];
  let registry = await healthCheckBatch(8);
  const result = await youtubeDiscover(city);
  let added = 0;
  for (const candidate of result.discovered) {
    const idx = registry.findIndex((c) => c.camera_id === candidate.camera_id);
    if (idx >= 0) registry[idx] = { ...registry[idx], ...candidate };
    else { registry.push(candidate); added += 1; }
  }
  await saveRegistry(registry);
  const entry = { time: nowIso(), city, discovered: added, message: result.message };
  state = {
    ...state,
    queue_index: (state.queue_index + 1) % CITY_QUEUE.length,
    total_runs: (state.total_runs || 0) + 1,
    last_city: city,
    last_message: result.message,
    last_run_at: entry.time,
    recent: [entry, ...(state.recent || [])].slice(0, 50)
  };
  await saveScoutState(state);
  await appendEvent({ event_type: 'SCOUT_RUN', city: city.city, country: city.country, discovered: added, message: result.message });
  return { state, registry, discovered: added };
}

export function registryStats(registry) {
  const counts = {};
  for (const c of registry) counts[c.status] = (counts[c.status] || 0) + 1;
  return { total: registry.length, counts, live_countries: new Set(registry.filter((c) => c.status === 'LIVE').map((c) => c.country)).size };
}

export async function scoutStatus() {
  const registry = await loadRegistry();
  const state = await loadScoutState();
  return { stats: registryStats(registry), state, latest: [...registry].sort((a,b) => String(b.health?.last_checked_at||'').localeCompare(String(a.health?.last_checked_at||''))).slice(0, 30) };
}

export async function getStoredSession(id) {
  return STORE.get(`session/${id}`, { type: 'json' });
}
