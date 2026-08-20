const ALLOWED_RIGHTS=[
{code:"PDM",test:/creativecommons\.org\/publicdomain\/mark\/1\.0/i,label:"Public Domain Mark · Europeana"},
{code:"CC0",test:/creativecommons\.org\/publicdomain\/zero\/1\.0/i,label:"CC0 · Europeana"}
];
const first=v=>Array.isArray(v)?v[0]:v;
const asHttps=v=>{const s=String(first(v)||"").trim();if(!/^https?:\/\//i.test(s))return"";return s.replace(/^http:\/\//i,"https://")};
const clean=v=>String(first(v)||"").replace(/\s+/g," ").trim();
export default async request=>{
if(request.method!=="GET")return Response.json({error:"Method not allowed"},{status:405});
const apiKey=Netlify.env.get("EUROPEANA_API_KEY");
if(!apiKey)return Response.json({error:"PARKED: Europeana adapter is finished, but EUROPEANA_API_KEY is not configured yet."},{status:503,headers:{"cache-control":"no-store"}});
const incoming=new URL(request.url),q=(incoming.searchParams.get("q")||"art").slice(0,80),seed=Math.abs(parseInt(incoming.searchParams.get("seed")||"1",10)||1)%2147483647,rows=Math.min(100,Math.max(12,parseInt(incoming.searchParams.get("rows")||"60",10)||60));
const url=new URL("https://api.europeana.eu/record/v2/search.json");
url.searchParams.set("query",q);url.searchParams.set("reusability","open");url.searchParams.set("media","true");url.searchParams.set("thumbnail","true");url.searchParams.set("landingpage","true");url.searchParams.set("rows",String(rows));url.searchParams.set("profile","rich");url.searchParams.set("sort",`random_${seed}+asc`);
let response;try{response=await fetch(url,{headers:{"X-Api-Key":apiKey,Accept:"application/json","User-Agent":"BarbPH-Daily-Discover/1.0"}})}catch{return Response.json({error:"Europeana request could not be reached."},{status:502})}
let data=null;try{data=await response.json()}catch{}
if(!response.ok||data?.success===false){const status=response.status===429?429:response.status===401?401:502;return Response.json({error:data?.error||`Europeana API returned HTTP ${response.status}.`},{status,headers:{"cache-control":"no-store"}})}
const items=[];for(const item of data?.items||[]){const rights=clean(item?.rights),rule=ALLOWED_RIGHTS.find(r=>r.test.test(rights));if(!rule)continue;const preview=asHttps(item?.edmPreview),shownBy=asHttps(item?.edmIsShownBy),image=preview||shownBy;if(!image)continue;const id=clean(item?.id);if(!id)continue;items.push({id,title:clean(item?.title)||"Untitled Europeana object",creator:clean(item?.dcCreator)||clean(item?.dataProvider)||clean(item?.provider)||"Europeana",dataProvider:clean(item?.dataProvider),image,thumbnail:preview,sourceURL:asHttps(item?.guid)||`https://www.europeana.eu/item${id.startsWith("/")?id:`/${id}`}`,rightsCode:rule.code,rightsLabel:rule.label})}
return Response.json({source:"Europeana",query:q,rightsGate:["PDM","CC0"],items},{headers:{"cache-control":"public, max-age=300, s-maxage=3600","content-type":"application/json; charset=utf-8"}})};