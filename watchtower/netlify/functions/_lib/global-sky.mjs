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

function camera({ id, city, country, provider, embed, source, region = 'Unknown', timezone = null, priority = 80, status = 'APPROVED', feed_type = 'iframe', image_url = null, refresh_ms = null, rights = 'embed_observed', score = 90, attribution = null }) {
  return {
    camera_id: id, city, country, region, timezone, provider,
    feed_type, embed_url: embed, source_page: source, image_url, refresh_ms,
    enabled: true, priority, status, attribution,
    health: { score, failures: status === 'OFFLINE' ? 5 : 0, last_reason: status === 'OFFLINE' ? 'known offline baseline' : 'seeded verified source' },
    eligibility: { embed_confirmed: Boolean(embed), rights_status: rights }
  };
}

/* Exact 21-camera detached-stage baseline recovered from the production HTML.
   New verified sources are appended below; nothing healthy is removed merely
   to keep the registry small. */
const BASELINE_21 = [
  camera({ id:'CAM-JP-TOKYO-CS-40395', city:'Tokyo', country:'Japan', region:'Asia-Pacific', timezone:'Asia/Tokyo', provider:'CamStreamer', embed:'https://camstreamer.com/embed/o7mryKeoHnXlRoy3nXvC81BdvOah3ah4PuSOq1HJ?rel=0', source:'https://camstreamer.com/live/stream/40395', priority:92 }),
  camera({ id:'CAM-CH-FRIBOURG-CS-553877878', city:'Fribourg', country:'Switzerland', region:'Europe', provider:'CamStreamer', embed:'https://camstreamer.com/embed/Du1Uqnqi1d0qfovWhhAckD3li6nOJax2RMbx95cZ?rel=0', source:'https://camstreamer.com/live/stream/553877878' }),
  camera({ id:'CAM-NL-OOSTVOORNE-CS-607202149', city:'Oostvoorne', country:'Netherlands', region:'Europe', provider:'CamStreamer', embed:'https://camstreamer.com/embed/w0kg58wMqXWBrHBfxkM8oIMhEjxRktEpHQr6NGdC?rel=0', source:'https://camstreamer.com/live/stream/607202149-beachcam' }),
  camera({ id:'CAM-NO-SETERTREKKET-CS-204420247', city:'Setertrekket', country:'Norway', region:'Europe', provider:'CamStreamer', embed:'https://camstreamer.com/embed/0wd5neFMSF1aeM29ZsWXzYEWpwx5VgBQtLRA64nC?rel=0', source:'https://camstreamer.com/live/stream/204420247' }),
  camera({ id:'CAM-SI-JASNA-CS-692726513', city:'Lake Jasna', country:'Slovenia', region:'Europe', provider:'CamStreamer', embed:'https://camstreamer.com/embed/Py3vgJQ9GXPvK1AmGRf62gdn0egevB1w2DMMRsMO?rel=0', source:'https://camstreamer.com/live/stream/692726513' }),
  camera({ id:'CAM-AU-SYDNEY-CS-410679206', city:'Sydney', country:'Australia', region:'Asia-Pacific', timezone:'Australia/Sydney', provider:'CamStreamer', embed:'https://camstreamer.com/embed/Z8IhXeCiHAfjQL03C2yjT2nGS7zGm9NP6w183z6j?rel=0', source:'https://camstreamer.com/live/stream/410679206-webcamsydney-1-live-streaming-24-7' }),
  camera({ id:'CAM-CA-VANCOUVER-CS-526832658', city:'Vancouver', country:'Canada', region:'North America', timezone:'America/Vancouver', provider:'CamStreamer', embed:'https://camstreamer.com/embed/fKa0Q1zsJoDg5D16CdKPa4AkpcCtkm4HAbc7n2Hi?rel=0', source:'https://camstreamer.com/live/stream/526832658-vancouver-axis-experience-center' }),
  camera({ id:'CAM-US-LEAVENWORTH-CS-17221', city:'Leavenworth', country:'USA', region:'North America', provider:'CamStreamer', embed:'https://camstreamer.com/embed/eea079bb6297816/S-46651?rel=0', source:'https://camstreamer.com/live/stream/17221' }),
  camera({ id:'CAM-US-REDONDO-CS-120182330', city:'Redondo Beach', country:'USA', region:'North America', provider:'CamStreamer', embed:'https://camstreamer.com/embed/XVFR6bFxh1cv0DdXsZyY4FfMHnmUmeEEsGi9C0IB?rel=0', source:'https://camstreamer.com/live/stream/120182330-city-of-redondo-beach-pier' }),
  camera({ id:'CAM-FI-LEVI-CS-16836', city:'Levi', country:'Finland', region:'Europe', provider:'CamStreamer', embed:'https://camstreamer.com/embed/927b2286a32979d/S-45861?rel=0', source:'https://camstreamer.com/live/stream/16836-zero-point-levi-finland' }),
  camera({ id:'CAM-FI-ROVANIEMI-CS-6452', city:'Rovaniemi', country:'Finland', region:'Europe', provider:'CamStreamer', embed:'https://camstreamer.com/embed/3f975add95a6a58/S-20998?rel=0', source:'https://camstreamer.com/live/stream/6452-santa-claus-village-finland' }),
  camera({ id:'CAM-NL-AMSTERDAM-CS-5926', city:'Amsterdam', country:'Netherlands', region:'Europe', provider:'CamStreamer', embed:'https://camstreamer.com/embed/48d16a84aa9b599/S-19623?rel=0', source:'https://camstreamer.com/live/stream/5926-amsterdam-stationseiland-live-stream' }),
  camera({ id:'CAM-JP-KYOTO-CS-32268', city:'Kyoto', country:'Japan', region:'Asia-Pacific', timezone:'Asia/Tokyo', provider:'CamStreamer', embed:'https://camstreamer.com/embed/KkhErkLlHgbt6wzZTRQFCYo0WVXVyWdkQEbLU01r?rel=0', source:'https://camstreamer.com/live/stream/32268-kyoto-station' }),
  camera({ id:'CAM-US-JACKSON-CS-4227', city:'Jackson Hole', country:'USA', region:'North America', provider:'CamStreamer', embed:'https://camstreamer.com/embed/c07545fd297103d/S-14597?rel=0', source:'https://camstreamer.com/live/stream/4227-town-square-with-elk-antler-arches' }),
  camera({ id:'CAM-KR-SEOUL-PLAZA-SMG-24H', city:'Seoul', country:'South Korea', region:'Asia-Pacific', timezone:'Asia/Seoul', provider:'Seoul Metropolitan Government / YouTube', embed:'https://www.youtube-nocookie.com/embed/Viz_M5aGZ0o?autoplay=1&mute=1&playsinline=1&rel=0', source:'https://english.seoul.go.kr/news-events/multimedia/seoul-live/', priority:94, rights:'official_public_live_embed' }),
  camera({ id:'CAM-TH-BANGKOK-SOI11-STV-567', city:'Bangkok Soi 11', country:'Thailand', region:'Asia-Pacific', timezone:'Asia/Bangkok', provider:'SeeTheView / YouTube', embed:'https://www.youtube-nocookie.com/embed/UemFRPrl1hk?autoplay=1&mute=1&playsinline=1&rel=0', source:'https://seetheview.com/cam/567/el-gaucho-restaurant-soi-11-sukhumvit-road-bangkok-live-webcam' }),
  camera({ id:'CAM-TH-BANGKOK-SOI19-STV-1206', city:'Bangkok Soi 19', country:'Thailand', region:'Asia-Pacific', timezone:'Asia/Bangkok', provider:'SeeTheView / YouTube', embed:'https://www.youtube-nocookie.com/embed/Q71sLS8h9a4?autoplay=1&mute=1&playsinline=1&rel=0', source:'https://seetheview.com/cam/1206/el-gaucho-restaurant-soi-19-sukhumvit-road-bangkok-live' }),
  camera({ id:'CAM-PH-MANILA-EDSA-CUBAO-OC-282196', city:'EDSA Cubao', country:'Philippines', region:'Asia-Pacific', timezone:'Asia/Manila', provider:'MMDA / OpenCCTV', embed:'https://opencctv.org/cameras/philippines/metro-manila/quezon-city/edsa-cubao-282196', source:'https://opencctv.org/cameras/philippines/metro-manila/quezon-city/edsa-cubao-282196', feed_type:'image', image_url:'https://mmdatraffic.interax.ph/system/getSnapshot?id=edsa-cubao', refresh_ms:60000, status:'OFFLINE', score:20, rights:'provider_publishes_iframe_embed_code' }),
  camera({ id:'CAM-PH-MANILA-NLEX-MINDANAO-OC-282233', city:'NLEX Mindanao Ave', country:'Philippines', region:'Asia-Pacific', timezone:'Asia/Manila', provider:'MMDA / OpenCCTV', embed:'https://opencctv.org/cameras/philippines/metro-manila/quezon-city/nlex-mindanao-avenue-282233', source:'https://opencctv.org/cameras/philippines/metro-manila/quezon-city/nlex-mindanao-avenue-282233', feed_type:'image', image_url:'https://mmdatraffic.interax.ph/system/getSnapshot?id=nlex-mindanao-ave', refresh_ms:60000, status:'OFFLINE', score:20, rights:'provider_publishes_iframe_embed_code' }),
  camera({ id:'CAM-HK-WANCHAI-TIMES-SQUARE-OC-109792', city:'Wan Chai', country:'Hong Kong', region:'Asia-Pacific', timezone:'Asia/Hong_Kong', provider:'HK Transport Department / OpenCCTV', embed:'https://opencctv.org/cameras/hong-kong-sar-china/hong-kong-island/wan-chai/canal-road-flyover-near-times-square-h216f-109792', source:'https://opencctv.org/cameras/hong-kong-sar-china/hong-kong-island/wan-chai/canal-road-flyover-near-times-square-h216f-109792', feed_type:'image', image_url:'https://tdcctv.data.one.gov.hk/H216F.JPG', refresh_ms:120000, rights:'government_image_via_provider_embed' }),
  camera({ id:'CAM-HK-CAUSEWAY-BAY-OC-126853', city:'Causeway Bay', country:'Hong Kong', region:'Asia-Pacific', timezone:'Asia/Hong_Kong', provider:'HK Transport Department / OpenCCTV', embed:'https://opencctv.org/cameras/hong-kong-sar-china/causeway-bay/causeway-bay-126853', source:'https://opencctv.org/cameras/hong-kong-sar-china/causeway-bay/causeway-bay-126853', feed_type:'image', image_url:'https://tdcctv.data.one.gov.hk/H305F.JPG', refresh_ms:30000, rights:'government_image_via_provider_embed' })
];

/* Seven additions verified on 2026-09-05. Direct player URLs are used where the
   provider page exposes a YouTube embed, rather than embedding directory wrappers. */
const NEW_2026_09_05 = [
  camera({ id:'CAM-JP-TOKYO-STATION-20260905', city:'Tokyo Station – Marunouchi Plaza', country:'Japan', region:'Asia-Pacific', timezone:'Asia/Tokyo', provider:'Otemachi-Marunouchi-Yurakucho District Council / YouTube', embed:'https://www.youtube-nocookie.com/embed/ZN4gh5IOowM?autoplay=1&mute=1&playsinline=1&rel=0', source:'https://seetheview.com/cam/1811/tokyo-station-marunouchi-plaza-live-camera', priority:99, status:'LIVE', score:99, rights:'reuse_allowed_with_attribution', attribution:'Otemachi–Marunouchi–Yurakucho District Council' }),
  camera({ id:'CAM-JP-YOKOSUKA-NAGAI-20260905', city:'Nagai Fishing Harbor', country:'Japan', region:'Asia-Pacific', timezone:'Asia/Tokyo', provider:'Yokosuka City Official Channel / YouTube', embed:'https://www.youtube-nocookie.com/embed/pkonyjvd7xU?autoplay=1&mute=1&playsinline=1&rel=0', source:'https://seetheview.com/cam/2470/nagai-fishing-harbor-main-port-disaster-surveillance-camera', priority:100, status:'LIVE', score:100, rights:'official_city_public_live_embed' }),
  camera({ id:'CAM-JP-SHINJUKU-EAST-20260905', city:'Shinjuku Station East Exit', country:'Japan', region:'Asia-Pacific', timezone:'Asia/Tokyo', provider:'Cross Space Shinjuku / Webcamtaxi YouTube embed', embed:'https://www.youtube-nocookie.com/embed/live_stream?channel=UC8cnCaq-MquhsebMer9A9rQ&autoplay=1&mute=1&playsinline=1&rel=0', source:'https://www.webcamtaxi.com/en/japan/tokyo/cross-space-shinjuku.html', priority:94, status:'LIVE', score:94, rights:'provider_page_exposes_youtube_iframe' }),
  camera({ id:'CAM-KR-SEOUL-NAMSAN-20260905', city:'Namsan / YTN Seoul Tower', country:'South Korea', region:'Asia-Pacific', timezone:'Asia/Seoul', provider:'YTN Seoul Tower Official YouTube', embed:'https://www.youtube-nocookie.com/embed/M6lq50Ptp1g?autoplay=1&mute=1&playsinline=1&rel=0', source:'https://www.youtube.com/watch?v=M6lq50Ptp1g', priority:98, status:'LIVE', score:98, rights:'official_youtube_live_embed' }),
  camera({ id:'CAM-JP-HAKONE-JUKKOKU-20260905', city:'Jukkoku Pass – Panorama Terrace 1059', country:'Japan', region:'Asia-Pacific', timezone:'Asia/Tokyo', provider:'Fujiyama NAVI / YouTube', embed:'https://www.youtube-nocookie.com/embed/4Hro9QIrsYA?autoplay=1&mute=1&playsinline=1&rel=0', source:'https://seetheview.com/cam/2534/jukkoku-pass-mt-fuji-view-live-camera', priority:96, status:'LIVE', score:97, rights:'provider_page_exposes_youtube_embed' }),
  camera({ id:'CAM-JP-FUJI-VIEW-HOTEL-20260905', city:'Fuji View Hotel', country:'Japan', region:'Asia-Pacific', timezone:'Asia/Tokyo', provider:'Fuji View Hotel / YouTube', embed:'https://www.youtube-nocookie.com/embed/6sin2Z5WM3I?autoplay=1&mute=1&playsinline=1&rel=0', source:'https://seetheview.com/cam/2537/mt-fuji-from-fuji-view-hotel', priority:95, status:'LIVE', score:96, rights:'first_party_hotel_live_via_youtube_embed' }),
  camera({ id:'CAM-ID-BALI-TROPICAL-20260905', city:'Bali Tropical Beach', country:'Indonesia', region:'Asia-Pacific', timezone:'Asia/Makassar', provider:'Luxury Island / YouTube', embed:'https://www.youtube-nocookie.com/embed/1avu7zP4dnU?autoplay=1&mute=1&playsinline=1&rel=0', source:'https://seetheview.com/cam/395/bali-tropical-beach-live-ocean-waves-sounds-24-7', priority:82, status:'LIVE', score:88, rights:'provider_page_exposes_youtube_embed_independent_operator' })
];

const SEED = [...BASELINE_21, ...NEW_2026_09_05];

function normalizeCamera(c) {
  return {
    status:'APPROVED', enabled:true, priority:50, region:'Unknown', feed_type:'iframe',
    health:{ score:80, failures:0, last_reason:'not checked yet' },
    eligibility:{ embed_confirmed:false, rights_status:'unverified' },
    ...c,
    health:{ score:80, failures:0, last_reason:'not checked yet', ...(c.health || {}) },
    eligibility:{ embed_confirmed:false, rights_status:'unverified', ...(c.eligibility || {}) }
  };
}

export async function loadRegistry() {
  let registry = await STORE.get(REGISTRY_KEY, { type:'json' });
  if (!Array.isArray(registry)) registry = [];
  const byId = new Map(registry.map((c) => [c.camera_id, normalizeCamera(c)]));
  let changed = registry.length === 0;
  for (const seeded of SEED) {
    if (!byId.has(seeded.camera_id)) { byId.set(seeded.camera_id, normalizeCamera(seeded)); changed = true; }
  }
  registry = [...byId.values()];
  if (changed) await STORE.setJSON(REGISTRY_KEY, registry);
  return registry;
}

export async function saveRegistry(registry) { await STORE.setJSON(REGISTRY_KEY, registry.map(normalizeCamera)); }
export async function loadScoutState() { return (await STORE.get(STATE_KEY, { type:'json' })) || { queue_index:0, total_runs:0, last_city:null, last_message:'Scout initialized', recent:[] }; }
export async function saveScoutState(state) { await STORE.setJSON(STATE_KEY, state); }

export async function appendEvent(event) {
  const events = (await STORE.get(EVENTS_KEY, { type:'json' })) || [];
  const row = { timestamp_utc:nowIso(), ...event };
  events.push(row);
  await STORE.setJSON(EVENTS_KEY, events.slice(-1000));
  return row;
}
export async function getEvents(broadcastId = null) {
  const events = (await STORE.get(EVENTS_KEY, { type:'json' })) || [];
  return broadcastId ? events.filter((x) => x.broadcast_id === broadcastId) : events;
}

function window2m(now = Date.now()) { const slot = Math.floor(now / 120000); const started = slot * 120000; return { slot, started, next:started + 120000 }; }
export function broadcastId(now = Date.now()) {
  const d = new Date(window2m(now).started); const p = (n) => String(n).padStart(2,'0');
  return `MWAW-${d.getUTCFullYear()}${p(d.getUTCMonth()+1)}${p(d.getUTCDate())}-${p(d.getUTCHours())}${p(d.getUTCMinutes())}`;
}
function eligible(c) { return c.enabled !== false && ['LIVE','APPROVED'].includes(c.status) && c.eligibility?.embed_confirmed && (c.embed_url || c.image_url); }
function hash(text) { let h=2166136261; for (let i=0;i<text.length;i++){ h^=text.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }

export function selectCameras(registry, id, count = 7) {
  const ranked = registry.filter(eligible).map((c) => ({ c, rank:(c.priority||0)*1000+(c.health?.score||0)*10+(hash(`${id}:${c.camera_id}`)%1000) })).sort((a,b)=>b.rank-a.rank);
  const chosen=[]; const countries=new Map();
  for (const {c} of ranked) {
    if (chosen.length>=count) break;
    const n=countries.get(c.country)||0;
    if (n>=2 && ranked.length>count) continue;
    chosen.push(c); countries.set(c.country,n+1);
  }
  for (const {c} of ranked) { if (chosen.length>=count) break; if (!chosen.some((x)=>x.camera_id===c.camera_id)) chosen.push(c); }
  return chosen.map((camera,i)=>({ slot:i+1, camera:clone(camera) }));
}

export async function currentSession() {
  const id=broadcastId(); let session=await STORE.get(CURRENT_SESSION_KEY,{type:'json'});
  if (!session || session.broadcast_id!==id) {
    const registry=await loadRegistry(); const {started,next}=window2m();
    session={ broadcast_id:id, status:'ACTIVE', started_at_utc:new Date(started).toISOString(), next_set_utc:new Date(next).toISOString(), selected:selectCameras(registry,id,7), standby:[], decisions:[] };
    await STORE.setJSON(CURRENT_SESSION_KEY,session); await STORE.setJSON(`session/${id}`,session);
    await appendEvent({ broadcast_id:id, event_type:'SESSION_STARTED', message:`${session.selected.length} cameras selected.` });
  }
  return session;
}

function youtubeId(c) {
  const m = String(c.embed_url||'').match(/\/embed\/([A-Za-z0-9_-]{6,20})/);
  return m?.[1] && m[1] !== 'live_stream' ? m[1] : null;
}
async function genericCheck(url, timeoutMs=8000) {
  const ctrl=new AbortController(); const timer=setTimeout(()=>ctrl.abort(),timeoutMs);
  try { const res=await fetch(url,{redirect:'follow',signal:ctrl.signal,headers:{'User-Agent':'CoachDollPatrols-GlobalSky/1.0'}}); return {ok:res.ok,status:res.status}; }
  catch(error){ return {ok:false,status:0,error:String(error?.name||error)}; }
  finally{ clearTimeout(timer); }
}
async function checkCamera(c) {
  const id=youtubeId(c); const key=process.env.YOUTUBE_API_KEY;
  if (id && key) {
    const u=new URL('https://www.googleapis.com/youtube/v3/videos'); u.search=new URLSearchParams({part:'status,snippet,liveStreamingDetails',id,key}).toString();
    try { const r=await fetch(u); if (r.ok) { const j=await r.json(); const v=j.items?.[0]; const ok=Boolean(v && v.status?.privacyStatus==='public' && v.status?.embeddable===true && v.snippet?.liveBroadcastContent==='live'); return {ok,status:r.status,reason:ok?'YouTube confirms live/public/embeddable':'YouTube no longer confirms live/public/embeddable'}; } } catch(_) {}
  }
  const r=await genericCheck(c.image_url || c.source_page || c.embed_url);
  return {...r,reason:r.ok?'public source responded':'source check failed'};
}
function applyHealth(c,r) {
  const failures=r.ok?0:(c.health?.failures||0)+1; let status=c.status;
  if (!r.ok && failures>=3) status='OFFLINE'; else if (!r.ok) status='DEGRADED'; else if (['OFFLINE','DEGRADED','APPROVED'].includes(status)) status='LIVE';
  const prior=c.health?.score??80; const score=r.ok?Math.min(100,prior+2):Math.max(0,prior-18);
  return {...c,status,health:{...c.health,score,failures,last_checked_at:nowIso(),last_http_status:r.status,last_reason:r.reason||(r.ok?'public source responded':'source check failed')}};
}
export async function healthCheckBatch(limit=8) {
  const registry=await loadRegistry();
  const batch=registry.filter((c)=>c.enabled!==false&&(c.source_page||c.image_url)).sort((a,b)=>String(a.health?.last_checked_at||'').localeCompare(String(b.health?.last_checked_at||''))).slice(0,limit);
  const checks=new Map(); for (const c of batch) checks.set(c.camera_id,await checkCamera(c));
  const next=registry.map((c)=>checks.has(c.camera_id)?applyHealth(c,checks.get(c.camera_id)):c); await saveRegistry(next); return next;
}

export async function youtubeDiscover(city) {
  const key=process.env.YOUTUBE_API_KEY;
  if (!key) return { discovered:[], message:'YouTube discovery skipped: YOUTUBE_API_KEY is not configured.' };
  const search=new URL('https://www.googleapis.com/youtube/v3/search'); search.search=new URLSearchParams({part:'snippet',eventType:'live',type:'video',maxResults:'10',q:`${city.city} ${city.country} live camera webcam`,key}).toString();
  const sr=await fetch(search); if(!sr.ok) return {discovered:[],message:`YouTube search failed HTTP ${sr.status}.`};
  const sj=await sr.json(); const ids=(sj.items||[]).map((x)=>x.id?.videoId).filter(Boolean); if(!ids.length) return {discovered:[],message:`No live YouTube candidates found for ${city.city}.`};
  const details=new URL('https://www.googleapis.com/youtube/v3/videos'); details.search=new URLSearchParams({part:'snippet,status,liveStreamingDetails',id:ids.join(','),key}).toString();
  const dr=await fetch(details); if(!dr.ok) return {discovered:[],message:`YouTube verification failed HTTP ${dr.status}.`}; const dj=await dr.json();
  const discovered=(dj.items||[]).filter((v)=>v.snippet?.liveBroadcastContent==='live'&&v.status?.privacyStatus==='public'&&v.status?.embeddable===true).map((v)=>camera({ id:`CAM-YT-${v.id}`, city:city.city, country:city.country, region:city.region, provider:v.snippet?.channelTitle||'YouTube Live', embed:`https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&mute=1&playsinline=1&rel=0`, source:`https://www.youtube.com/watch?v=${v.id}`, priority:70, status:'LIVE', score:88, rights:'platform_embedding_allowed' }));
  return { discovered, message:`${discovered.length} live/public/embeddable YouTube candidate(s) verified for ${city.city}.` };
}

export async function runScoutOnce() {
  let state=await loadScoutState(); const city=CITY_QUEUE[state.queue_index%CITY_QUEUE.length]; let registry=await healthCheckBatch(8); const result=await youtubeDiscover(city); let added=0;
  for (const candidate of result.discovered) { const i=registry.findIndex((c)=>c.camera_id===candidate.camera_id); if(i>=0) registry[i]={...registry[i],...candidate}; else {registry.push(candidate);added++;} }
  await saveRegistry(registry); const entry={time:nowIso(),city,discovered:added,message:result.message};
  state={...state,queue_index:(state.queue_index+1)%CITY_QUEUE.length,total_runs:(state.total_runs||0)+1,last_city:city,last_message:result.message,last_run_at:entry.time,recent:[entry,...(state.recent||[])].slice(0,50)};
  await saveScoutState(state); await appendEvent({event_type:'SCOUT_RUN',city:city.city,country:city.country,discovered:added,message:result.message}); return {state,registry,discovered:added};
}
export function registryStats(registry){const counts={};for(const c of registry)counts[c.status]=(counts[c.status]||0)+1;return{total:registry.length,counts,live_countries:new Set(registry.filter((c)=>c.status==='LIVE').map((c)=>c.country)).size};}
export async function scoutStatus(){const registry=await loadRegistry();const state=await loadScoutState();return{stats:registryStats(registry),state,latest:[...registry].sort((a,b)=>String(b.health?.last_checked_at||'').localeCompare(String(a.health?.last_checked_at||''))).slice(0,30)};}
export async function getStoredSession(id){return STORE.get(`session/${id}`,{type:'json'});}
