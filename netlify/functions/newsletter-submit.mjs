const FORM_ID = "1FAIpQLScEhOayq1REf29-2cFxVxdaCXJaHFA3yP4z_rY5pF8HixQnkg";
const VIEW_URL = `https://docs.google.com/forms/d/e/${FORM_ID}/viewform`;
const RESPONSE_URL = `https://docs.google.com/forms/d/e/${FORM_ID}/formResponse`;

function json(body,status=200){
  return Response.json(body,{status,headers:{"cache-control":"no-store"}});
}
function norm(v){
  return String(v||"").toLowerCase().replace(/\s+/g," ").trim();
}
function validEmail(v){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||"").trim());
}
function extractPublicLoad(html){
  const marker = "FB_PUBLIC_LOAD_DATA_";
  const start = html.indexOf(marker);
  if(start < 0) throw new Error("Google Form metadata not found");
  const eq = html.indexOf("=",start);
  const end = html.indexOf(";</script>",eq);
  if(eq < 0 || end < 0) throw new Error("Google Form metadata could not be parsed");
  return JSON.parse(html.slice(eq+1,end).trim());
}
function collectQuestions(node,out=[]){
  if(!Array.isArray(node)) return out;
  const title = typeof node[1] === "string" ? node[1] : "";
  const entry = Array.isArray(node[4]) && Array.isArray(node[4][0]) ? node[4][0] : null;
  const entryId = entry && Number.isInteger(entry[0]) ? entry[0] : null;
  if(title && entryId){
    out.push({title,entryId,required:Boolean(entry[2])});
  }
  for(const child of node) if(Array.isArray(child)) collectQuestions(child,out);
  return out;
}
async function loadQuestions(){
  const c = new AbortController();
  const t = setTimeout(()=>c.abort(),12000);
  try{
    const r = await fetch(VIEW_URL,{signal:c.signal,cache:"no-store",headers:{"user-agent":"Mozilla/5.0"}});
    if(!r.ok) throw new Error(`Google Form unavailable (HTTP ${r.status})`);
    const html = await r.text();
    const data = extractPublicLoad(html);
    const seen = new Set();
    return collectQuestions(data).filter(q=>{
      const k = `${q.entryId}|${q.title}`;
      if(seen.has(k)) return false;
      seen.add(k); return true;
    });
  } finally { clearTimeout(t); }
}

export default async request => {
  if(request.method !== "POST") return json({ok:false,error:"Method not allowed"},405);
  let payload={};
  try{ payload = await request.json(); }catch{}
  const email = String(payload.email||"").trim().toLowerCase();
  if(!validEmail(email)) return json({ok:false,error:"Please enter a valid email address."},400);

  let questions;
  try{ questions = await loadQuestions(); }
  catch(e){ return json({ok:false,error:e.message},502); }

  const emailQ = questions.find(q=>norm(q.title).includes("email address")) || questions.find(q=>norm(q.title).includes("email"));
  const messageQ = questions.find(q=>norm(q.title)==="your message") || questions.find(q=>norm(q.title).includes("message"));
  if(!emailQ || !messageQ){
    return json({ok:false,error:"The linked Google Form fields could not be resolved."},502);
  }

  const body = new URLSearchParams();
  body.set(`entry.${emailQ.entryId}`,email);
  body.set(`entry.${messageQ.entryId}`,"BARBPH_NEWSLETTER");

  // Satisfy any other required text fields without exposing them in the BarbPH UI.
  for(const q of questions){
    if(!q.required || q.entryId===emailQ.entryId || q.entryId===messageQ.entryId) continue;
    const t = norm(q.title);
    if(t.includes("name")) body.set(`entry.${q.entryId}`,"Newsletter");
    else if(t.includes("vber") || t.includes("viber")) body.set(`entry.${q.entryId}`,"N/A");
    else body.set(`entry.${q.entryId}`,"N/A");
  }
  body.set("fvv","1");
  body.set("pageHistory","0");
  body.set("draftResponse","[]");

  const c = new AbortController();
  const timer = setTimeout(()=>c.abort(),12000);
  try{
    const r = await fetch(RESPONSE_URL,{
      method:"POST",
      signal:c.signal,
      redirect:"follow",
      headers:{"content-type":"application/x-www-form-urlencoded;charset=UTF-8","user-agent":"Mozilla/5.0"},
      body:body.toString()
    });
    const text = await r.text();
    if(!r.ok) return json({ok:false,error:`Google Form submission failed (HTTP ${r.status}).`},502);
    if(/There was a problem|response has not been recorded|invalid/i.test(text)){
      return json({ok:false,error:"Google Form did not accept the signup."},502);
    }
    return json({ok:true,message:"You’re on the list. ✦"});
  } catch(e){
    return json({ok:false,error:`Newsletter signup failed: ${e.message}`},502);
  } finally { clearTimeout(timer); }
};
