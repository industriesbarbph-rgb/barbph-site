const SID = "1TSpt_DxEDhpsXE09lNx8S63b7cDomEXhVua--p99DGM";

function clean(v){return String(v??"").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim()}
function hash(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
async function getJSON(url,ms=12000,headers={}){const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);try{const r=await fetch(url,{signal:c.signal,headers:{Accept:"application/json",...headers},cache:"no-store"});let d=null;try{d=await r.json()}catch{}if(!r.ok)throw new Error(d?.error||d?.message||`HTTP ${r.status}`);return d}finally{clearTimeout(t)}}
async function getText(url,ms=12000,headers={}){const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);try{const r=await fetch(url,{signal:c.signal,headers,cache:"no-store"});if(!r.ok)throw new Error(`HTTP ${r.status}`);return await r.text()}finally{clearTimeout(t)}}
function item(x,rights="Approved source rules"){return{id:String(x.id||x.raw||hash(x.image||x.sourceURL||x.title)),raw:String(x.raw||x.id||""),title:clean(x.title)||"Untitled",creator:clean(x.creator)||"Source collection",family:clean(x.family)||"general",image:String(x.image||""),thumbnail:String(x.thumbnail||x.image||""),sourceURL:String(x.sourceURL||x.url||""),rightsLabel:clean(x.rightsLabel||x.rights)||rights}}
function usable(items,count=Infinity){const seen=new Set(),out=[];for(const v of items||[]){const x=item(v);if(!/^https:\/\//i.test(x.image)||seen.has(x.image))continue;seen.add(x.image);out.push(x);if(out.length>=count)break}return out}
function rotate(items,seed){if(!items.length)return items;const i=Math.abs(seed)%items.length;return items.slice(i).concat(items.slice(0,i))}
function parseCSV(text){const rows=[];let row=[],field="",quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'&&text[i+1]==='"'){field+='"';i++}else if(c==='"')quoted=false;else field+=c}else if(c==='"')quoted=true;else if(c===','){row.push(field);field=""}else if(c==='\n'){row.push(field);rows.push(row);row=[];field=""}else if(c!=='\r')field+=c}if(field||row.length){row.push(field);rows.push(row)}return rows}
function table(raw,header){const rows=parseCSV(raw),i=rows.findIndex(r=>clean(r[0]).toLowerCase()===header.toLowerCase());if(i<0)throw new Error(`${header} header not found`);const heads=rows[i].map(clean);return rows.slice(i+1).filter(r=>r.some(Boolean)).map(r=>Object.fromEntries(heads.map((h,j)=>[h,clean(r[j])]))) }
async function sheet(name,header){const u=`https://docs.google.com/spreadsheets/d/${SID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(name)}&headers=0`;const raw=await getText(u);if(/<html|accounts\.google\.com|sign in/i.test(raw))throw new Error(`${name} is not anonymously readable`);return table(raw,header)}
async function local(origin,path,ms=12000){return getJSON(new URL(path,origin).href,ms)}

async function collectMet(seed,count){const terms=["painting","landscape","flowers","textile","sculpture","drawing","portrait"],q=terms[Math.abs(seed)%terms.length];const s=await getJSON(`https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=true&isHighlight=true&q=${encodeURIComponent(q)}`);const ids=s?.objectIDs||[];if(!ids.length)throw new Error("Met search returned no objects");const start=Math.abs(seed)%ids.length,picks=[];for(let i=0;i<Math.min(Math.max(count*3,40),ids.length);i++)picks.push(ids[(start+i*7919)%ids.length]);const data=await Promise.all(picks.map(id=>getJSON(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`,5000).catch(()=>null)));return usable(data.filter(Boolean).filter(o=>o.isPublicDomain===true).map(o=>({id:`met:${o.objectID}`,title:o.title,creator:o.artistDisplayName||o.culture||"The Met",family:q,image:o.primaryImageSmall||o.primaryImage,sourceURL:o.objectURL,rightsLabel:"Public Domain · The Met"})),count)}
async function collectNASA(seed,count){const terms=["Earth","Mars","Jupiter","Saturn","nebula","galaxy","aurora","Moon"],q=terms[Math.abs(seed)%terms.length];const page=1+(Math.abs(seed)%8);const s=await getJSON(`https://images-api.nasa.gov/search?q=${encodeURIComponent(q)}&media_type=image&page=${page}&page_size=100`);const out=[];for(const x of s?.collection?.items||[]){const d=x?.data?.[0]||{},l=(x?.links||[]).find(v=>v.render==="image")||{},id=String(d.nasa_id||""),img=String(l.href||"");if(!id||!/^https:\/\//i.test(img))continue;if(/copyright|all rights reserved|licensed|permission required|courtesy of (?!nasa)/i.test(`${d.title||""} ${d.description||""}`))continue;out.push({id:`nasa:${id}`,title:d.title,creator:d.photographer||d.center||"NASA",family:q,image:img,sourceURL:`https://images.nasa.gov/details/${encodeURIComponent(id)}`,rightsLabel:"NASA media guidelines · third-party material screened out"})}return usable(rotate(out,seed),count)}
async function collectSmithsonian(seed,count){const terms=["flowers","birds","minerals","painting","design","textile","ocean","space","insects","maps"],q=terms[Math.abs(seed)%terms.length];const key=Netlify.env.get("SMITHSONIAN_API_KEY")||"DEMO_KEY";const start=Math.abs(seed)%500;const s=await getJSON(`https://api.si.edu/openaccess/api/v1.0/search?q=${encodeURIComponent(q)}&rows=100&start=${start}&api_key=${encodeURIComponent(key)}`);const out=[];for(const r of s?.response?.rows||[]){const d=r?.content?.descriptiveNonRepeating||{},m=(d?.online_media?.media||[]).find(x=>String(x?.usage?.access||"").toUpperCase()==="CC0"&&/^https:\/\//i.test(String(x?.content||x?.thumbnail||"")));if(!m)continue;const id=String(r?.id||d?.record_ID||"");if(!id)continue;out.push({id:`smith:${id}`,title:r?.title,creator:"Smithsonian Open Access",family:q,image:String(m.content||m.thumbnail),thumbnail:String(m.thumbnail||m.content),sourceURL:/^https?:/i.test(String(r?.url||""))?r.url:"https://www.si.edu/openaccess",rightsLabel:"CC0 · Smithsonian Open Access"})}return usable(out,count)}
async function collectAIC(seed,count){const terms=["painting","landscape","flowers","textile","Japanese print","sculpture","design","portrait","architecture","nature"],q=terms[Math.abs(seed)%terms.length];const page=1+(Math.abs(seed)%20);const s=await getJSON(`https://api.artic.edu/api/v1/artworks/search?q=${encodeURIComponent(q)}&query[term][is_public_domain]=true&limit=100&page=${page}&fields=id,title,artist_display,image_id,is_public_domain`);const out=[];for(const a of s?.data||[]){if(a?.is_public_domain!==true||!a?.image_id)continue;out.push({id:`aic:${a.id}`,title:a.title,creator:a.artist_display||"Art Institute of Chicago",family:q,image:`https://www.artic.edu/iiif/2/${encodeURIComponent(a.image_id)}/full/843,/0/default.jpg`,thumbnail:`https://www.artic.edu/iiif/2/${encodeURIComponent(a.image_id)}/full/600,/0/default.jpg`,sourceURL:`https://www.artic.edu/artworks/${a.id}`,rightsLabel:"Public Domain · Art Institute of Chicago"})}return usable(out,count)}
async function collectCMA(seed,count){const terms=["painting","textile","sculpture","Japanese print","armor","ceramic","jewelry","landscape","portrait"],q=terms[Math.abs(seed)%terms.length];const skip=(Math.abs(seed)%20)*100;const s=await getJSON(`https://openaccess-api.clevelandart.org/api/artworks/?cc0&has_image=1&q=${encodeURIComponent(q)}&limit=100&skip=${skip}`);const out=[];for(const a of s?.data||[]){const img=String(a?.images?.web?.url||a?.images?.print?.url||"");if(a?.share_license_status!=="CC0"||!/^https:\/\//i.test(img))continue;const creator=Array.isArray(a?.creators)&&a.creators.length?clean(a.creators[0]?.description||a.creators[0]?.name):"Cleveland Museum of Art";out.push({id:`cma:${a.id}`,title:a.title,creator,family:q,image:img,sourceURL:a.url||`https://www.clevelandart.org/art/${encodeURIComponent(a.accession_number||a.id)}`,rightsLabel:"CC0 · Cleveland Museum of Art"})}return usable(out,count)}
async function collectLocal(key,origin,seed,count){if(key==="loc"){const s=await local(origin,`/.netlify/functions/library-of-congress?seed=${seed}&count=${Math.max(count,12)}`);return usable((s.items||[]).map(x=>({...x,rightsLabel:"Free to Use and Reuse · Library of Congress"})),count)}const code={noaa:"noaa",usgs:"usgs",nga:"nga"}[key];if(!code)throw new Error(`No local adapter for ${key}`);const s=await local(origin,`/.netlify/functions/open-worlds?source=${code}&seed=${seed}`);return usable(rotate(s.items||[],seed),count)}

async function collectSingapore(seed,count){const id="d_b29c230ec6b609e29ed42f71ca9a8767";const poll=await getJSON(`https://api-open.data.gov.sg/v1/public/api/datasets/${id}/poll-download`);if(Number(poll?.code)!==0||!/^https:\/\//i.test(String(poll?.data?.url||"")))throw new Error(poll?.errMsg||"Singapore dataset download URL unavailable");const geo=await getJSON(poll.data.url,12000);const out=[];for(const f of geo?.features||[]){const p=f?.properties||{},img=String(p.PHOTOURL||"").replace(/^http:/i,"https:");if(!/^https:\/\//i.test(img))continue;out.push({id:`sg:${p.OBJECTID||hash(img)}`,title:p.NAME,creator:"National Heritage Board Singapore",family:"national-monuments",image:img,sourceURL:p.HYPERLINK||"https://data.gov.sg/datasets/d_b29c230ec6b609e29ed42f71ca9a8767/view",rightsLabel:"Singapore Open Data Licence · National Heritage Board"})}return usable(rotate(out,seed),count)}

function absURL(base,value){try{return new URL(String(value||""),base).href.replace(/^http:/i,"https:")}catch{return""}}
async function collectNHCP(seed,count){const pages=[];const start=1+(Math.abs(seed)%8);for(let n=0;n<3;n++)pages.push(1+((start+n-1)%12));const out=[];for(const page of pages){const url=`https://memory.nhcp.gov.ph/collections/page/${page}/`;const html=await getText(url,12000).catch(()=>"");if(!html)continue;const cardRe=/<(?:article|div)[^>]*>([\s\S]{0,12000}?)<\/\s*(?:article|div)>/gi;let m;while((m=cardRe.exec(html))&&out.length<count*4){const block=m[1];if(!/Level\s*:?\s*Level\s*1/i.test(block))continue;const href=block.match(/href=["']([^"']+)["']/i)?.[1]||"";const src=block.match(/<img[^>]+(?:src|data-src)=["']([^"']+)["']/i)?.[1]||"";const title=clean((block.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i)?.[1]||block.match(/title=["']([^"']+)["']/i)?.[1]||"NHCP National Memory Project"));const image=absURL(url,src),sourceURL=absURL(url,href);if(!image||!/memory\.nhcp\.gov\.ph/i.test(image))continue;out.push({id:`nhcp:${hash(sourceURL||image)}`,title,creator:"National Historical Commission of the Philippines",family:"level-1-open-access",image,sourceURL:sourceURL||"https://memory.nhcp.gov.ph/collections/",rightsLabel:"NHCP Open Access Level 1 · item must remain Level 1"})}}
if(!out.length)throw new Error("NHCP Level 1 cards returned no directly usable images");return usable(rotate(out,seed),count)}

/* NDL Image Bank states that its exhibition images are digitized public-domain content and may be reused commercially with source attribution. */
async function collectNDL(seed,count){
  const themes=["fugaku100","60meisho","100saishoku","neko","inu","yukigeshiki","saibi","shokoku100","omochae","sakurazukushi","momijigari","noryo","yumejishikibijin"];
  const start=Math.abs(seed)%themes.length,out=[];
  for(let n=0;n<Math.min(5,themes.length)&&out.length<Math.max(count*2,40);n++){
    const slug=themes[(start+n*5)%themes.length],url=`https://www.ndl.go.jp/en/imagebank/theme/${slug}`;
    const html=await getText(url,10000).catch(()=>"");if(!html)continue;
    const title=clean(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]||html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||"NDL Image Bank");
    const re=/https?:\/\/(?:www\.)?dl\.ndl\.go\.jp\/api\/iiif\/[^"'<>\s]+?\/default\.jpg/gi;let m;
    while((m=re.exec(html))&&out.length<Math.max(count*2,40)){
      const image=m[0].replace(/&amp;/g,"&").replace(/^http:/i,"https:");
      out.push({id:`ndl:${hash(image)}`,title,creator:"National Diet Library, Japan",family:slug,image,sourceURL:url,rightsLabel:"Public Domain · NDL Image Bank · source attribution required"});
    }
  }
  const ready=usable(rotate(out,seed),count);if(!ready.length)throw new Error("NDL Image Bank returned no directly usable IIIF images");return ready;
}

function deepStrings(obj,out=[]){if(typeof obj==="string")out.push(obj);else if(Array.isArray(obj)){for(const v of obj)deepStrings(v,out)}else if(obj&&typeof obj==="object"){for(const v of Object.values(obj))deepStrings(v,out)}return out}
function gettyCC0Visuals(obj){const out=[];function walk(v){if(!v||typeof v!=="object")return;if(Array.isArray(v)){for(const x of v)walk(x);return}if(v.type==="VisualItem"&&/^https:\/\/data\.getty\.edu\/media\/image\//i.test(String(v.id||""))){const ids=deepStrings(v.subject_to||[]);if(ids.includes("https://creativecommons.org/publicdomain/zero/1.0/"))out.push(v)}for(const x of Object.values(v))walk(x)}walk(obj);return out}
/* Getty's Museum Collection API is public. Images enter this stream only when the image-level VisualItem explicitly carries CC0. */
async function collectGetty(seed,count){
  const root=await getJSON("https://data.getty.edu/museum/collection/activity-stream",10000,{Accept:"application/ld+json, application/json"});
  const strings=deepStrings(root),lastURL=String(root?.last?.id||root?.last||strings.find(x=>/\/activity-stream\/page\/\d+$/i.test(x))||"");
  const lastNum=Number(lastURL.match(/\/page\/(\d+)/i)?.[1]||0);if(!lastNum)throw new Error("Getty ActivityStream did not expose a usable last page");
  const out=[],seenObjects=new Set(),pageStart=Math.max(1,lastNum-(Math.abs(seed)%20));
  for(let p=0;p<4&&out.length<Math.max(count*2,40);p++){
    const page=Math.max(1,pageStart-p),feed=await getJSON(`https://data.getty.edu/museum/collection/activity-stream/page/${page}`,10000,{Accept:"application/ld+json, application/json"}).catch(()=>null);if(!feed)continue;
    const ids=deepStrings(feed).filter(x=>/^https:\/\/data\.getty\.edu\/museum\/collection\/object\/[0-9a-f-]+$/i.test(x));
    const unique=[...new Set(ids)].filter(x=>!seenObjects.has(x)).slice(0,24);for(const x of unique)seenObjects.add(x);
    const records=await Promise.all(unique.map(u=>getJSON(u,7000,{Accept:"application/ld+json, application/json"}).catch(()=>null)));
    for(const r of records.filter(Boolean)){
      const visuals=gettyCC0Visuals(r);if(!visuals.length)continue;
      const title=clean(r._label||r.label||r.identified_by?.find?.(x=>x?.content)?.content||"Getty Open Content");
      for(const v of visuals){const uuid=String(v.id).match(/\/image\/([0-9a-f-]+)$/i)?.[1];if(!uuid)continue;out.push({id:`getty:${uuid}`,title,creator:"J. Paul Getty Museum",family:"open-content",image:`https://media.getty.edu/iiif/image/${uuid}/full/1000,/0/default.jpg`,thumbnail:`https://media.getty.edu/iiif/image/${uuid}/full/600,/0/default.jpg`,sourceURL:String(r.id||"https://www.getty.edu/art/collection/"),rightsLabel:"CC0 · Getty Open Content"});if(out.length>=Math.max(count*2,40))break}
      if(out.length>=Math.max(count*2,40))break;
    }
  }
  const ready=usable(rotate(out,seed),count);if(!ready.length)throw new Error("Getty API returned no image-level CC0 Open Content records");return ready;
}

/* Keyless NPM Open Data route. Only pages that explicitly expose the CC0 presentation-image statement are accepted. */
function npmDetailItem(html,url){
  if(!/Lower\s*\/\s*Presentation\s*Size\s*Image\s*\(CC0\)|100萬像素圖檔下載\s*\(CC0\)|\bCC0\b/i.test(html))return null;
  const title=clean(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||"National Palace Museum Open Data").replace(/\s*-\s*National Palace Museum\s*$/i,"");
  const re=/(?:https?:\/\/digitalarchive\.npm\.gov\.tw)?\/opendata\/Image\/GetImage\?[^"'<>\s]+/gi,m=html.match(re)||[];
  const raw=m.find(x=>/imageId=/i.test(x));if(!raw)return null;const image=absURL(url,raw.replace(/&amp;/g,"&"));if(!/^https:\/\/digitalarchive\.npm\.gov\.tw\/opendata\/Image\/GetImage\?/i.test(image))return null;
  const id=url.match(/\/DetailEng\/(\d+)/i)?.[1]||hash(url);return{id:`npm:${id}:${hash(image)}`,title,creator:"National Palace Museum, Taipei",family:"open-data-cc0",image,sourceURL:url,rightsLabel:"CC0 1MP · National Palace Museum Open Data"};
}
async function collectNPM(seed,count){
  const listURL="https://digitalarchive.npm.gov.tw/opendata/Pub/EngVersion",list=await getText(listURL,10000);
  const ids=[...new Set([...list.matchAll(/\/opendata\/Pub\/DetailEng\/(\d+)/gi)].map(m=>Number(m[1])).filter(Number.isFinite))];if(!ids.length)throw new Error("NPM Open Data list returned no detail identifiers");
  const anchors=rotate(ids,seed),candidates=[...anchors];for(let off=1;off<=8&&candidates.length<96;off++){for(const anchor of anchors){for(const d of [anchor+off,anchor-off])if(d>0&&!candidates.includes(d))candidates.push(d);if(candidates.length>=96)break}if(candidates.length>=96)break}
  const out=[];for(let i=0;i<candidates.length&&out.length<Math.max(count*2,40);i+=18){const batch=candidates.slice(i,i+18),pages=await Promise.all(batch.map(id=>{const u=`https://digitalarchive.npm.gov.tw/opendata/Pub/DetailEng/${id}?dep=U&mode=full`;return getText(u,7000).then(h=>npmDetailItem(h,u)).catch(()=>null)}));for(const x of pages)if(x)out.push(x)}
  const ready=usable(rotate(out,seed),count);if(ready.length<Math.min(6,count))throw new Error(`NPM keyless Open Data route returned only ${ready.length} usable CC0 images`);return ready;
}

async function collectCatalogue(sourceName,seed,count){const rows=await sheet("Source Catalogue","source_name"),wanted=clean(sourceName).toLowerCase(),out=[];for(const r of rows){if(clean(r.source_name).toLowerCase()!==wanted||clean(r.enabled).toLowerCase()!=="yes")continue;if(!/^https:\/\//i.test(r.image_url)||!r.rights_label)continue;out.push({id:`catalog:${r.asset_id||hash(r.image_url)}`,title:r.title||sourceName,creator:sourceName,family:r.family||"curated",image:r.image_url,sourceURL:r.source_url||r.image_url,rightsLabel:r.rights_label})}if(!out.length)throw new Error(`${sourceName} has no enabled rights-cleared Source Catalogue records`);return usable(rotate(out,seed),count)}

function firstImage(obj){if(!obj||typeof obj!=="object")return"";for(const [k,v] of Object.entries(obj)){if(typeof v==="string"&&/image|img|iiif|photo|picture/i.test(k)&&/^https:\/\//i.test(v))return v;if(v&&typeof v==="object"){const hit=firstImage(v);if(hit)return hit}}return""}
async function collectKorea(seed,count){const key=Netlify.env.get("NFM_KOREA_API_KEY"),endpoint=Netlify.env.get("NFM_KOREA_API_URL");if(!key)throw new Error("NFM_KOREA_API_KEY is not configured");if(!endpoint)throw new Error("NFM_KOREA_API_URL is not configured; use the approved endpoint supplied with the service application");const u=new URL(endpoint);u.searchParams.set("serviceKey",key);u.searchParams.set("pageNo",String(1+(Math.abs(seed)%50)));u.searchParams.set("numOfRows",String(Math.max(count*2,30)));u.searchParams.set("type","json");const s=await getJSON(u.href,12000);const candidates=s?.response?.body?.items?.item||s?.items||s?.data||[];const list=Array.isArray(candidates)?candidates:[candidates];const out=[];for(const r of list){const img=firstImage(r);if(!img)continue;const id=String(r.id||r.resourceId||r.identifier||hash(img));out.push({id:`nfm:${id}`,title:r.title||r.resourceName||r.name||"Korean Folk Archive Photo",creator:"National Folk Museum of Korea",family:r.subject||r.keyword||"folk-archive",image:img,sourceURL:r.url||r.link||"https://www.data.go.kr/data/15104971/openapi.do",rightsLabel:"Public-data use unrestricted · verify per-record attribution metadata"})}if(!out.length)throw new Error("Korea API returned no usable image URLs; field mapping requires live-key verification");return usable(out,count)}

export const DIRECT_ADAPTERS = new Set(["met","nasa","smithsonian","loc","noaa","usgs","aic","cma","nga","nhb_singapore","nhcp_memory","ndl_imagebank","getty","npm_taiwan","nfm_korea"]);
export const CATALOGUE_ADAPTERS = new Set(["hk_old_photos","khastara_id"]);
export async function collectSource({adapterKey,sourceName,origin,seed,count}){
  const k=clean(adapterKey).toLowerCase();
  if(k==="met")return collectMet(seed,count);
  if(k==="nasa")return collectNASA(seed,count);
  if(k==="smithsonian")return collectSmithsonian(seed,count);
  if(["loc","noaa","usgs","nga"].includes(k))return collectLocal(k,origin,seed,count);
  if(k==="aic")return collectAIC(seed,count);
  if(k==="cma")return collectCMA(seed,count);
  if(k==="nhb_singapore")return collectSingapore(seed,count);
  if(k==="nhcp_memory")return collectNHCP(seed,count);
  if(k==="ndl_imagebank")return collectNDL(seed,count);
  if(k==="getty")return collectGetty(seed,count);
  if(k==="npm_taiwan")return collectNPM(seed,count);
  if(k==="nfm_korea")return collectKorea(seed,count);
  if(CATALOGUE_ADAPTERS.has(k))return collectCatalogue(sourceName,seed,count);
  throw new Error(`Adapter ${k||"(blank)"} is not production-capable`);
}
