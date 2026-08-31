const SID = "1NA3jrA3gdctbpfhXtz2TAiRGRFWsyWRTT6EvoJNIfUw";
const PASSED = [
  "The Met Open Access",
  "NASA",
  "Smithsonian Open Access",
  "Library of Congress",
  "NOAA",
  "USGS",
  "Art Institute of Chicago",
  "Cleveland Museum of Art",
  "National Gallery of Art",
];
const PARKED_PUBLIC = [
  "Europeana",
  "New York Public Library",
  "Biodiversity Heritage Library",
  "Getty Open Content",
  "Wildcard",
];
const RESERVE = "Barb Originals";

function clean(v){return String(v ?? "").trim()}
function hash(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function json(body,status=200){return Response.json(body,{status,headers:{"cache-control":"no-store"}})}
function parseCSV(s){const out=[];let r=[],f="",q=false;for(let i=0;i<s.length;i++){const c=s[i];if(q){if(c==='"'&&s[i+1]==='"'){f+='"';i++}else if(c==='"')q=false;else f+=c}else if(c==='"')q=true;else if(c===','){r.push(f);f=""}else if(c==='\n'){r.push(f);out.push(r);r=[];f=""}else if(c!=='\r')f+=c}if(f||r.length){r.push(f);out.push(r)}return out}
function table(raw,header){const rr=parseCSV(raw),h=rr.findIndex(r=>clean(r[0]).toLowerCase()===header.toLowerCase());if(h<0)throw new Error(`${header} header not found`);const heads=rr[h].map(clean);return rr.slice(h+1).filter(r=>r.some(Boolean)).map(r=>Object.fromEntries(heads.map((k,i)=>[k,clean(r[i])]))) }
async function getText(url,ms=9000){const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);try{const r=await fetch(url,{signal:c.signal,cache:"no-store"});if(!r.ok)throw new Error(`HTTP ${r.status}`);const raw=await r.text();if(/<html|accounts\.google\.com|sign in/i.test(raw))throw new Error("Theme Sources is not anonymously readable");return raw}finally{clearTimeout(t)}}
async function getJSON(url,ms=25000){const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);try{const r=await fetch(url,{signal:c.signal,cache:"no-store"});let data=null;try{data=await r.json()}catch{data={error:`Non-JSON response · HTTP ${r.status}`}}return{ok:r.ok,status:r.status,data}}finally{clearTimeout(t)}}
async function themeRows(){const urls=[`https://docs.google.com/spreadsheets/d/${SID}/export?format=csv&gid=2000682467`,`https://docs.google.com/spreadsheets/d/${SID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent("Theme Sources")}&headers=0`];let last="";for(const u of urls){try{return table(await getText(u),"source_name")}catch(e){last=e.message}}throw new Error(last||"Theme Sources unavailable")}
function poolFromRows(rows){const byName=new Map(rows.map(r=>[r.source_name,r]));return PASSED.map(name=>({source_name:name,weight:Math.max(0,Number(byName.get(name)?.weight)||1),sheet_enabled:clean(byName.get(name)?.enabled).toLowerCase()==="yes"})).filter(x=>x.weight>0)}
function weightedPick(pool,seed,salt){const total=pool.reduce((n,x)=>n+x.weight,0);let p=(hash(`${seed}|${salt}`)/4294967296)*total;for(const item of pool){p-=item.weight;if(p<0)return item}return pool.at(-1)}

export default async request=>{
  if(request.method!=="GET")return json({error:"Method not allowed"},405);
  const url=new URL(request.url);
  const failed=clean(url.searchParams.get("failed_source"))||"Europeana";
  const seed=clean(url.searchParams.get("seed"))||String(Date.now());
  const synthetic=Math.max(0,Math.min(4,Number(url.searchParams.get("force_randomizer_failures"))||0));
  const maxAttempts=Math.max(1,Math.min(5,Number(url.searchParams.get("max_attempts"))||3));

  if(!PARKED_PUBLIC.includes(failed)&&failed!==RESERVE){
    return json({status:"INVALID_TEST_SOURCE",allowed:[...PARKED_PUBLIC,RESERVE]},400);
  }

  if(failed===RESERVE){
    return json({
      status:"RESERVE_TANTRUM_SIMULATED",
      lab_only:true,
      failed_source:RESERVE,
      randomizer_used:false,
      expected_next_step:"hard_safe_fallback",
      note:"Barb Originals is the emergency reserve, not a public rotation world. If the reserve itself cannot serve, the safe behavior is to stop rather than randomize into an unverified public source.",
      production_policy_changed:false,
    });
  }

  let rows=[];
  try{rows=await themeRows()}catch(e){
    return json({status:"LAB_CONTROL_UNAVAILABLE",failed_source:failed,error:e.message,production_policy_changed:false},503);
  }

  let remaining=poolFromRows(rows);
  const randomizerPool=remaining.map(x=>({...x,eligible_in_lab:true,note:x.sheet_enabled?"currently enabled in sheet":"sheet disabled; allowed only because this is a lab dry-run"}));
  const attempts=[];
  let winner=null;
  let winnerResult=null;

  for(let i=0;i<maxAttempts&&remaining.length;i++){
    const pick=weightedPick(remaining,seed,`attempt-${i}`);
    remaining=remaining.filter(x=>x.source_name!==pick.source_name);

    if(i<synthetic){
      attempts.push({attempt:i+1,source:pick.source_name,weight:pick.weight,outcome:"SYNTHETIC_TANTRUM",detail:"Forced by lab control before source retrieval."});
      continue;
    }

    const endpoint=new URL("/.netlify/functions/daily-discover-production",url.origin);
    endpoint.searchParams.set("lab","1");
    endpoint.searchParams.set("force_source",pick.source_name);
    const result=await getJSON(endpoint.href);
    const primarySucceeded=result.ok&&result.data?.served_source===pick.source_name&&result.data?.service_mode==="primary"&&Array.isArray(result.data?.assets)&&result.data.assets.length>=3;
    attempts.push({
      attempt:i+1,
      source:pick.source_name,
      weight:pick.weight,
      http_status:result.status,
      outcome:primarySucceeded?"PRIMARY_SUCCESS":"TANTRUM_OR_BLOCKED",
      served_source:result.data?.served_source||null,
      service_mode:result.data?.service_mode||null,
      error:result.data?.error||result.data?.message||null,
    });
    if(primarySucceeded){winner=pick.source_name;winnerResult=result.data;break}
  }

  if(winner){
    return json({
      status:"RANDOMIZER_RECOVERED",
      lab_only:true,
      failed_source:failed,
      trigger_reason:"Parked/waiting source tantrum simulated",
      randomizer_pool:randomizerPool,
      attempts,
      selected_replacement:winner,
      selected_assets:winnerResult.assets,
      selected_daily_settings:winnerResult.daily_settings,
      next_if_replacement_failed:"randomizer tries another confirmed source until the lab attempt limit is reached",
      after_randomizer_exhaustion:"Barb Originals reserve would be the next safety layer if this experimental policy were ever adopted",
      production_policy_changed:false,
      note:"This endpoint never enables Theme Sources and calls Daily Discover only with lab=1, so it does not create a daily lock or write history.",
    });
  }

  return json({
    status:"RANDOMIZER_EXHAUSTED",
    lab_only:true,
    failed_source:failed,
    randomizer_pool:randomizerPool,
    attempts,
    selected_replacement:null,
    expected_next_step:"Barb Originals emergency reserve, then hard safe fallback if reserve cannot serve",
    production_policy_changed:false,
  },503);
};