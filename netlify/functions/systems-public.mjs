import { manilaDate, mapContinuousEvent, makePublicEvent, systemsStore } from './_systems-ledger.mjs';

const ARCHIVE_START = '2026-08-30';

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      'cache-control': status === 200 ? 'public, max-age=20' : 'no-store',
      'Netlify-CDN-Cache-Control': status === 200 ? 'public, durable, s-maxage=60, stale-while-revalidate=180' : 'no-store'
    }
  });
}
function validDate(v) { return /^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`)); }

async function listPrefix(store, prefix) {
  const result = await store.list({ prefix });
  const blobs = Array.isArray(result?.blobs) ? result.blobs : [];
  const docs = [];
  for (let i=0;i<blobs.length;i+=100) {
    const batch = await Promise.all(blobs.slice(i,i+100).map(blob => store.get(blob.key,{type:'json'}).catch(()=>null)));
    docs.push(...batch);
  }
  return docs.filter(doc=>doc?.id&&doc?.at).map(doc=>makePublicEvent(doc));
}

async function permanentEvents(store, date) {
  return listPrefix(store, `systems/events/${date}/`);
}

async function legacyToday(store,date) {
  const legacy = await store.get(`continuous/events/${date}`,{type:'json'}).catch(()=>null);
  const rows = Array.isArray(legacy?.events) ? legacy.events : [];
  return rows.map((row,index)=>{
    const mapped = mapContinuousEvent(row.type,row,date);
    if (!mapped) return null;
    return makePublicEvent({...mapped,id:`legacy-${date}-${index+1}`,at:row.at||new Date().toISOString()});
  }).filter(Boolean);
}

function summarize(events) {
  const count = type => events.filter(e=>e.type===type).length;
  const results = events.reduce((a,e)=>{a[e.result]=(a[e.result]||0)+1;return a;},{});
  const unresolved = results.UNRESOLVED||0;
  const incidents = (results.INCIDENT||0)+unresolved;
  return {
    transmissions:count('BATCH_REFRESHED')+count('SOURCE_SELECTED'),
    incidents,
    recoveries:results.RECOVERED||0,
    barb_originals_activations:count('BARB_ORIGINALS_ENGAGED')+count('BARB_ORIGINALS_ADMIN_HOLD'),
    watchtower_sessions:count('WATCHTOWER_STARTED'),
    unresolved,
    overall_status:unresolved?'UNRESOLVED':incidents?'INCIDENT':(results.FALLBACK||0)?'FALLBACK':'NORMAL'
  };
}

export default async request => {
  if (request.method !== 'GET') return json({error:'Method not allowed'},405);
  const url = new URL(request.url);
  const range = 'today';
  const requested = url.searchParams.get('date');
  const date = validDate(requested) ? requested : manilaDate();
  const store = systemsStore(false);
  try {
    let events = await permanentEvents(store,date);
    if (!events.length) {
      const legacy = await legacyToday(store,date);
      if (legacy.length) events=legacy;
    }
    events.sort((a,b)=>String(b.at).localeCompare(String(a.at)));
    if (events.length > 12000) events = events.slice(0,12000);
    return json({
      system:'BARBPH SYSTEMS',
      archive_start:ARCHIVE_START,
      date_manila:date,
      range,
      generated_at:new Date().toISOString(),
      events,
      summary:summarize(events)
    });
  } catch {
    return json({error:'Systems ledger temporarily unavailable'},503);
  }
};
