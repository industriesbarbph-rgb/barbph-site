import dailyStream from "./daily-stream.mjs";

export default async request=>{
  const response=await dailyStream(request);
  const url=new URL(request.url);
  const cacheable=request.method==="GET"&&url.searchParams.get("lab")!=="1"&&response.ok;
  if(!cacheable)return response;
  const headers=new Headers(response.headers);
  headers.set("Cache-Control","public, max-age=15");
  headers.set("Netlify-CDN-Cache-Control","public, durable, s-maxage=60, stale-while-revalidate=300");
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
};
