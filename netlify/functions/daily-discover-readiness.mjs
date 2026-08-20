import { getStore } from "@netlify/blobs";

const SID = "1TSpt_DxEDhpsXE09lNx8S63b7cDomEXhVua--p99DGM";
const TZ = "Asia/Manila";
const PASSED = new Set([
  "The Met Open Access",
  "NASA",
  "Smithsonian Open Access",
  "Library of Congress",
  "NOAA",
  "USGS",
  "Art Institute of Chicago",
  "Cleveland Museum of Art",
  "National Gallery of Art",
]);
const PARKED = {
  "Europeana": "credential required; live proof pending",
  "New York Public Library": "credential required; live proof pending",
  "Biodiversity Heritage Library": "credential required; live proof pending",
  "Getty Open Content": "rights-safe retrieval needs refinement",
  "Wildcard": "pre-approved rights-safe pool not defined",
};

function dateManila(){
  const p=new Intl.DateTimeFormat("en-CA",{timeZone:TZ,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
  const g=t=>p.find(x=>x.type===t)?.value;
  return `${g("year")}-${g("month")}-${g("day")}`;
}
function response(body,status=200){return Response.json(body,{status,headers:{"cache-control":"no-store"}})}
function parseCSV(s){const out=[];let r=[],f="",q=false;for(let i=0;i<s.length;i++){const c=s[i];if(q){if(c==='"'&&s[i+1]==='"'){f+='"';i++}else if(c==='"')q=false;else f+=c}else if(c==='"')q=true;else if(c===','){r.push(f);f=""}else if(c==='\n'){r.push(f);out.push(r);r=[];f=""}else if(c!=='\r')f+=c}if(f||r.length){r.push(f);out.push(r)}return out}
function table(raw,header){const rr=parseCSV(raw),h=rr.findIndex(r=>String(r[0]||"").trim().toLowerCase()===header.toLowerCase());if(h<0)throw new Error(`${header} header not found`);const heads=rr[h].map(x=>String(x).trim());return rr.slice(h+1).filter(r=>r.some(Boolean)).map(r=>Object.fromEntries(heads.map((k,i)=>[k,String(r[i]||"").trim()]))) }
async function fetchText(url,ms=9000){const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);try{const r=await fetch(url,{signal:c.signal,cache:"no-store"});if(!r.ok)throw new Error(`HTTP ${r.status}`);return await r.text()}finally{clearTimeout(t)}}
async function readSheet(sheet,header,gid=""){
  const urls=gid?[`https://docs.google.com/spreadsheets/d/${SID}/export?format=csv&gid=${gid}`,`https://docs.google.com/spreadsheets/d/${SID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}&headers=0`]:[`https://docs.google.com/spreadsheets/d/${SID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}&headers=0`];
  let last="";
  for(const url of urls){try{const raw=await fetchText(url);if(/<html|accounts\.google\.com|sign in/i.test(raw)){last=`${sheet} is not anonymously readable`;continue}return table(raw,header)}catch(e){last=e.message||"fetch failed"}}
  throw new Error(last||`${sheet} unavailable`);
}
function normalizeImage(value){const v=String(value||"").trim();if(!v)return"";try{const u=new URL(v);if(!/^https?:$/.test(u.protocol))return"";return u.href}catch{return""}}
function reserveSummary(rows){const seen=new Set(),families=new Set();let enabled=0;for(const r of rows){if(String(r.enabled||"").toLowerCase()!=="yes")continue;const image=normalizeImage(r.media_url);if(!image||seen.has(image))continue;seen.add(image);enabled++;if(r.family)families.add(String(r.family).trim())}return{enabled_unique_images:enabled,minimum_required:3,ready:enabled>=3,families:[...families].filter(Boolean)}}
function sourceSummary(rows){
  const configured=rows.map(r=>({source_name:r.source_name,enabled:String(r.enabled||"").toLowerCase()==="yes",weight:Number(r.weight)||0,daily_asset_count:Number(r.daily_asset_count)||3,rotation_seconds:Number(r.rotation_seconds)||18,passed:PASSED.has(r.source_name),parked_reason:PARKED[r.source_name]||null}));
  const production_enabled=configured.filter(x=>x.passed&&x.enabled&&x.weight>0);
  const armable=configured.filter(x=>x.passed&&x.weight>0);
  const unsafe_enabled=configured.filter(x=>!x.passed&&x.enabled);
  return{configured,production_enabled,armable,unsafe_enabled};
}
function credentialStatus(){return{
  europeana:{configured:!!Netlify.env.get("EUROPEANA_API_KEY")},
  nypl:{configured:!!Netlify.env.get("NYPL_API_TOKEN")},
  bhl:{configured:!!Netlify.env.get("BHL_API_KEY")},
  smithsonian:{configured:!!Netlify.env.get("SMITHSONIAN_API_KEY"),optional:true},
}}
function overallState({sources,reserve,themeOk,reserveOk}){
  if(!themeOk)return"BLOCKED_THEME_SOURCES";
  if(sources.unsafe_enabled.length)return"BLOCKED_UNVERIFIED_SOURCE_ENABLED";
  const armed=sources.production_enabled.length>0;
  if(!reserveOk&&!armed)return"WAITING_FOR_RESERVE_AND_ARMING";
  if(!reserveOk&&armed)return"ARMED_WITHOUT_RESERVE";
  if(reserveOk&&!armed)return"READY_TO_ARM";
  return"ARMED_WITH_RESERVE";
}
function prodContext(){return Netlify.context?.deploy?.context==="production"}

export default async request=>{
  if(request.method!=="GET")return response({error:"Method not allowed"},405);
  const date=dateManila(),checks={theme_sources:{ok:false,error:null},barb_originals:{ok:false,error:null},shared_store:{ok:false,error:null}};
  let themeRows=[],barbRows=[];
  try{themeRows=await readSheet("Theme Sources","source_name","342757810");checks.theme_sources.ok=true}catch(e){checks.theme_sources.error=e.message}
  try{barbRows=await readSheet("Barb Originals","asset_name");checks.barb_originals.ok=true}catch(e){checks.barb_originals.error=e.message}
  const sources=sourceSummary(themeRows),reserve=reserveSummary(barbRows),credentials=credentialStatus();
  let today=null,history=null;
  if(prodContext()){
    try{
      const store=getStore("barbph-daily-discover",{consistency:"strong"});
      [today,history]=await Promise.all([store.get(`day/${date}`,{type:"json"}),store.get("history/recent",{type:"json"})]);
      checks.shared_store.ok=true;
    }catch(e){checks.shared_store.error=e.message}
  }else checks.shared_store.error="Readiness endpoint is not running in production context";
  const historyDays=Array.isArray(history?.days)?history.days.length:0;
  const state=overallState({sources,reserve,themeOk:checks.theme_sources.ok,reserveOk:checks.barb_originals.ok&&reserve.ready});
  const blockers=[];
  if(!checks.theme_sources.ok)blockers.push("Theme Sources cannot be read");
  if(sources.unsafe_enabled.length)blockers.push("At least one unverified/parked source is enabled");
  if(!reserve.ready)blockers.push(`Barb Originals reserve has ${reserve.enabled_unique_images}/3 enabled unique images`);
  if(!sources.production_enabled.length)blockers.push("No confirmed source is production-enabled yet");
  return response({
    system:"BARBPH DAILY DISCOVER — PRODUCTION READINESS",
    date_manila:date,
    state,
    production_armed:sources.production_enabled.length>0,
    production_enabled_sources:sources.production_enabled.map(x=>x.source_name),
    confirmed_passed_sources:[...PASSED],
    armable_confirmed_sources:sources.armable.map(x=>x.source_name),
    unverified_enabled_sources:sources.unsafe_enabled.map(x=>x.source_name),
    reserve,
    credentials,
    shared_state:{today_locked:!!today,today_served_source:today?.served_source||null,today_daily_set_id:today?.daily_set_id||null,history_days:historyDays,history_updated_at:history?.updated_at||null},
    checks,
    blockers,
    note:"Read-only readiness diagnostic. It does not enable sources, change spreadsheet controls, write history, or create a Daily Discover set."
  },checks.theme_sources.ok?200:503)
};