import dailyStream from "./daily-stream.mjs";
import { recordPublicSystemEvent, systemsStore, manilaDate, cleanSystemsText } from "./_systems-ledger.mjs";

function iso(value){
  const d=new Date(value);
  return Number.isNaN(d.getTime())?new Date().toISOString():d.toISOString();
}

function durationLabel(start,end=Date.now()){
  const ms=Math.max(0,end-Date.parse(start||''));
  if(!Number.isFinite(ms))return '';
  const total=Math.floor(ms/1000),m=Math.floor(total/60),sec=total%60,h=Math.floor(m/60),min=m%60;
  return h?`${h}h ${min}m ${sec}s`:`${m}m ${sec}s`;
}

async function recordFailure(data,url,statusCode){
  const date=cleanSystemsText(data?.date_manila,10)||manilaDate();
  const store=systemsStore(false);
  const stateKey=`systems/state/${date}`;
  const previous=await store.get(stateKey,{type:"json"}).catch(()=>null);
  const status=cleanSystemsText(data?.status,80)||`HTTP ${statusCode}`;
  const hour=new Date().toISOString().slice(0,13);
  const incident=await recordPublicSystemEvent({
    date_manila:date,type:"SYSTEM_UNRESOLVED",system:"Daily Discover",
    expected:"Keep a usable source or protected reserve available to BarbPH",
    happened:`Daily Discover entered ${status}`,
    action:"Held the public stage in a protected state while recovery is attempted",
    result:"UNRESOLVED"
  },{storeOverride:store,dedupeKey:`unresolved-${date}-${status}-${hour}`}).catch(()=>null);
  await store.setJSON(stateKey,{
    mode:"unresolved",scheduled_source:cleanSystemsText(data?.scheduled_source,100),served_source:cleanSystemsText(data?.served_source,100),
    generation:0,incident_event_id:incident?.id||previous?.incident_event_id||null,
    fallback_started_at:previous?.fallback_started_at||new Date().toISOString(),updated_at:new Date().toISOString()
  }).catch(()=>{});
}

async function recordSnapshot(data,url){
  if(!data?.date_manila)return;
  const date=cleanSystemsText(data.date_manila,10)||manilaDate();
  const store=systemsStore(false);
  const scheduled=cleanSystemsText(data.scheduled_source,100)||"Daily Discover source";
  const served=cleanSystemsText(data.served_source,100)||scheduled;
  const mode=cleanSystemsText(data.service_mode,60).toLowerCase()||"primary";
  const generation=Number(data?.stream?.generation)||0;
  const health=cleanSystemsText(data?.stream?.source_health,50).toLowerCase();
  const fallbackReason=cleanSystemsText(data?.fallback_reason,180);
  const stateKey=`systems/state/${date}`;
  const previous=await store.get(stateKey,{type:"json"}).catch(()=>null);

  await recordPublicSystemEvent({
    date_manila:date,
    type:"SOURCE_SELECTED",
    system:"Daily Discover",
    expected:"Assign an enabled production source for the Manila day",
    happened:`${scheduled} is the scheduled source`,
    action:"Daily source assignment locked",
    result:"NORMAL"
  },{storeOverride:store,dedupeKey:`source-selected-${date}-${scheduled}`}).catch(()=>{});

  if(generation>0){
    await recordPublicSystemEvent({
      date_manila:date,
      type:"BATCH_REFRESHED",
      system:"Daily Discover",
      expected:`Receive eligible material from ${scheduled}`,
      happened:`Generation ${generation} is serving ${served}`,
      action:mode==="primary"?"Accepted the current source batch":"Protected the live stage with controlled fallback service",
      result:mode==="primary"?"NORMAL":"FALLBACK"
    },{storeOverride:store,dedupeKey:`batch-${date}-${served}-${new Date().toISOString().slice(0,13)}-${mode}`}).catch(()=>{});
  }

  let incidentEventId=previous?.incident_event_id||null;
  let fallbackStartedAt=previous?.fallback_started_at||null;

  if(mode==="barb_reserve"){
    const fallbackEvent=await recordPublicSystemEvent({
      date_manila:date,
      type:"BARB_ORIGINALS_ENGAGED",
      system:"Daily Discover",
      expected:`Primary material from ${scheduled}`,
      happened:fallbackReason?`${scheduled} could not provide the required batch: ${fallbackReason}`:`${scheduled} could not provide the currently required usable batch`,
      action:"Barb Originals emergency reserve engaged",
      result:"FALLBACK"
    },{storeOverride:store,dedupeKey:`reserve-${date}-${generation}-${scheduled}`}).catch(()=>null);
    incidentEventId=fallbackEvent?.id||incidentEventId;
    fallbackStartedAt=fallbackStartedAt||new Date().toISOString();
  }else if(mode==="same_source_cache"){
    const fallbackEvent=await recordPublicSystemEvent({
      date_manila:date,
      type:"SAME_SOURCE_CACHE_ENGAGED",
      system:"Daily Discover",
      expected:`Fresh material from ${scheduled}`,
      happened:fallbackReason?`Fresh retrieval was temporarily unavailable: ${fallbackReason}`:"Fresh retrieval was temporarily unavailable",
      action:`Kept last-known-good ${scheduled} material on screen`,
      result:"FALLBACK"
    },{storeOverride:store,dedupeKey:`cache-${date}-${generation}-${scheduled}`}).catch(()=>null);
    incidentEventId=fallbackEvent?.id||incidentEventId;
    fallbackStartedAt=fallbackStartedAt||new Date().toISOString();
  }

  if(previous?.mode && previous.mode!=="primary" && mode==="primary"){
    const duration=previous?.fallback_started_at?durationLabel(previous.fallback_started_at):'';
    await recordPublicSystemEvent({
      date_manila:date,
      type:"SOURCE_RECOVERED",
      system:"Daily Discover",
      expected:`${scheduled} should return to normal service`,
      happened:`${served} resumed primary delivery${duration?` after ${duration}`:''}`,
      action:"Primary source service restored",
      result:"RECOVERED",
      related_event_id:previous?.incident_event_id||null
    },{storeOverride:store,dedupeKey:`recovered-${date}-${generation}-${served}`}).catch(()=>{});
  }else if(health && !["healthy","unknown"].includes(health) && mode==="primary"){
    await recordPublicSystemEvent({
      date_manila:date,
      type:"SOURCE_NOTICE",
      system:"Daily Discover",
      expected:`${scheduled} should remain healthy`,
      happened:`Source health reported ${health}`,
      action:"Kept the live stage under controlled source protection",
      result:"NOTICE"
    },{storeOverride:store,dedupeKey:`health-${date}-${health}-${generation}-${scheduled}`}).catch(()=>{});
  }

  const slot=Number(url.searchParams.get("watchtower_slot"));
  if(Number.isFinite(slot)&&slot>0){
    const outcome=cleanSystemsText(url.searchParams.get("watchtower_outcome"),20).toLowerCase()==="offline"?"offline":"normal";
    const readyAt=Number(url.searchParams.get("watchtower_ready_at"));
    const slotIso=iso(slot);
    await recordPublicSystemEvent({
      at:slotIso,date_manila:date,type:"WATCHTOWER_STARTED",system:"Watchtower",
      expected:"Open the scheduled Watchtower live world window",
      happened:"The hourly Watchtower interval began",
      action:"BarbPH opened the live world interlude",
      result:"NORMAL"
    },{storeOverride:store,dedupeKey:`watchtower-${slot}-started`}).catch(()=>{});

    if(outcome==="normal"&&Number.isFinite(readyAt)&&readyAt>=slot){
      await recordPublicSystemEvent({
        at:iso(readyAt),date_manila:date,type:"WATCHTOWER_FRAME_READY",system:"Watchtower",
        expected:"Load the Watchtower frame within the grace window",
        happened:"The Watchtower frame reported ready",
        action:"Live world window remained on screen",
        result:"NORMAL"
      },{storeOverride:store,dedupeKey:`watchtower-${slot}-ready`}).catch(()=>{});
    }
    if(outcome==="offline"){
      await recordPublicSystemEvent({
        date_manila:date,type:"WATCHTOWER_LOAD_FAILED",system:"Watchtower",
        expected:"Load the Watchtower frame within the grace window",
        happened:"The live frame did not become ready within the allowed window",
        action:"Closed the interlude and protected the homepage experience",
        result:"INCIDENT"
      },{storeOverride:store,dedupeKey:`watchtower-${slot}-offline`}).catch(()=>{});
    }
    await recordPublicSystemEvent({
      date_manila:date,type:"WATCHTOWER_ENDED",system:"Watchtower",
      expected:"Complete the scheduled live world window",
      happened:"The observed Watchtower interval ended",
      action:"Closed the live world window",
      result:outcome==="offline"?"NOTICE":"NORMAL"
    },{storeOverride:store,dedupeKey:`watchtower-${slot}-ended`}).catch(()=>{});
    await recordPublicSystemEvent({
      date_manila:date,type:"BARBPH_RETURNED",system:"Homepage",
      expected:"Resume BarbPH after the Watchtower interval",
      happened:"BarbPH returned to the visual world",
      action:"Continuous source resync requested",
      result:outcome==="offline"?"RECOVERED":"NORMAL"
    },{storeOverride:store,dedupeKey:`watchtower-${slot}-returned`}).catch(()=>{});
  }

  const enteringFallback=mode!=="primary"&&previous?.mode!==mode;
  await store.setJSON(stateKey,{
    mode,scheduled_source:scheduled,served_source:served,generation,
    incident_event_id:mode==="primary"?null:incidentEventId,
    fallback_started_at:mode==="primary"?null:(enteringFallback?(fallbackStartedAt||new Date().toISOString()):(fallbackStartedAt||new Date().toISOString())),
    updated_at:new Date().toISOString()
  }).catch(()=>{});
}

export default async request=>{
  const response=await dailyStream(request);
  const url=new URL(request.url);
  const productionRead=request.method==="GET"&&url.searchParams.get("lab")!=="1";
  if(productionRead){
    try{
      const data=await response.clone().json();
      if(response.ok)await recordSnapshot(data,url);
      else await recordFailure(data,url,response.status);
    }catch{}
  }
  const cacheable=productionRead&&response.ok;
  if(!cacheable)return response;

  const headers=new Headers(response.headers);
  headers.set("Cache-Control","public, max-age=15");
  headers.set("Netlify-CDN-Cache-Control","public, durable, s-maxage=60, stale-while-revalidate=300");
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
};
