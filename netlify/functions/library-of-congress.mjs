const SETS = [
  { slug: "cats", label: "Cats" },
  { slug: "dinosaurs-and-fossils", label: "Dinosaurs & Fossils" },
  { slug: "gardens", label: "Gardens" },
  { slug: "maps-of-cities", label: "Maps of Cities" },
  { slug: "libraries", label: "Libraries" },
  { slug: "books-maps-more", label: "Reading — Books, Maps, and More" }
];

const clean = value => String(Array.isArray(value) ? value[0] || "" : value || "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
const asHttps = (value, base = "https://www.loc.gov/") => {
  const v = String(value || "").trim();
  if (!v) return "";
  try {
    const u = new URL(v.startsWith("//") ? `https:${v}` : v, base);
    u.protocol = "https:";
    return u.href;
  } catch { return ""; }
};
const hash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const fetchWithTimeout = async (url, ms = 12000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { "Accept": "application/json,text/html;q=0.9,*/*;q=0.8", "User-Agent": "BarbPH-Daily-Discover/1.0" }
    });
  } finally { clearTimeout(timer); }
};
const imageScore = url => {
  const u = String(url || "");
  const px = +(u.match(/[_-](\d{2,4})px/i)?.[1] || 0);
  return px + (/\.jpe?g(?:\?|$)/i.test(u) ? 100 : 0) + (/\.png(?:\?|$)/i.test(u) ? 70 : 0) + (/full|master|original/i.test(u) ? 500 : 0);
};
const collectImageUrls = obj => {
  const out = [];
  const seen = new Set();
  const walk = (v, depth = 0) => {
    if (depth > 6 || v == null) return;
    if (typeof v === "string") {
      const u = asHttps(v);
      if (u && /\.(?:jpe?g|png|webp)(?:\?|$)/i.test(u) && !seen.has(u)) { seen.add(u); out.push(u); }
      return;
    }
    if (Array.isArray(v)) { for (const x of v) walk(x, depth + 1); return; }
    if (typeof v === "object") for (const [k, x] of Object.entries(v)) if (/image|url|file|resource|download|thumbnail/i.test(k)) walk(x, depth + 1);
  };
  walk(obj);
  return out.sort((a, b) => imageScore(b) - imageScore(a));
};
const parseCards = html => {
  const cards = [];
  const seen = new Set();
  const re = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html))) {
    const href = asHttps(m[1]);
    if (!href || !/\.loc\.gov\/(?:resource|item)\//i.test(href) || seen.has(href)) continue;
    seen.add(href);
    const inner = m[2];
    const image = asHttps(inner.match(/(?:src|data-src)=["']([^"']+)["']/i)?.[1] || "", href);
    const alt = clean(inner.match(/alt=["']([^"']*)["']/i)?.[1] || "");
    const text = clean(inner);
    cards.push({ href, image, title: alt || text });
  }
  return cards;
};
const creatorFrom = data => {
  const item = data?.item || {};
  const c = item?.contributors || item?.contributor || data?.contributor_names || data?.contributor || data?.creator || [];
  const first = Array.isArray(c) ? c[0] : c;
  if (first && typeof first === "object") return clean(first.title || first.name || first.full_name || "");
  return clean(first) || "Library of Congress";
};
const titleFrom = (data, fallback) => clean(data?.item?.title || data?.title || data?.item?.other_title || fallback || "Untitled Library of Congress item");

export default async (request) => {
  if (request.method !== "GET") return Response.json({ error: "Method not allowed" }, { status: 405 });

  const incoming = new URL(request.url);
  const seed = Math.abs(Number.parseInt(incoming.searchParams.get("seed") || "1", 10) || 1);
  const count = Math.min(12, Math.max(3, Number.parseInt(incoming.searchParams.get("count") || "9", 10) || 9));
  const set = SETS[seed % SETS.length];
  const setURL = `https://www.loc.gov/free-to-use/${set.slug}/`;

  let htmlResponse;
  try { htmlResponse = await fetchWithTimeout(setURL, 14000); }
  catch { return Response.json({ error: "Library of Congress set page could not be reached." }, { status: 502 }); }
  if (!htmlResponse.ok) return Response.json({ error: `Library of Congress set page returned HTTP ${htmlResponse.status}.` }, { status: 502 });

  const html = await htmlResponse.text();
  let cards = parseCards(html);
  if (!cards.length) return Response.json({ error: "No free-to-use item links were found on the selected Library of Congress set." }, { status: 502 });

  const shift = hash(`${seed}|${set.slug}`) % cards.length;
  cards = cards.slice(shift).concat(cards.slice(0, shift));

  const items = [];
  const used = new Set();
  for (const card of cards.slice(0, Math.min(cards.length, 24))) {
    if (items.length >= count) break;
    try {
      const detailURL = `${card.href}${card.href.includes("?") ? "&" : "?"}fo=json`;
      const response = await fetchWithTimeout(detailURL, 10000);
      if (!response.ok) continue;
      const data = await response.json();
      const image = collectImageUrls(data)[0] || card.image;
      if (!image) continue;
      const id = clean(data?.item?.id || data?.id || card.href.split("/").filter(Boolean).at(-1));
      if (!id || used.has(id)) continue;
      used.add(id);
      items.push({
        id,
        title: titleFrom(data, card.title),
        creator: creatorFrom(data),
        image,
        thumbnail: card.image || image,
        sourceURL: card.href,
        rightsLabel: "Free to Use and Reuse · Library of Congress",
        set: set.label
      });
    } catch {}
  }

  if (items.length < 2) return Response.json({ error: `Library of Congress ${set.label} set did not yield two usable images.` }, { status: 502 });

  return Response.json(
    { source: "Library of Congress", set: set.label, setURL, rightsGate: "Free to Use and Reuse curated set", items },
    { headers: { "cache-control": "public, max-age=300, s-maxage=3600", "content-type": "application/json; charset=utf-8" } }
  );
};
