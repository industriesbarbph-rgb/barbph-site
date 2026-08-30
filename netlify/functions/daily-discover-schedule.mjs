import { getStore } from "@netlify/blobs";

const SID="1TSpt_DxEDhpsXE09lNx8S63b7cDomEXhVua--p99DGM",TZ="Asia/Manila",ENGINE_VERSION="2026-08-30-continuous-v1";
function clean(v){return String(v??"").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim()}
function hash(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function dateManila(){const p=new Intl.DateTimeFormat("en-CA",{timeZone:TZ,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date()),g=t=>p.find(x=>x.type===t)?.value;return`${g("year")}-${g("month")}-${g("day")}`}
function addDays(date,n){const d=new Date(`${date}T00:00:00Z`);d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)}
async function text(url,ms=9000){const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);try{const r=await fetch(url,{signal:c.signal,cache:"no-store"});if(!r.ok)throw new Error(`HTTP ${r.status}`);return await r.text()}finally{clearTimeout(t)}}
function parseCSV(s){const out=[];let r=[],f="",q=false;for(let i=0;i<s.length;i++){const c=s[i];if(q){if(c==='"'&&s[i+1]==='"'){f+='"';i++}else if(c==='"')q=false;else f+=c}else if(c==='"')q=true;else if(c===','){r.push(f);f=""}else if(c==='\n'){r.push(f);out.push(r);r=[];f=""}else if(c!=='\r')f+=c}if(f||r.length){r.push(f);out.push(r)}return out}
function table(raw,header){const rows=parseCSV(raw),i=rows.findIndex(r=>clean(r[0]).toLowerCase()===header.toLowerCase());if(i<0)throw new Error(`${header} header not found`);const h=rows[i].map(clean);return rows.slice(i+1).filter(r=>r.some(Boolean)).map(r=>Object.fromEntries(h.map((k,j)=>[k,clean(r[j])]))) }
async function rows(){const raw=await text(`https://docs.google.com/spreadsheets/d/${SID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent("Theme Sources")}&headers=0`);if(/<html|accounts\.google\.com|sign in/i.test(raw))throw new Error("Theme Sources is not anonymously readable");return table(raw,"source_name")}
function eligible(sourceRows){return sourceRows.filter(r=>clean(r.enabled).toLowerCase()==="yes"&&Number(r.weight)>0&&clean(r.adapter_key)&&["PRODUCTION_READY","PRODUCTION"].includes(clean(r.production_status).toUpperCase()))}
function forecast(sourceRows,date,last=""){const pool=eligible(sourceRows),reduced=last&&pool.length>1?pool.filter(r=>clean(r.source_name)!==last):pool;if(!reduced.length)return null;const total=reduced.reduce((n,r)=>n+(Number(r.weight)||0),0);let p=(hash(`${ENGINE_VERSION}|${date}|${last}`)/4294967296)*total;for(const r of reduced){p-=Number(r.weight)||0;if(p<0)return clean(r.source_name)}return clean(reduced.at(-1)?.source_name)}
function pack(record,scheduledFallback=null,live=false){if(!record&&!scheduledFallback)return null;const scheduled=clean(record?.scheduled_source||scheduledFallback),served=clean(record?.served_source||scheduled);return{scheduled,served,fallback:Boolean(scheduled&&served&&scheduled!==served),live:Boolean(live&&record),service_mode:clean(record?.service_mode||""),source_health:clean(record?.stream?.source_health||"")}}
function publicationURL(sourceRows){for(const row of sourceRows){const u=clean(row.publication_url||row.live_telecast_publication_url||"");if(/^https:\/\//i.test(u)||/^\//.test(u))return u}return""}
function prod(){return Netlify.context?.deploy?.context==="production"}
export default async request=>{
  if(request.method!=="GET")return Response.json({error:"Method not allowed"},{status:405});
  try{
    const sourceRows=await rows(),today=dateManila(),yesterday=addDays(today,-1),tomorrow=addDays(today,1);let history={days:[]},todayRecord=null;
    if(prod()){const s=getStore("barbph-daily-discover",{consistency:"strong"});[history,todayRecord]=await Promise.all([s.get("continuous/history/days",{type:"json"}).catch(()=>({days:[]})),s.get(`day/${today}`,{type:"json"}).catch(()=>null)]);history=history||{days:[]}}
    const days=Array.isArray(history?.days)?history.days:[],y=days.find(x=>x?.date_manila===yesterday)||null,tHist=days.find(x=>x?.date_manila===today)||null,t=todayRecord||tHist||null;
    const scheduledToday=clean(t?.scheduled_source)||forecast(sourceRows,today,clean(y?.scheduled_source||y?.served_source));const todayPacked=pack(t,scheduledToday,true);const tomorrowScheduled=forecast(sourceRows,tomorrow,todayPacked?.scheduled||scheduledToday||null);
    return Response.json({date_manila:today,yesterday:pack(y),today:todayPacked,tomorrow:tomorrowScheduled?{scheduled:tomorrowScheduled,served:"",fallback:false,live:false}:null,publication_url:publicationURL(sourceRows),engine_version:ENGINE_VERSION,updated_label:`TRANSMISSION LOG · MANILA ${today}`},{headers:{"cache-control":"public, max-age=60, s-maxage=180"}})
  }catch(error){return Response.json({error:"Schedule unavailable",detail:String(error?.message||error)},{status:503,headers:{"cache-control":"no-store"}})}
};
