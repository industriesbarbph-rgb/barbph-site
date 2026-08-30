import { getStore } from "@netlify/blobs";

const TZ="Asia/Manila";
function dateManila(){const p=new Intl.DateTimeFormat("en-CA",{timeZone:TZ,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date()),g=t=>p.find(x=>x.type===t)?.value;return`${g("year")}-${g("month")}-${g("day")}`}
function clean(v){return String(v??"").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim()}
export default async request=>{
  if(request.method!=="GET")return Response.json({error:"Method not allowed"},{status:405});
  if(Netlify.context?.deploy?.context!=="production")return Response.json({status:"PREVIEW",message:"Operational state is isolated from production on non-production deploys."},{headers:{"cache-control":"no-store"}});
  const date=dateManila(),s=getStore("barbph-daily-discover",{consistency:"strong"});
  try{const [control,stream,health,eventDoc,history]=await Promise.all([s.get(`continuous/day/${date}/control`,{type:"json"}),s.get(`continuous/day/${date}/stream`,{type:"json"}),s.get(`continuous/day/${date}/health`,{type:"json"}),s.get(`continuous/events/${date}`,{type:"json"}),s.get("continuous/history/days",{type:"json"})]);const events=(Array.isArray(eventDoc?.events)?eventDoc.events:[]).slice(-100);return Response.json({system:"BARBPH CONTINUOUS SOURCE — OPERATIONS LOG",date_manila:date,scheduled_source:clean(control?.scheduled_source),served_source:clean(stream?.served_source),service_mode:clean(stream?.service_mode),source_health:clean(health?.state||stream?.stream?.source_health),generation:Number(stream?.generation)||0,last_success_at:health?.last_success_at||null,last_failure_at:health?.last_failure_at||null,next_retry_at:health?.next_retry_at||null,last_error:clean(health?.last_error),events,history_days:Array.isArray(history?.days)?history.days.length:0},{headers:{"cache-control":"private, max-age=0, no-store"}})}catch(error){return Response.json({error:"Operations log unavailable",detail:String(error?.message||error)},{status:503,headers:{"cache-control":"no-store"}})}
};
