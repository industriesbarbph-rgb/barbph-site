import { getStore } from "@netlify/blobs";

const SID = "1TSpt_DxEDhpsXE09lNx8S63b7cDomEXhVua--p99DGM";
const TZ = "Asia/Manila";
const POOL_VERSION = "2026-08-20-passed-9-history-v1";
const HISTORY_KEY = "history/recent";
const PASSED = new Set([
  "The Met Open Access","NASA","Smithsonian Open Access","Library of Congress","NOAA","USGS",
  "Art Institute of Chicago","Cleveland Museum of Art","National Gallery of Art"
]);

function clean(v){return String(v??"").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim()}
function hash(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function dateManila(){const p=new Intl.DateTimeFormat("en-CA",{timeZone:TZ,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date()),g=t=>p.find(x=>x.type===t)?.value;return `${g("year")}-${g("month")}-${g("day")}`}
function addDays(date,delta){const d=new Date(`${date}T00:00:00Z`);d.setUTCDate(d.getUTCDate()+delta);return d.toISOString().slice(0,10)}
async function getText(url,ms=9000){const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);try{const r=await fetch(url,{signal:c.signal,cache:"no-store"});if(!r.ok)throw new Error(`HTTP ${r.status}`);return await r.text()}finally{clearTimeout(t)}}
function parseCSV(s){const out=[];let r=[],f="",q=false;for(let i=0;i<s.length;i++){const c=s[i];if(q){if(c==='"'&&s[i+1]==='"'){f+='"';i++}else if(c==='"')q=false;else f+=c}else if(c==='"')q=true;else if(c===','){r.push(f);f=""}else if(c==='\n'){r.push(f);out.push(r);r=[];f=""}else if(c!=='\r')f+=c}if(f||r.length){r.push(f);out.push(r)}return out}
function table(raw,header){const rr=parseCSV(raw),h=rr.findIndex(r=>String(r[0]||"").trim().toLowerCase()===header.toLowerCase());if(h<0)throw new Error(`${header} header not found`);const heads=rr[h].map(x=>String(x).trim());return rr.slice(h+1).filter(r=>r.some(Boolean)).map(r=>Object.fromEntries(heads.map((k,i)=>[k,String(r[i]||"").trim()]))) }
async function themeRows(){const urls=[`https://docs.google.com/spreadsheets/d/${SID}/export?format=csv&gid=342757810`,`https://docs.google.com/spreadsheets/d/${SID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent("Theme Sources")}&headers=0`];let last="";for(const u of urls){try{const raw=await getText(u);if(/<html|accounts\.google\.com|sign in/i.test(raw)){last="Theme Sources is not anonymously readable";continue}return table(raw,"source_name")}catch(e){last=e.message}}throw new Error(last||"Theme Sources unavailable")}
function weightedChoice(eligible,date,salt=""){const total=eligible.reduce((a,r)=>a+(+r.weight),0);let p=(hash(`barbph|${date}|production|${POOL_VERSION}|${salt}`)/4294967296)*total;for(const r of eligible){p-=+r.weight;if(p<0)return r}return eligible.at(-1)}
function forecast(rows,date,last){const eligible=rows.filter(r=>String(r.enabled).toLowerCase()==="yes"&&PASSED.has(r.source_name)&&+r.weight>0);if(!eligible.length)return null;const reduced=last&&last!=="Barb Originals"&&eligible.length>1?eligible.filter(r=>r.source_name!==last):eligible;return weightedChoice(reduced.length?reduced:eligible,date,last||"none")?.source_name||null}
function pack(record,scheduledFallback=null,live=false){if(!record&&!scheduledFallback)return null;const scheduled=clean(record?.scheduled_source||scheduledFallback),served=clean(record?.served_source||scheduled);return{scheduled,served,fallback:Boolean(scheduled&&served&&scheduled!==served),live:Boolean(live&&record)}}
function publicationURL(rows){for(const row of rows){const u=clean(row.publication_url||row.live_telecast_publication_url||"");if(/^https:\/\//i.test(u)||/^\//.test(u))return u}return ""}

export default async request=>{
  if(request.method!=="GET")return Response.json({error:"Method not allowed"},{status:405});
  try{
    const rows=await themeRows(),today=dateManila(),yesterday=addDays(today,-1),tomorrow=addDays(today,1);
    const store=getStore("barbph-daily-discover",{consistency:"strong"});
    const hist=await store.get(HISTORY_KEY,{type:"json"}).catch(()=>null);
    const history=Array.isArray(hist?.days)?hist.days:[];
    const y=history.find(x=>x?.date_manila===yesterday)||null;
    const tDay=await store.get(`day/${today}`,{type:"json"}).catch(()=>null);
    const tHist=history.find(x=>x?.date_manila===today)||null;
    const t=tDay||tHist||null;
    const scheduledToday=clean(t?.scheduled_source)||forecast(rows,today,clean(y?.served_source)||null);
    const todayPacked=pack(t,scheduledToday,true);
    const tomorrowScheduled=forecast(rows,tomorrow,todayPacked?.served||scheduledToday||null);
    return Response.json({
      date_manila:today,
      yesterday:pack(y),
      today:todayPacked,
      tomorrow:tomorrowScheduled?{scheduled:tomorrowScheduled,served:"",fallback:false,live:false}:null,
      publication_url:publicationURL(rows),
      updated_label:`TRANSMISSION LOG · MANILA ${today}`
    },{headers:{"cache-control":"public, max-age=60, s-maxage=180"}});
  }catch(error){return Response.json({error:"Schedule unavailable",detail:String(error?.message||error)},{status:503,headers:{"cache-control":"no-store"}})}
};
