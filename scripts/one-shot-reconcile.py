from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding="utf-8")


def write(path, content):
    p = ROOT / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content.rstrip() + "\n", encoding="utf-8")


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


# 1) Repair the hourly catalog builder for this ESM repository.
build = read("build-catalog.js")
build = replace_once(
    build,
    'const fs = require("fs");\nconst https = require("https");',
    'import fs from "node:fs";\nimport https from "node:https";',
    "build-catalog ESM imports",
)

media_pattern = re.compile(
    r'// ---- Handles Cloudinary / GitHub raw / Google Drive links interchangeably ----\n'
    r'function normalizeMediaUrl\(url\) \{.*?\n\}\n\n'
    r'// ---- Very small CSV parser',
    re.S,
)
media_replacement = '''// ---- Handles Google Drive / GitHub / direct media links interchangeably ----
function normalizeMediaUrl(url) {
  if (!url) return "";

  url = String(url).trim();

  if (/^github\\.com\\//i.test(url)) url = `https://${url}`;
  if (/^www\\./i.test(url)) url = `https://${url}`;
  if (!/^https?:\\/\\//i.test(url)) url = `https://${url}`;

  // Google Drive share links -> direct-view format
  const driveMatch = url.match(/drive\\.google\\.com\\/file\\/d\\/([^/]+)/i);
  if (driveMatch) {
    return `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`;
  }

  // GitHub blob links -> raw file URLs. Query strings such as ?raw=true are removed.
  const githubMatch = url.match(
    /^https:\\/\\/github\\.com\\/([^/]+)\\/([^/]+)\\/blob\\/([^/]+)\\/(.+?)(?:[?#].*)?$/i
  );
  if (githubMatch) {
    return `https://raw.githubusercontent.com/${githubMatch[1]}/${githubMatch[2]}/${githubMatch[3]}/${githubMatch[4]}`;
  }

  return url;
}

// ---- Very small CSV parser'''
build, count = media_pattern.subn(media_replacement, build, count=1)
if count != 1:
    raise RuntimeError(f"build-catalog normalizeMediaUrl: expected one replacement, found {count}")

voice_anchor = '    : "";\n\n  return `    <article class="card"${voice ? " data-voice-card" : ""}>'
voice_insert = '''    : "";

  const mediaMarkup = photo
    ? `<div class="card-photo">
        <img src="${escapeHtml(photo)}" alt="${escapeHtml(item.name)}" loading="lazy">
      </div>`
    : `<div class="card-photo card-photo--empty" aria-hidden="true"></div>`;

  return `    <article class="card"${voice ? " data-voice-card" : ""}>'''
build = replace_once(build, voice_anchor, voice_insert, "build-catalog media markup insertion")
old_photo_block = '''      <div class="card-photo">
        <img src="${escapeHtml(photo)}" alt="${escapeHtml(
    item.name
  )}" loading="lazy">
      </div>'''
build = replace_once(build, old_photo_block, '      ${mediaMarkup}', "build-catalog old photo block")
write("build-catalog.js", build)


# 2) Make the live catalog feed normalize GitHub blob links consistently.
feed = read("netlify/functions/catalog-feed.mjs")
norm_pattern = re.compile(r'function norm\(v\)\{.*?\}\nexport default', re.S)
norm_replacement = '''function norm(v){
  v=clean(v);if(!v)return"";
  if(/^github\\.com\\//i.test(v))v="https://"+v;
  if(/^www\\./i.test(v))v="https://"+v;
  if(!/^https?:\\/\\//i.test(v))v="https://"+v;
  const m=v.match(/^https:\\/\\/github\\.com\\/([^/]+)\\/([^/]+)\\/blob\\/([^/]+)\\/(.+?)(?:[?#].*)?$/i);
  return m?`https://raw.githubusercontent.com/${m[1]}/${m[2]}/${m[3]}/${m[4]}`:v;
}
export default'''
feed, count = norm_pattern.subn(norm_replacement, feed, count=1)
if count != 1:
    raise RuntimeError(f"catalog-feed norm: expected one replacement, found {count}")
write("netlify/functions/catalog-feed.mjs", feed)


# 3) Fix Programs live rendering so photo_url is actually used.
programs = read("programs.html")
old_desc = "Explore BarbPH programs and one-on-one career sessions, including Career Navigation and Job Interview Practice."
new_desc = "Explore BarbPH programs, mentorship, career navigation, interview practice, and consultation."
programs = programs.replace(old_desc, new_desc)
programs = programs.replace(
    '<p class="visually-hidden">Digital products by Barb the Builder, including Jana (a private encrypted notepad app), Will Wheel (a KPI dashboard), and The Bible (a paper technology story).</p>',
    '<p class="visually-hidden">BarbPH programs include Career Navigation, Coach Doll Mentorship, Job Interview Practice Session, and Consultation.</p>',
)
program_script_pattern = re.compile(r'<script id="barbph-live-programs">.*?</script>', re.S)
program_script = '''<script id="barbph-live-programs">
(() => {
  const grid = document.getElementById('programs-grid');
  if (!grid || location.protocol === 'file:') return;

  const esc = s => String(s || '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
  const normalizeImage = u => {
    u = String(u || '').trim();
    if (/^github\\.com\\//i.test(u)) u = `https://${u}`;
    const m = u.match(/^https:\\/\\/github\\.com\\/([^/]+)\\/([^/]+)\\/blob\\/([^/]+)\\/(.+?)(?:[?#].*)?$/i);
    return m ? `https://raw.githubusercontent.com/${m[1]}/${m[2]}/${m[3]}/${m[4]}` : u;
  };
  const card = x => {
    const photo = normalizeImage(x.photo_url);
    const media = photo
      ? `<div class="card-photo"><img src="${esc(photo)}" alt="${esc(x.name)}" loading="lazy"></div>`
      : `<div class="card-photo card-photo--empty" aria-hidden="true"></div>`;
    const links=[];
    if(x.story_link) links.push(`<a href="${esc(x.story_link)}" target="_blank" rel="noopener">Read the story</a>`);
    if(x.try_link) links.push(`<a href="${esc(x.try_link)}" target="_blank" rel="noopener">Try it</a>`);
    if(x.buy_link) links.push(`<a href="${esc(x.buy_link)}" target="_blank" rel="noopener" class="primary">Buy it</a>`);
    return `<article class="card">${media}<div class="card-body"><div class="card-name">${esc(x.name)}</div><div class="card-desc">${esc(x.description)}</div><div class="card-actions">${links.join('')}</div></div></article>`;
  };
  fetch('/.netlify/functions/catalog-feed?type=programs', {cache:'no-store'})
    .then(r => r.ok ? r.json() : Promise.reject(new Error('catalog unavailable')))
    .then(data => {
      if (Array.isArray(data.items) && data.items.length) grid.innerHTML = data.items.map(card).join('');
    })
    .catch(() => {});
})();
</script>'''
programs, count = program_script_pattern.subn(program_script, programs, count=1)
if count != 1:
    raise RuntimeError(f"programs live script: expected one replacement, found {count}")
write("programs.html", programs)


# 4) Bring the internal production lab forward to the current continuous engine.
production_lab = r'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<title>BarbPH Continuous Source Engine - Production Gate Lab</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#0d1015;color:#f5f7fb;font:14px/1.45 system-ui,-apple-system,Segoe UI,sans-serif}.wrap{max-width:1100px;margin:auto;padding:20px}.card{border:1px solid #ffffff1f;background:#151a22;border-radius:18px;padding:16px;margin:0 0 14px}.muted{color:#aeb7c6}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px}.metric{border:1px solid #ffffff18;border-radius:14px;padding:12px;background:#0f131a}.metric b{display:block;font-size:12px;color:#aeb7c6}.metric span{display:block;margin-top:4px;font-size:16px;font-weight:750;word-break:break-word}.buttons{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}button,select{border:1px solid #ffffff24;background:#ffffff0f;color:#fff;padding:9px 11px;border-radius:11px}button{cursor:pointer}button:hover{background:#ffffff18}button:disabled,select:disabled{opacity:.45;cursor:wait}.status{font-weight:800}.assets{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-top:12px}.asset{border:1px solid #ffffff18;border-radius:14px;overflow:hidden;background:#0c1016}.asset img{display:block;width:100%;aspect-ratio:4/3;object-fit:cover;background:#080a0d}.asset div{padding:10px}.asset a{color:#fff}.json{white-space:pre-wrap;word-break:break-word;background:#090c11;border-radius:14px;padding:12px;max-height:360px;overflow:auto;color:#cbd4e3}.good{color:#9ff3b5}.warn{color:#ffd38f}.bad{color:#ff9b9b}.topline{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap}h1{font-size:20px;margin:0 0 4px}h2{font-size:16px;margin:0 0 8px}@media(max-width:600px){.wrap{padding:12px}}
</style>
</head>
<body><main class="wrap">
<section class="card"><div class="topline"><div><h1>BARBPH CONTINUOUS SOURCE ENGINE - PRODUCTION GATE LAB</h1><div class="muted">Internal diagnostic only. Lab runs use isolated state and do not alter the production day.</div><div class="muted">Last request: <span id="checked">not yet</span> · <span id="latency">not yet</span></div></div><button id="refresh">Refresh readiness</button></div></section>
<section class="card"><h2>Readiness</h2><div class="grid"><div class="metric"><b>State</b><span id="state">Loading...</span></div><div class="metric"><b>Production armed</b><span id="armed">...</span></div><div class="metric"><b>Configured / ready / enabled</b><span id="counts">...</span></div><div class="metric"><b>Barb Originals reserve</b><span id="reserve">...</span></div><div class="metric"><b>Today</b><span id="today">...</span></div><div class="metric"><b>Shared history</b><span id="history">...</span></div></div><div id="blockers" class="muted" style="margin-top:10px"></div></section>
<section class="card"><h2>Production-ready source dry runs</h2><div class="muted">Buttons come from the live readiness response, not a hard-coded source list.</div><div id="sourceButtons" class="buttons"></div></section>
<section class="card"><h2>Failure and reserve test</h2><div class="muted">Forces the selected lab source to fail using the current continuous engine, then observes same-source/reserve safety behavior.</div><div class="buttons"><select id="tantrumSource"></select><button id="tantrum">Force failure test</button></div></section>
<section class="card"><div class="topline"><h2 style="margin:0">Latest result</h2><span id="resultStatus" class="status muted">Waiting</span></div><div id="assets" class="assets"></div><pre id="result" class="json">No test run yet.</pre></section>
</main>
<script>(()=>{"use strict";
const $=id=>document.getElementById(id),E={state:$("state"),armed:$("armed"),counts:$("counts"),reserve:$("reserve"),today:$("today"),history:$("history"),blockers:$("blockers"),sourceButtons:$("sourceButtons"),tantrumSource:$("tantrumSource"),tantrum:$("tantrum"),refresh:$("refresh"),resultStatus:$("resultStatus"),result:$("result"),assets:$("assets"),checked:$("checked"),latency:$("latency")};
let busy=false,sources=[];
function tone(el,kind){el.className=`status ${kind||"muted"}`}
function stamp(ms){E.checked.textContent=new Intl.DateTimeFormat("en-PH",{timeZone:"Asia/Manila",dateStyle:"medium",timeStyle:"medium"}).format(new Date());E.latency.textContent=`${ms}ms`}
function setBusy(v){busy=v;document.querySelectorAll("button").forEach(b=>b.disabled=v);E.tantrumSource.disabled=v}
async function fetchJSON(url,ms=22000){const c=new AbortController(),t=setTimeout(()=>c.abort(),ms),started=performance.now();try{const r=await fetch(url,{signal:c.signal,cache:"no-store"});const text=await r.text();let data;try{data=JSON.parse(text)}catch{data={error:`Non-JSON response, HTTP ${r.status}`}}return{ok:r.ok,status:r.status,data,ms:Math.round(performance.now()-started)}}finally{clearTimeout(t)}}
function renderAssets(items){E.assets.innerHTML="";for(const a of items||[]){const card=document.createElement("div");card.className="asset";const img=document.createElement("img");img.src=a.image||a.thumbnail||"";img.alt="";img.loading="lazy";const box=document.createElement("div");const title=document.createElement("b");title.textContent=a.title||"Untitled";box.append(title);if(a.sourceURL){box.append(document.createElement("br"));const link=document.createElement("a");link.href=a.sourceURL;link.target="_blank";link.rel="noopener";link.textContent="Open source";box.append(link)}card.append(img,box);E.assets.append(card)}}
function renderButtons(){E.sourceButtons.innerHTML="";E.tantrumSource.innerHTML="";for(const source of sources){const b=document.createElement("button");b.textContent=`Dry-run ${source}`;b.addEventListener("click",()=>runSource(source,false));E.sourceButtons.append(b);const o=document.createElement("option");o.value=o.textContent=source;E.tantrumSource.append(o)}if(!sources.length){E.sourceButtons.textContent="No production-ready sources reported."}}
async function readiness(){if(busy)return;setBusy(true);try{const {ok,status,data,ms}=await fetchJSON("/.netlify/functions/daily-discover-readiness");stamp(ms);E.state.textContent=data.state||`HTTP ${status}`;E.armed.textContent=data.production_armed?"YES":"NO";E.counts.textContent=`${data.counts?.configured_sources??0} / ${data.counts?.production_ready_sources??0} / ${data.counts?.production_enabled_sources??0}`;E.reserve.textContent=`${data.reserve?.available_count??0}/${data.reserve?.minimum_required??3} ${data.reserve?.ready?"READY":"WAITING"}`;E.today.textContent=data.shared_state?.scheduled_source||"Not locked yet";E.history.textContent=`${data.shared_state?.history_days??0} day(s)`;E.blockers.textContent=(data.blockers||[]).length?`Blockers: ${(data.blockers||[]).join(" · ")}`:"No readiness blockers reported.";sources=Array.isArray(data.production_ready_sources)?data.production_ready_sources:[];renderButtons();tone(E.state,ok&&data.state==="READY_FOR_PRODUCTION"?"good":ok?"warn":"bad")}catch(e){E.state.textContent=e?.name==="AbortError"?"READINESS TIMEOUT":"READINESS ERROR";E.blockers.textContent=e.message;tone(E.state,"bad")}finally{setBusy(false)}}
async function runSource(source,forceFail){if(busy)return;setBusy(true);E.resultStatus.textContent="Running...";tone(E.resultStatus,"warn");E.result.textContent="Fetching lab result...";E.assets.innerHTML="";try{const p=new URLSearchParams({lab:"1",force_source:source});if(forceFail)p.set("force_fail","1");const {ok,status,data,ms}=await fetchJSON(`/.netlify/functions/daily-stream?${p}`);stamp(ms);E.resultStatus.textContent=ok?`${data.served_source||source} · ${data.service_mode||"SUCCESS"}`:`HTTP ${status} · ${data.status||"FAILED"}`;tone(E.resultStatus,ok?"good":"bad");renderAssets(data.assets||[]);E.result.textContent=JSON.stringify({http_status:status,elapsed_ms:ms,...data},null,2)}catch(e){E.resultStatus.textContent=e?.name==="AbortError"?"TIMED OUT":"REQUEST ERROR";tone(E.resultStatus,"bad");E.result.textContent=String(e?.message||e)}finally{setBusy(false)}}
E.tantrum.addEventListener("click",()=>{if(E.tantrumSource.value)runSource(E.tantrumSource.value,true)});E.refresh.addEventListener("click",readiness);readiness();
})();</script></body></html>'''
write("daily-discover-production-test.html", production_lab)


# 5) Reconcile current-state documentation. Historical dated files are intentionally left untouched.
readme = r'''# BarbPH Site Repository

Current-state map reconciled: **2026-08-31 (Manila)**

This repository contains the current BarbPH public site, production infrastructure, control integrations, internal diagnostics, and historical build evidence.

## Start here

For current production truth, read **`BARBPH-SOURCE-OF-TRUTH.md` first**. Dated launch notes and older implementation specs remain in the repository as historical evidence and are not erased when the architecture evolves.

## Current production surfaces

- Homepage: `/`
- Products: `/products`
- Programs: `/programs`
- Publications: `/publications`
- Partnerships: `/partnership`
- Systems & Transmission Logs: opened from the homepage Systems control; `/systems` redirects into that homepage view
- EE / Everything Else: an external published Google Slides destination linked from the homepage tab

## Control architecture

BarbPH is not only a set of static pages. Current production combines:

- the `barbph-admin` Google Sheet for Products, Programs, Publications, The Bulletin, Theme Sources, Sponsor Takeovers, Theme Override, Partnership Config, Barb Originals, and related controls;
- this `barbph-site` repository for the public site, browser controllers, Netlify Functions, documentation, and diagnostic surfaces;
- the separate public `barbph-media` repository for product/program/media assets;
- Netlify Functions and Netlify Blobs for live control reads, continuous source state, health, history, and the Systems ledger.

## Products and Programs catalog

Products and Programs have two complementary paths:

1. **Live path:** the pages request `/.netlify/functions/catalog-feed`, so published Admin Sheet changes can be reflected when a visitor loads the page.
2. **Static fallback / source sync:** `.github/workflows/rebuild.yml` runs the catalog builder hourly and updates the generated card blocks only when the Sheet-backed HTML changes.

The August 31 reconciliation repairs the catalog builder for the repository's ES-module configuration and fixes Programs live rendering so `photo_url` is actually rendered instead of being discarded.

## Homepage priority

The locked homepage priority remains:

1. Sponsor Takeover
2. Theme Override
3. Daily Discover

When the first two controls do not win, the homepage hands off to the continuous Daily Discover public stream.

## Daily Discover continuous source engine

Daily Discover is now a continuous source-of-the-day system rather than the earlier fixed three-image daily-set architecture.

The live `Theme Sources` configuration currently accounts for **21 configured source entries**:

- **11 enabled and production-ready**
- **10 disabled, held, building, parked, pending, or awaiting ingestion**

Barb Originals is separate from those 21 entries and remains the emergency reserve.

The current engine uses one scheduled source for the Manila day, configurable continuous batches, same-source last-known-good caching, retry backoff, an Admin hold/kill-switch path, Barb Originals fallback, persistent history, and Watchtower resynchronization.

See `DAILY-DISCOVER-SOURCE-STATUS.md`, `DAILY-DISCOVER-PRODUCTION-ENGINE.md`, `DAILY-DISCOVER-PRODUCTION-READINESS.md`, and `DAILY-DISCOVER-EMERGENCY-RESERVE.md`.

## Watchtower

Watchtower remains a separate live observation destination and also appears as an hourly BarbPH interlude. The homepage preloads it around the top of the hour, allows a bounded loading window, shows the interlude for the configured period, unloads it afterward, and requests a Daily Discover resynchronization on return.

## Systems & Transmission Logs

BarbPH now maintains a public operational paper trail for the source/transmission machinery. The ledger records sanitized system events such as source selection, batch refresh, degradation, cache use, fallback, recovery, Watchtower transitions, Admin hold events, and unresolved conditions.

The public permanent Systems history begins **2026-08-30**. Internal diagnostics may retain more technical detail than the public ledger.

## Historical architecture is intentionally retained

The repository still contains Satellite tab files, the mechanical Transmission Register work, older fixed-set Daily Discover functions/tests, and dated launch-hardening records. These are retained to show how BarbPH evolved.

Current public architecture supersedes the old Satellite live-telecast tab. The Satellite UI was removed from the homepage on August 30, while its files remain as historical implementation evidence.

## Documentation classes

### Current-state documents

- `BARBPH-SOURCE-OF-TRUTH.md`
- `README.md`
- `DAILY-DISCOVER-SOURCE-STATUS.md`
- `DAILY-DISCOVER-PRODUCTION-ENGINE.md`
- `DAILY-DISCOVER-PRODUCTION-READINESS.md`
- `DAILY-DISCOVER-EMERGENCY-RESERVE.md`
- `HOMEPAGE-PRIORITY-CONTROLLER.md`
- `SEO-SITEWIDE-PLUMBING.md`

### Historical evidence

Dated launch/audit files and superseded Satellite/fixed-set implementation material remain useful for chronology. Do not reinterpret them as current production truth.

### Planned / not production

`GLOBAL-SKY-WORLD-TIME-SPEC.md` remains a planned concept. A planned spec does not become production merely because it exists in the repository.

## Guardrails

- A source name in the Admin Sheet does not make it production-eligible.
- Production requires `enabled=yes`, positive weight, an adapter key, and a production-ready status.
- Disabled/held/unverified worlds must not leak into automatic rotation.
- Barb Originals is reserve protection, not an ordinary weighted institutional source.
- Lab state must remain isolated from production state.
- Historical files are not deleted merely because a newer architecture supersedes them.
'''
write("README.md", readme)

source_of_truth = r'''# BarbPH - Source of Truth

Last reconciled: **2026-08-31 (Manila)**

This is the master current-state record for the BarbPH site. Older dated specs, commits, labs, and screenshots remain historical evidence. When an older document conflicts with this file on current production state, this file and the live implementation take priority.

## Status vocabulary

- **PRODUCTION** - currently part of the public production architecture.
- **READY** - technically eligible/validated but still governed by live Admin Sheet controls.
- **HOLD / BUILDING / PARKED / PENDING** - intentionally excluded from automatic production duty.
- **HISTORICAL** - accurate for an earlier stage but superseded in current production.
- **PLANNED** - approved idea/specification that is not yet production.

## Production posture

- Public domain: `https://barbph.com/`
- GitHub repository: `industriesbarbph-rgb/barbph-site`
- Production branch: `main`
- Repository history records `main` as connected to the Netlify production project `barbphproducts`; therefore treat a main-branch push as production-deploy-capable.
- Production `index.html` exists.
- Internal labs remain separate from normal visitor navigation and must keep `noindex,nofollow` behavior where applicable.

## Public surfaces

- `/` - homepage and Daily Discover world
- `/products` - Products catalog
- `/programs` - Programs catalog
- `/publications` - Publications / Bulletin surface
- `/partnership` - Partnership portal
- `/systems` - redirects to the homepage Systems & Transmission Logs view
- EE / Everything Else - external published Google Slides destination linked from the homepage

## Admin Sheet control plane

The `barbph-admin` Google Sheet is an active control/data plane, not merely a planning file.

Current production integrations include:

- Products and Programs catalog data
- Publications and The Bulletin
- Theme Sources
- Sponsor Takeovers
- Theme Override
- Partnership Config
- Barb Originals reserve
- related source/reporting fields

Products and Programs are available through the live `catalog-feed` function and are also baked into static fallback blocks by the hourly GitHub catalog rebuild.

## Catalog engine - reconciled August 31

The catalog rebuild workflow is scheduled hourly and runs `node build-catalog.js`.

The failure found on August 31 was a module mismatch: `package.json` declares `type: module`, while `build-catalog.js` still used CommonJS `require(...)`. The repair changes the builder to Node ES-module imports and normalizes GitHub blob URLs to raw media URLs.

Programs also had a separate live-rendering defect: its browser-side catalog renderer discarded `photo_url` and always emitted an empty photo frame. That renderer is repaired so live Program cards use the same image behavior as Products.

## Homepage priority controller

Locked priority:

1. Sponsor Takeover
2. Theme Override
3. Daily Discover

The controller uses Manila date boundaries. When neither a valid sponsor nor valid theme override wins, the homepage points to `/.netlify/functions/daily-stream-public`.

## Daily Discover - current continuous architecture

Daily Discover now uses the continuous engine (`daily-stream.mjs` plus the public cached wrapper) rather than relying only on the earlier fixed daily-set engine.

### Live Theme Sources accounting

Current configured Theme Source entries: **21**.

**Enabled + production-ready (11):**

- The Met Open Access
- NASA
- Smithsonian Open Access
- Library of Congress
- NOAA
- USGS
- Art Institute of Chicago
- Cleveland Museum of Art
- National Gallery of Art
- NHCP National Memory Project
- National Heritage Board Singapore

**Disabled / non-production (10):**

- Europeana - HOLD
- New York Public Library - HOLD
- Biodiversity Heritage Library - HOLD
- Getty Open Content - HOLD
- Wildcard - HOLD
- National Diet Library - BUILDING
- National Folk Museum of Korea - PARKED
- National Palace Museum - PENDING_API_KEY
- Old Photos of Hong Kong - INGESTION_REQUIRED
- Khastara / National Library of Indonesia - BUILDING

Barb Originals is maintained separately as the emergency reserve and is not counted among the 21 Theme Source entries.

### Eligibility rule

A normal source is automatically eligible only when all are true:

- `enabled=yes`
- weight is above zero
- `adapter_key` is present
- `production_status` is `PRODUCTION_READY` or `PRODUCTION`

The readiness function reports unsafe enabled rows rather than silently permitting them.

### Continuous behavior

For each Manila day the engine locks one scheduled source. It then serves continuous batches from that source using Admin Sheet batch/rotation/refresh settings.

The current resilience order is:

1. use a still-fresh current batch;
2. refresh from the same scheduled source;
3. on degradation, use same-source last-known-good material during retry backoff when available;
4. if safe same-source material is unavailable, use Barb Originals;
5. if neither path is safe, return `SAFE_FALLBACK_REQUIRED` rather than questionable institutional media.

The engine can recover from degraded/cache/reserve mode back to the scheduled source after a later successful retrieval. This supersedes the older whole-day reserve-takeover rule.

If an administrator disables or de-authorizes the scheduled source during its day, the engine treats that as an Admin hold and does not continue serving that institution's cached material as though approval still existed.

## Watchtower interlude

Watchtower is integrated as an hourly interlude around the top of the hour. The browser controller preloads the frame, uses a bounded readiness/fail-safe window, shows the interlude for the configured period, unloads it afterward, and requests a Daily Discover resynchronization when BarbPH resumes.

## Systems & Transmission Logs

Current BarbPH includes a public operational ledger backed by persistent state. Public events are sanitized and include source/transmission conditions such as selection, refresh, degradation, same-source cache use, Barb Originals use, recovery, Watchtower transitions, Admin hold, and unresolved conditions.

Permanent public Systems history begins **2026-08-30**.

## Publications and Partnership

Publications / The Bulletin are read dynamically from the Admin Sheet through `content-feed.mjs`.

Partnership is now a real public page. The information/guide destination can be controlled through `Partnership Config` and `partnership-info.mjs`.

## SEO / routing

Canonical public content currently includes the homepage, Products, Programs, Publications, and Partnership.

Systems is a state/view of the homepage rather than an independent canonical document. `/systems` redirects into `/?systems=open`, so the redirect-only Systems URL should not be treated as a separate canonical sitemap page.

## Historical architecture retained

The following are retained as implementation history and must not be deleted simply because production moved on:

- Satellite tab assets/scripts/styles
- mechanical Transmission Register files
- older fixed daily-set production/schedule functions and tests
- dated launch-hardening and prototype audit records

The Satellite live-telecast tab itself was removed from the current homepage on **2026-08-30**. Its files remain historical evidence.

The real Aug 20 to Aug 21 Manila-midnight Daily Discover verification also remains valuable historical proof of persistent daily state and cross-session locking, even though the current engine later evolved into continuous streaming.

## Planned, not production

- Global Sky / World Time / Seasons remains planned.
- NOEN/Patroller remains a separate project track and must not be merged into BarbPH production history.

## Current guardrails

- Do not enable a held/building/parked/pending source without completing its stated unlock condition.
- Do not treat the existence of adapter code as permission to enable a source.
- Do not treat Barb Originals as a weighted institutional source.
- Do not serve institutional cache after an Admin hold disables that source.
- Do not let diagnostic state mutate production state.
- Do not erase historical architecture when current-state docs are reconciled.
'''
write("BARBPH-SOURCE-OF-TRUTH.md", source_of_truth)

source_status = r'''# Daily Discover Source Status

Current reconciliation: **2026-08-31 (Manila)**

This file is the current source-accounting record. Earlier 15-entry snapshots are preserved below as historical context rather than deleted.

## Current accounting

The live `Theme Sources` configuration currently contains **21 configured source entries**.

- **11 enabled + production-ready**
- **10 disabled / held / building / parked / pending / ingestion-required**
- **Barb Originals is separate** and remains the emergency reserve

## Enabled + production-ready

| Source | Region | Status |
| --- | --- | --- |
| The Met Open Access | Global / USA | PRODUCTION_READY |
| NASA | Global / USA | PRODUCTION_READY |
| Smithsonian Open Access | Global / USA | PRODUCTION_READY |
| Library of Congress | USA | PRODUCTION_READY |
| NOAA | USA | PRODUCTION_READY |
| USGS | USA | PRODUCTION_READY |
| Art Institute of Chicago | USA | PRODUCTION_READY |
| Cleveland Museum of Art | USA | PRODUCTION_READY |
| National Gallery of Art | USA | PRODUCTION_READY |
| NHCP National Memory Project | Philippines | PRODUCTION_READY |
| National Heritage Board Singapore | Singapore | PRODUCTION_READY |

## Disabled / not in automatic production

| Source | Status | Current reason / unlock condition |
| --- | --- | --- |
| Europeana | HOLD | Complete rights/API verification and live adapter proof. |
| New York Public Library | HOLD | Complete API access and live retrieval proof. |
| Biodiversity Heritage Library | HOLD | Complete API access and public-domain-only retrieval proof. |
| Getty Open Content | HOLD | Finish rights filtering and live retrieval validation. |
| Wildcard | HOLD | Create a pre-approved rights-safe catalogue. |
| National Diet Library | BUILDING | Finish NDL Image Bank adapter and pass live/rights tests. |
| National Folk Museum of Korea | PARKED | Revisit later and obtain approved API access if activation is desired. |
| National Palace Museum | PENDING_API_KEY | Finish the open-data/CC0 retrieval path and pass live proof; API key only if still needed. |
| Old Photos of Hong Kong | INGESTION_REQUIRED | Build/import the rights-cleared photo catalogue and pass continuous-stream testing. |
| Khastara / National Library of Indonesia | BUILDING | Build a verified rights-cleared catalogue subset and pass retrieval testing. |

## Eligibility rule

The continuous engine does not use a fixed hard-coded list of nine sources anymore. Runtime eligibility is status-driven.

A source enters the automatic pool only when:

- `enabled=yes`
- weight is above zero
- `adapter_key` exists
- `production_status` is `PRODUCTION_READY` or `PRODUCTION`

The readiness endpoint flags a source that is enabled while not production-ready or missing an adapter.

## Barb Originals reserve

Barb Originals is not one of the 21 Theme Sources entries and does not compete by weight. It is the safety reserve used after same-source continuity options are exhausted or when an Admin hold prevents continued institutional serving.

## Historical source accounting

### 2026-08-20 snapshot

At that stage the architecture was documented as 15 accounted entries: nine lab-success public sources, five parked/waiting public worlds, and Barb Originals as reserve.

That snapshot remains useful history but is no longer the current inventory. New Asian/public-data source work and the continuous engine expanded the configured source catalogue after that date.
'''
write("DAILY-DISCOVER-SOURCE-STATUS.md", source_status)

production_engine = r'''# Daily Discover Production Engine - Continuous Source Layer

Current reconciliation: **2026-08-31 (Manila)**

Current production Daily Discover is centered on `netlify/functions/daily-stream.mjs`, exposed to ordinary visitors through `netlify/functions/daily-stream-public.mjs` and driven in the browser by `continuous-source-controller.js`.

The older `daily-discover-production.mjs` fixed daily-set engine remains in the repository as compatibility/history and as evidence of the Aug 20 to Aug 21 production rollover verification.

## Source eligibility

The current engine reads live `Theme Sources` rows. A normal source is eligible only when:

- `enabled=yes`
- weight is above zero
- `adapter_key` is present
- `production_status` is `PRODUCTION_READY` or `PRODUCTION`

This makes source eligibility status-driven rather than dependent on the old nine-source `PASSED` list.

## One scheduled source per Manila day

The engine selects and locks one scheduled source for the Manila date. When more than one eligible source exists, weighted selection avoids repeating yesterday's scheduled source when another eligible choice is available.

The day control record preserves the selected source plus its batch size, rotation interval, refresh interval, rights rule, adapter key, and region.

## Continuous batches

The selected source owns the Daily Discover stream for that Manila day. The engine repeatedly refreshes rights-safe batches from that source rather than stopping after one fixed three-image set.

Admin Sheet controls are clamped to safe runtime ranges for batch size, rotation interval, and refresh interval.

## Continuity and failover order

The current continuity order is:

1. Serve the current batch while it is still fresh.
2. Refresh from the same scheduled source when due.
3. If the source degrades, retry with bounded backoff.
4. During backoff, serve same-source last-known-good material when available.
5. If safe same-source material is unavailable, request Barb Originals.
6. If Barb Originals is also unavailable, return `SAFE_FALLBACK_REQUIRED` rather than questionable third-party media.

A degraded source can later recover. Successful retrieval moves service back to the scheduled source and records a recovery event.

## Admin hold / kill switch

If the scheduled source is disabled or loses a production-ready status during its day, production treats it as an Admin hold.

The engine must not keep serving cached institutional material after that hold. It attempts Barb Originals instead. If the reserve cannot serve, the safe result is an explicit unresolved fallback condition.

## Persistent state and history

Production uses the `barbph-daily-discover` Netlify Blobs store for:

- daily control lock
- current stream state
- source health / retry state
- seen asset IDs
- same-source last-known-good cache
- compatibility day record
- cross-day history
- continuous event history

Lab mode uses isolated deploy-store state rather than the production store.

## Watchtower resynchronization

The stream accepts a resynchronization request after the Watchtower interlude. A successful post-Watchtower refresh is recorded as a source batch/recovery event rather than silently advancing unrelated source state.

## Historical verification retained

The Aug 20 to Aug 21, 2026 Manila-midnight verification proved the earlier persistent daily lock and cross-session history path: a new Aug 21 NASA/Mars set was created after midnight and a separate session read the same stored set.

That proof remains part of BarbPH history. It does not imply that the old fixed-set behavior is still the current homepage engine.
'''
write("DAILY-DISCOVER-PRODUCTION-ENGINE.md", production_engine)

readiness = r'''# Daily Discover Production Readiness Gate

Current reconciliation: **2026-08-31 (Manila)**

Status: implemented as a read-only Netlify diagnostic in `netlify/functions/daily-discover-readiness.mjs`.

## Purpose

The readiness gate reports whether the current continuous source engine is safely configured. It does not enable a source, change spreadsheet controls, create production history, or alter the active stream.

## What it checks

- `Theme Sources` is readable.
- `Barb Originals` is readable.
- every enabled source has a production-ready status and adapter key;
- at least one production-ready source is enabled with positive weight;
- Barb Originals contains at least 3 enabled unique valid image URLs;
- current production Blobs state can be read when running in production context;
- current daily control, served source, service mode, health, retry timing, generation, event count, and history count.

## Current eligibility model

`PRODUCTION_READY` and `PRODUCTION` are the accepted ready states.

Inactive statuses such as `HOLD`, `BUILDING`, `PARKED`, `PENDING_API_KEY`, and `INGESTION_REQUIRED` remain out of automatic production unless their configuration is deliberately changed after validation.

## Current readiness states

- `BLOCKED` - one or more production blockers are present.
- `READY_WITH_WARNINGS` - no blocker, but an unknown/inconsistent inactive status needs attention.
- `READY_FOR_PRODUCTION` - the engine is armed safely, reserve protection is ready, and no unsafe source is enabled.

The endpoint also reports `production_armed` as a boolean and returns detailed blockers/warnings.

## Reconciled source counts

At the August 31 reconciliation, the live Theme Sources configuration contains:

- 21 configured sources
- 11 production-ready sources
- 11 enabled production sources
- 10 paused/disabled sources

These counts are configuration facts from the reconciliation, not a promise that they will never change. The endpoint always computes live counts from the Admin Sheet.

## Reserve gate

Barb Originals requires at least 3 enabled unique valid image URLs. The endpoint reports `available_count`, `minimum_required`, and `ready`.

## Safety guards reported by the endpoint

The current readiness response explicitly reports support for:

- one source per Manila day
- continuous batches
- same-source cache
- Barb Originals final fallback
- Admin kill switch
- Watchtower resynchronization
- exclusion of unverified sources from rotation

## Endpoint

`/.netlify/functions/daily-discover-readiness`

This endpoint is for diagnostics. Do not surface its raw technical response as ordinary homepage content.
'''
write("DAILY-DISCOVER-PRODUCTION-READINESS.md", readiness)

reserve_doc = r'''# Daily Discover Emergency Reserve - Current Policy

Current reconciliation: **2026-08-31 (Manila)**

## Purpose

Barb Originals is the emergency reserve for Daily Discover. It is not part of the normal weighted institutional/public-source rotation.

## Current continuous-engine duty order

1. Keep the scheduled public source for the Manila day.
2. Serve its current fresh batch while valid.
3. Refresh from that same source when due.
4. If retrieval degrades, use retry backoff and same-source last-known-good material when available.
5. If no safe same-source material can carry the stream, use Barb Originals.
6. If Barb Originals also cannot serve safely, return a hard safe fallback condition rather than questionable third-party media.

## Recovery behavior

Under the continuous engine, Barb Originals does **not** necessarily own the rest of the Manila day after one source failure.

The scheduled source remains the day's scheduled source. After backoff or an explicit resynchronization, the engine may attempt it again. A successful retrieval returns service to that source and records recovery.

This supersedes the older Aug 20 policy in which a Barb Originals takeover was described as lasting for the rest of the day. That older policy remains historical evidence of the earlier fixed-set engine.

## Admin hold behavior

If the administrator disables or de-authorizes the scheduled source, the engine treats that as an Admin hold and must not continue serving that institution's cached material.

Barb Originals is the preferred safe substitute during the hold. If the reserve is unavailable, the system returns `SAFE_FALLBACK_REQUIRED`.

## Reserve rules

- Reserve assets come from the `Barb Originals` Sheet tab.
- `enabled=yes` is required.
- 3 enabled unique valid images is the minimum readiness threshold, not a maximum.
- A larger reserve is preferred for resilience and variety.
- Barb Originals does not compete by weight with institutional/public sources.
- Held, building, parked, pending, or unverified public sources are not emergency substitutes.

## Diagnostics

The readiness endpoint reports reserve count and readiness. Lab-mode continuous source tests use isolated state and may intentionally force source failure to verify the safety chain without mutating the production day.
'''
write("DAILY-DISCOVER-EMERGENCY-RESERVE.md", reserve_doc)

priority_doc = r'''# BarbPH Homepage Priority Controller

Current reconciliation: **2026-08-31 (Manila)**

Status: integrated into the current homepage architecture through `netlify/functions/homepage-priority.mjs`.

## Locked priority

1. Sponsor Takeover
2. Theme Override
3. Daily Discover

The controller uses `Asia/Manila` for scheduling decisions.

## Sponsor Takeovers

A sponsor can win only when its Admin Sheet row is approved, inside the active date window, has a brand name, uses an allowed image/video media type, has a valid HTTPS media URL, and has a valid HTTPS overlay link when one is supplied.

If multiple valid approved sponsors overlap, the first valid row in Sheet order wins and conflict count is reported diagnostically.

## Theme Override

A Theme Override can win only when no valid sponsor wins, `override_active=yes`, a theme name exists, and the Manila date is inside the configured window.

If multiple valid overrides overlap, the first valid row in Sheet order wins and the conflict is reported diagnostically.

## Daily Discover handoff

When neither higher-priority mode wins, the controller returns `selected_mode: daily_discover` and points to:

`/.netlify/functions/daily-stream-public`

That endpoint is the current public wrapper for the continuous source-of-the-day engine.

## Failure behavior

If the Sponsor Takeovers or Theme Override control sheet cannot be read, the controller returns `CONTROL_UNAVAILABLE` rather than silently ignoring a higher-priority obligation.

## Diagnostic mode

`homepage-priority-test.html` remains an internal `noindex,nofollow` test surface. Synthetic sponsor/theme/daily modes do not write spreadsheet controls or production source state.
'''
write("HOMEPAGE-PRIORITY-CONTROLLER.md", priority_doc)

seo_doc = r'''# BarbPH Sitewide SEO Plumbing

Current reconciliation: **2026-08-31 (Manila)**

## Canonical policy

Use the custom-domain, extensionless URLs as the canonical public addresses.

Current canonical content pages:

- `https://barbph.com/`
- `https://barbph.com/products`
- `https://barbph.com/programs`
- `https://barbph.com/publications`
- `https://barbph.com/partnership`

Do not use the Netlify subdomain as a canonical URL. Do not use `.html` URLs as canonical public addresses.

## Systems route

Systems & Transmission Logs is currently a homepage state/view, not an independent canonical content document.

`/systems` redirects to `/?systems=open`. Because that route ultimately resolves to the homepage canonical, the redirect-only `/systems` URL should not be listed as a separate sitemap URL.

## Sitemap policy

`sitemap.xml` should contain only direct canonical public content pages that BarbPH wants indexed.

Current sitemap set:

- Homepage
- Products
- Programs
- Publications
- Partnership

Internal labs, prototypes, Netlify Functions, redirect-only routes, and external EE/Google Slides destinations do not belong in the BarbPH sitemap.

## Robots policy

`robots.txt` allows ordinary public crawling and disallows Netlify Functions.

Internal diagnostic HTML pages should carry `noindex,nofollow`. Sitemap omission plus page-level noindex is the indexing guardrail for those HTML lab surfaces.

## Search Console handoff

1. Verify `barbph.com` ownership.
2. Submit `https://barbph.com/sitemap.xml`.
3. Inspect the homepage, Products, Programs, Publications, and Partnership individually.
4. Request indexing only for canonical production pages.
5. Do not request indexing for diagnostic labs, prototypes, redirect-only Systems state, or Netlify Functions.

## Guardrail

Do not add unfinished, diagnostic, parked, prototype, redirect-only, or placeholder URLs to the sitemap merely to make it look larger. The sitemap is a clean list of canonical public content.
'''
write("SEO-SITEWIDE-PLUMBING.md", seo_doc)

lab_doc = r'''# Daily Discover Production Gate Lab

Current reconciliation: **2026-08-31 (Manila)**

Status: implemented as `daily-discover-production-test.html` and updated for the current continuous source engine.

This is a `noindex,nofollow` internal diagnostic page.

## What the page does

- Reads `/.netlify/functions/daily-discover-readiness`.
- Shows current configured / production-ready / enabled source counts.
- Shows Barb Originals reserve readiness.
- Shows current daily lock/history information when available.
- Builds source dry-run buttons from the readiness response instead of a hard-coded nine-source list.
- Calls `/.netlify/functions/daily-stream?lab=1&force_source=...` for isolated source tests.
- Uses `force_fail=1` for an intentional failure/reserve test.

## Safety behavior

Lab mode uses isolated deploy-store state. It does not replace the production Manila-day control or production stream history.

## Page

`/daily-discover-production-test.html`
'''
write("DAILY-DISCOVER-PRODUCTION-GATE-LAB.md", lab_doc)


# 6) Systems is a homepage state, so keep the sitemap canonical-only.
sitemap = '''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://barbph.com/</loc></url>
  <url><loc>https://barbph.com/products</loc></url>
  <url><loc>https://barbph.com/programs</loc></url>
  <url><loc>https://barbph.com/publications</loc></url>
  <url><loc>https://barbph.com/partnership</loc></url>
</urlset>'''
write("sitemap.xml", sitemap)


# 7) Run the repaired builder against the live public Admin Sheet.
subprocess.run(["node", "--check", "build-catalog.js"], cwd=ROOT, check=True)
subprocess.run(["node", "build-catalog.js"], cwd=ROOT, check=True)

# Builder only replaces AUTOGEN blocks, but validate the important August 31 outcomes.
programs_after = read("programs.html")
products_after = read("products.html")
checks = {
    "Programs includes Career Navigation": "Career Navigation" in programs_after,
    "Programs includes Coach Doll Mentorship": "Coach Doll Mentorship" in programs_after,
    "Programs includes Job Interview Practice Session": "Job Interview Practice Session" in programs_after,
    "Programs includes Consultation": "Consultation" in programs_after,
    "Programs renders photo_url live": "const photo = normalizeImage(x.photo_url);" in programs_after,
    "Programs contains Career Navigation image": "486363695_632371549428293_4964588722830912259_n.jpg" in programs_after,
    "Products includes IKL": "IKL" in products_after,
    "Products includes The Watch Tower": "The Watch Tower" in products_after,
}
failed = [name for name, ok in checks.items() if not ok]
if failed:
    raise RuntimeError("Validation failed: " + "; ".join(failed))

print("BARBPH reconciliation complete")
for name in checks:
    print("OK:", name)
