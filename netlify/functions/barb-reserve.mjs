function parseCSV(text){const rows=[];let row=[],field="",quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'&&text[i+1]==='"'){field+='"';i++}else if(c==='"')quoted=false;else field+=c}else if(c==='"')quoted=true;else if(c===','){row.push(field);field=""}else if(c==='\n'){row.push(field);rows.push(row);row=[];field=""}else if(c!=='\r')field+=c}if(field||row.length){row.push(field);rows.push(row)}return rows}
function hash(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function json(body,status=200){return Response.json(body,{status,headers:{"cache-control":status===200?"public, max-age=300, s-maxage=1800":"no-store"}})}
function normalizeImageURL(value){const v=String(value||"").trim();if(!v)return"";try{const u=new URL(v);if(!/^https?:$/.test(u.protocol))return"";if(u.hostname==="drive.google.com"){const id=u.pathname.match(/\/d\/([^/]+)/)?.[1]||u.searchParams.get("id");if(id)return`https://drive.google.com/uc?export=view&id=${encodeURIComponent(id)}`}u.protocol="https:";return u.href}catch{return""}}

export default async request=>{
  if(request.method!=="GET")return json({error:"Method not allowed"},405);
  const url=new URL(request.url),count=Math.max(3,Math.min(5,Number(url.searchParams.get("count"))||3)),seed=Math.abs(Number(url.searchParams.get("seed"))||1);
  const sheet="https://docs.google.com/spreadsheets/d/1TSpt_DxEDhpsXE09lNx8S63b7cDomEXhVua--p99DGM/gviz/tq?tqx=out:csv&sheet=Barb%20Originals&headers=0";
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
  let raw;
  try{const r=await fetch(sheet,{signal:controller.signal,cache:"no-store"});if(!r.ok)return json({error:`Barb Originals sheet unavailable (HTTP ${r.status}).`},502);raw=await r.text()}catch(e){return json({error:`Barb Originals sheet unavailable (${e?.message||"request failed"}).`},502)}finally{clearTimeout(timer)}
  if(/<html|accounts\.google\.com|sign in/i.test(raw))return json({error:"Barb Originals sheet is not anonymously readable."},503);
  const rows=parseCSV(raw),headerIndex=rows.findIndex(r=>String(r[0]||"").trim().toLowerCase()==="asset_name");
  if(headerIndex<0)return json({error:"Barb Originals header not found."},503);
  const headers=rows[headerIndex].map(x=>String(x||"").trim());
  const records=rows.slice(headerIndex+1).filter(r=>r.some(Boolean)).map(r=>Object.fromEntries(headers.map((k,i)=>[k,String(r[i]||"").trim()])));
  const seen=new Set(),items=[];
  for(const r of records){if(String(r.enabled||"").toLowerCase()!=="yes")continue;const image=normalizeImageURL(r.media_url);if(!image||seen.has(image))continue;seen.add(image);items.push({id:`barb:${hash(image)}`,title:r.asset_name||"Barb Original",creator:"Barb Originals",family:r.family||"original",image,thumbnail:image,sourceURL:image,rightsLabel:"User-owned material · Barb Originals"})}
  if(items.length<count)return json({error:`PARKED: Barb Originals emergency reserve needs at least ${count} enabled image assets; currently found ${items.length}.`},503);
  const start=seed%items.length,ordered=items.slice(start).concat(items.slice(0,start));
  return json({source:"Barb Originals",role:"emergency_reserve",count,items:ordered.slice(0,count)});
};