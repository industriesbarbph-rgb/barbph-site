const FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLScEhOayq1REf29-2cFxVxdaCXJaHFA3yP4z_rY5pF8HixQnkg/viewform?usp=preview";

export default async request => {
  if (request.method !== "GET") return Response.json({error:"Method not allowed"},{status:405});
  try {
    const r = await fetch(FORM_URL,{headers:{"user-agent":"Mozilla/5.0"},cache:"no-store"});
    const html = await r.text();
    const entryIds = [...new Set([...html.matchAll(/entry\.(\d+)/g)].map(m=>m[1]))];
    const publicLoad = html.match(/FB_PUBLIC_LOAD_DATA_\s*=\s*(\[.*?\]);<\/script>/s)?.[1] || null;
    return Response.json({ok:r.ok,http_status:r.status,entry_ids:entryIds,public_load_data:publicLoad ? publicLoad.slice(0,120000) : null,html_excerpt:html.slice(0,20000)},{headers:{"cache-control":"no-store"}});
  } catch (e) {
    return Response.json({error:e.message},{status:500,headers:{"cache-control":"no-store"}});
  }
};
