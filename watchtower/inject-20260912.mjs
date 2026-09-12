import { readFile, writeFile } from 'node:fs/promises';

const HTML_FILE = new URL('./public/global-sky.html', import.meta.url);
const MANIFEST_FILE = new URL('./public/build-manifest.json', import.meta.url);
const DOC_URL = 'https://docs.google.com/document/d/1jCrlDZmfVWZoHqZJp0FlfNfsLy70Kw5ChutEjR7N-vI/edit?usp=sharing';
const INVENTORY_MARKER = '        const VERIFIED_CAMERA_INVENTORY = [\n';
const ADDITION_FAMILY = 'VERIFIED_CAMERA_ADDITIONS_20260912';

const CAMERAS = [
  { camera_id:'CAM-NZ-AUCKLAND-VIADUCT-20260912', city:'Auckland Viaduct Harbour', country:'New Zealand', provider:'Auckland Viaduct Harbour Live / YouTube', attribution:'Auckland Viaduct Harbour live camera', embed_url:'https://www.youtube-nocookie.com/embed/live_stream?channel=UCfNoVlW5-BHsoCKTGs_F0WQ&autoplay=1&mute=1&playsinline=1&rel=0', source_page:'https://www.youtube.com/channel/UCfNoVlW5-BHsoCKTGs_F0WQ/live' },
  { camera_id:'CAM-NZ-OHAKUNE-RUAPEHU-20260912', city:'Mt Ruapehu from Ohakune', country:'New Zealand', provider:'MtRuapehu / MyBnB.nz / YouTube', attribution:'MtRuapehu webcam from Ohakune', embed_url:'https://www.youtube-nocookie.com/embed/zHA8IMhdDF0?autoplay=1&mute=1&playsinline=1&rel=0', source_page:'https://mybnb.nz/mt-ruapehu-turoa-webcam-from-ohakune/' },
  { camera_id:'CAM-AU-SYDNEY-HARBOUR-20260912', city:'Sydney Harbour / WebcamSydney 1', country:'Australia', provider:'WebcamSydney / YouTube', attribution:'WebcamSydney', embed_url:'https://www.youtube-nocookie.com/embed/5uZa3-RMFos?autoplay=1&mute=1&playsinline=1&rel=0', source_page:'https://www.youtube.com/watch?v=5uZa3-RMFos' },
  { camera_id:'CAM-NZ-TAIAROA-ALBATROSS-20260912', city:'Northern Royal Albatross Cam – Pukekura/Taiaroa Head', country:'New Zealand', provider:'New Zealand Department of Conservation / Cornell Lab Bird Cams', attribution:'NZ Department of Conservation / Cornell Lab Bird Cams', embed_url:'https://www.youtube-nocookie.com/embed/Mm_zVDDUeNA?autoplay=1&mute=1&playsinline=1&rel=0', source_page:'https://www.doc.govt.nz/royalcam' },
  { camera_id:'CAM-JP-TOKYO-KABUKICHO-20260912', city:'Shinjuku Kabukicho Ichibangai', country:'Japan', provider:'Kabukicho Live Channel / YouTube', attribution:'Kabukicho Live Channel', embed_url:'https://www.youtube-nocookie.com/embed/DjdUEyjx8GM?autoplay=1&mute=1&playsinline=1&rel=0', source_page:'https://www.youtube.com/watch?v=DjdUEyjx8GM' },
  { camera_id:'CAM-JP-SAPPORO-TANUKIKOJI-20260912', city:'Sapporo Tanukikoji 8-chome', country:'Japan', provider:'Sapporo live camera / YouTube', attribution:'Sapporo Tanukikoji live camera', embed_url:'https://www.youtube-nocookie.com/embed/TPIzbMwlrOI?autoplay=1&mute=1&playsinline=1&rel=0', source_page:'https://www.youtube.com/watch?v=TPIzbMwlrOI' },
  { camera_id:'CAM-JP-TOKYO-SHINONOME2-20260912', city:'HMTV Tokyo Shinonome #2', country:'Japan', provider:'HMTV / YouTube', attribution:'HMTV Tokyo Shinonome', embed_url:'https://www.youtube-nocookie.com/embed/i7N4cYYdjXE?autoplay=1&mute=1&playsinline=1&rel=0', source_page:'https://www.youtube.com/watch?v=i7N4cYYdjXE' },
  { camera_id:'CAM-TW-TAICHUNG-TECHI-DAM-20260912', city:'Techi Dam 4K Live Camera', country:'Taiwan', provider:'Taiwan tourism live camera / YouTube', attribution:'Taiwan tourism live camera', embed_url:'https://www.youtube-nocookie.com/embed/ZayKvJKDPWc?autoplay=1&mute=1&playsinline=1&rel=0', source_page:'https://www.youtube.com/watch?v=ZayKvJKDPWc' },
  { camera_id:'CAM-JP-YAMANAKAKO-FUJI-20260912', city:'Mt Fuji from Yamanaka Lake / Fujiyama Plateau', country:'Japan', provider:'Fujiyama live camera / YouTube', attribution:'Fujiyama live camera', embed_url:'https://www.youtube-nocookie.com/embed/WjVH-0qSwOw?autoplay=1&mute=1&playsinline=1&rel=0', source_page:'https://www.youtube.com/watch?v=WjVH-0qSwOw' },
  { camera_id:'CAM-US-HI-MAUI-KAANAPALI-20260912', city:'Kaʻanapali Beach – Sheraton Maui Resort & Spa', country:'United States', provider:'Sheraton Maui Resort & Spa / Marriott / Ozolio', attribution:'Sheraton Maui Resort & Spa / Ozolio', embed_url:'https://www.youtube-nocookie.com/embed/HuYWHvFWais?autoplay=1&mute=1&playsinline=1&rel=0', source_page:'https://www.marriott.com/en-us/hotels/hnmsi-sheraton-maui-resort-and-spa/resort-pools/' },
  { camera_id:'CAM-TW-CHIAYI-FENQIHU-20260912', city:'Fenqihu 4K Live Cam', country:'Taiwan', provider:'Alishan National Scenic Area Administration / YouTube', attribution:'Alishan National Scenic Area Administration', embed_url:'https://www.youtube-nocookie.com/embed/B6eki-0-w0g?autoplay=1&mute=1&playsinline=1&rel=0', source_page:'https://www.youtube.com/watch?v=B6eki-0-w0g' },
  { camera_id:'CAM-JP-TOKYO-DOME-CITY-20260912', city:'Tokyo Dome City Official Live Camera', country:'Japan', provider:'Tokyo Dome City / YouTube', attribution:'Tokyo Dome City', embed_url:'https://www.youtube-nocookie.com/embed/7XzfKy8CzdY?autoplay=1&mute=1&playsinline=1&rel=0', source_page:'https://www.youtube.com/watch?v=7XzfKy8CzdY' },
  { camera_id:'CAM-TW-TAICHUNG-GAOMEI-20260912', city:'Gaomei Wetland 4K Live Camera', country:'Taiwan', provider:'Taichung City Government Tourism / YouTube', attribution:'Taichung City Government Tourism', embed_url:'https://www.youtube-nocookie.com/embed/fjhg3gAnMFg?autoplay=1&mute=1&playsinline=1&rel=0', source_page:'https://www.youtube.com/watch?v=fjhg3gAnMFg' },
  { camera_id:'CAM-TH-KOH-SAMUI-GREEN-MANGO-20260912', city:'Soi Green Mango / Munchies Bar – Chaweng', country:'Thailand', provider:'The Real Samui Webcam / YouTube', attribution:'The Real Samui Webcam', embed_url:'https://www.youtube-nocookie.com/embed/yFgVmioYkys?autoplay=1&mute=1&playsinline=1&rel=0', source_page:'https://www.youtube.com/watch?v=yFgVmioYkys' },
  { camera_id:'CAM-TH-KOH-PHANGAN-SANSKARA-20260912', city:'House of Sanskara – Koh Phangan', country:'Thailand', provider:'House of Sanskara / YouTube', attribution:'House of Sanskara', embed_url:'https://www.youtube-nocookie.com/embed/FBYUkqutqzE?autoplay=1&mute=1&playsinline=1&rel=0', source_page:'https://www.youtube.com/watch?v=FBYUkqutqzE' },
  { camera_id:'CAM-TW-YUNLIN-BEIGANG-20260912', city:'Beigang Chaotian Temple', country:'Taiwan', provider:'Yunlin County Government / ROGY360 / YouTube', attribution:'Yunlin County Government / ROGY360', embed_url:'https://www.youtube-nocookie.com/embed/Geo48day-7s?autoplay=1&mute=1&playsinline=1&rel=0', source_page:'https://www.yunlin.gov.tw/News_Content.aspx?n=1244&s=588677' },
  { camera_id:'CAM-JP-HOKKAIDO-TOKACHI-20260912', city:'Tokachi Chuo / Hakucho Bridge', country:'Japan', provider:'Kachimai / YouTube', attribution:'Kachimai', embed_url:'https://www.youtube-nocookie.com/embed/MXabd7Nac7E?autoplay=1&mute=1&playsinline=1&rel=0', source_page:'https://www.youtube.com/watch?v=MXabd7Nac7E' },
  { camera_id:'CAM-JP-TOKYO-RYOGOKU-20260912', city:'Ryogoku / JR Ryogoku Station', country:'Japan', provider:'Tokyolive / YouTube', attribution:'Tokyolive', embed_url:'https://www.youtube-nocookie.com/embed/XpIILFB9iS0?autoplay=1&mute=1&playsinline=1&rel=0', source_page:'https://www.youtube.com/watch?v=XpIILFB9iS0' },
  { camera_id:'CAM-TW-HUALIEN-LIYU-LAKE-20260912', city:'Liyu Lake – Shoufeng Township', country:'Taiwan', provider:'East Longitudinal Valley National Scenic Area Administration / YouTube', attribution:'East Longitudinal Valley National Scenic Area Administration', embed_url:'https://www.youtube-nocookie.com/embed/aaKOV4qkDHw?autoplay=1&mute=1&playsinline=1&rel=0', source_page:'https://www.youtube.com/watch?v=aaKOV4qkDHw' },
  { camera_id:'CAM-TW-HUALIEN-CHANGHONG-20260912', city:'Changhong Bridge – Fengbin Township', country:'Taiwan', provider:'East Coast National Scenic Area Administration / YouTube', attribution:'East Coast National Scenic Area Administration', embed_url:'https://www.youtube-nocookie.com/embed/JnD8Rk3o0BM?autoplay=1&mute=1&playsinline=1&rel=0', source_page:'https://www.youtube.com/watch?v=JnD8Rk3o0BM' },
  { camera_id:'CAM-TW-TAITUNG-SANXIANTAI-20260912', city:'Sanxiantai – Chenggong Township', country:'Taiwan', provider:'East Coast National Scenic Area Administration / YouTube', attribution:'East Coast National Scenic Area Administration', embed_url:'https://www.youtube-nocookie.com/embed/dQ7Sd6PGLdA?autoplay=1&mute=1&playsinline=1&rel=0', source_page:'https://www.youtube.com/watch?v=dQ7Sd6PGLdA' }
];

function serializeCamera(cam) {
  const esc = value => String(value).replaceAll('\\', '\\\\').replaceAll("'", "\\'");
  return `            {\n                camera_id:'${esc(cam.camera_id)}', city:'${esc(cam.city)}', country:'${esc(cam.country)}', provider:'${esc(cam.provider)}',\n                attribution:'${esc(cam.attribution)}',\n                embed_url:'${esc(cam.embed_url)}',\n                source_page:'${esc(cam.source_page)}'\n            }`;
}

function cameraIds(html) {
  return [...html.matchAll(/camera_id:'([^']+)'/g)].map(m => m[1]);
}

function injectCameras(html) {
  const present = CAMERAS.filter(cam => html.includes(`camera_id:'${cam.camera_id}'`));
  if (present.length === CAMERAS.length) return html;
  if (present.length !== 0) throw new Error(`2026-09-12 camera injection found a partial overlay: ${present.length}/${CAMERAS.length}.`);
  if (!html.includes(INVENTORY_MARKER)) throw new Error('2026-09-12 camera injection failed: inventory marker missing.');

  const addition = `        const ${ADDITION_FAMILY} = [\n${CAMERAS.map(serializeCamera).join(',\n')}\n        ];\n\n`;
  const refs = CAMERAS.map((_, i) => `            ${ADDITION_FAMILY}[${i}],`).join('\n') + '\n';
  html = html.replace(INVENTORY_MARKER, addition + INVENTORY_MARKER);
  html = html.replace(INVENTORY_MARKER, INVENTORY_MARKER + refs);
  return html;
}

const NOTE_STYLE = `
<style id="behind-cameras-note-style">
  #status-tooltip.global-sky-desk-tooltip {
    width: min(520px, calc(100vw - 24px));
    max-width: 520px;
  }
  #status-tooltip.global-sky-desk-tooltip .global-sky-desk {
    position: relative;
    min-height: 190px;
    padding-right: 170px;
    box-sizing: border-box;
  }
  /* Behind the Cameras mobile containment: one physical paper block. */
  .behind-cameras-note {
    display: block;
    position: absolute;
    top: 10px;
    right: 0;
    z-index: 12;
    width: 150px;
    min-height: 0;
    padding: 22px 14px 9px;
    box-sizing: border-box;
    color: #151515;
    text-decoration: none;
    background:
      linear-gradient(96deg, rgba(0,0,0,.018), transparent 12%, transparent 86%, rgba(0,0,0,.018)),
      linear-gradient(180deg, #fff 0%, #fff 100%);
    border: 1px solid rgba(0,0,0,.08);
    border-radius: 1px 1px 3px 2px;
    box-shadow:
      0 13px 24px rgba(0,0,0,.19),
      0 4px 8px rgba(0,0,0,.15),
      inset 0 0 0 1px rgba(255,255,255,.7);
    transform-origin: 50% 6px;
    animation: none;
    transform: none;
    will-change: auto;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .behind-cameras-note::before {
    content: '';
    position: absolute;
    top: 5px;
    left: 50%;
    width: 12px;
    height: 12px;
    margin-left: -6px;
    border-radius: 50%;
    background: radial-gradient(circle at 36% 30%, #fff4a8 0 11%, #f0c61e 30%, #c79500 72%, #8d6500 100%);
    box-shadow: 0 2px 3px rgba(0,0,0,.42), inset 0 1px 1px rgba(255,255,255,.7);
  }
  .behind-cameras-note::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(120deg, transparent 0 73%, rgba(0,0,0,.018) 88%, rgba(0,0,0,.04) 100%);
    mix-blend-mode: multiply;
  }
  .behind-cameras-note__title {
    display: block;
    margin: 0 0 6px;
    font: 800 clamp(10px, 1.05vw, 15px)/1.05 'Oswald', Arial, sans-serif;
    letter-spacing: .08em;
    color: #0f1114;
  }
  .behind-cameras-note__body {
    display: block;
    margin: 0 0 9px;
    font: 600 clamp(7px, .67vw, 10px)/1.28 Arial, sans-serif;
    color: #292d31;
  }
  .behind-cameras-note__cta {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font: 800 clamp(6.8px, .62vw, 9px)/1 Arial, sans-serif;
    letter-spacing: .07em;
    color: #151515;
    border-bottom: 1px solid rgba(0,0,0,.42);
    padding-bottom: 2px;
  }
  .behind-cameras-note__title,
  .behind-cameras-note__body,
  .behind-cameras-note__cta { position: relative; z-index: 1; }
  .behind-cameras-note__icon {
    width: 11px;
    height: 11px;
    flex: 0 0 auto;
  }
  .behind-cameras-note:hover,
  .behind-cameras-note:focus-visible {
    box-shadow: 0 16px 30px rgba(0,0,0,.22), 0 5px 10px rgba(0,0,0,.16);
    outline: none;
  }
  @media (prefers-reduced-motion: reduce) {
    .behind-cameras-note { animation: none; transform: none; }
  }
  @media (max-width: 620px) {
    #status-tooltip.global-sky-desk-tooltip {
      width: min(296px, calc(100vw - 20px));
      max-width: 296px;
    }
    #status-tooltip.global-sky-desk-tooltip .global-sky-desk {
      min-height: 0;
      padding-right: 0;
    }
    .behind-cameras-note {
      display: block;
      position: relative;
      top: auto;
      right: auto;
      clear: both;
      width: 100%;
      min-height: 0;
      margin: 16px 0 0;
      padding: 19px 10px 9px;
      animation: none;
      transform: none;
    }
    .behind-cameras-note::before { width: 9px; height: 9px; margin-left: -4.5px; top: 4px; }
    .behind-cameras-note__body { margin-bottom: 6px; }
  }
</style>`;

const NOTE_SCRIPT = `
<script id="behind-cameras-note-loader">
(() => {
  const DOC_URL = ${JSON.stringify(DOC_URL)};

  const makeNote = () => {
    const note = document.createElement('a');
    note.id = 'behind-cameras-note';
    note.className = 'behind-cameras-note';
    note.href = DOC_URL;
    note.target = '_blank';
    note.rel = 'noopener noreferrer';
    note.setAttribute('aria-label', 'Open Behind the Cameras — the ongoing Global Sky Forever Scout Ledger in a new tab');
    note.innerHTML =
      '<span class="behind-cameras-note__title">BEHIND THE CAMERAS</span>' +
      '<span class="behind-cameras-note__body">A living field record of the live-feed technology we scout — what passed, what didn’t, and why.</span>' +
      '<span class="behind-cameras-note__cta"><svg class="behind-cameras-note__icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2.75h8.3L19 7.45V21.25H6z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M14.2 2.9v4.7h4.6M9 12h7M9 15.5h7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>OPEN THE ONGOING RECORD ↗</span>';
    return note;
  };

  const enhanceDeskHtml = html => {
    const template = document.createElement('template');
    template.innerHTML = String(html ?? '');
    const desk = template.content.querySelector('.global-sky-desk');
    if (!desk || desk.querySelector('#behind-cameras-note')) return String(html ?? '');
    desk.appendChild(makeNote());
    return template.innerHTML;
  };

  const installRendererHook = () => {
    const original = window.tooltipContent;
    if (typeof original !== 'function') return false;
    if (original.__behindCamerasStableRenderer) return true;

    const wrapped = function(...args) {
      return enhanceDeskHtml(original.apply(this, args));
    };
    wrapped.__behindCamerasStableRenderer = true;
    wrapped.__behindCamerasOriginal = original;
    window.tooltipContent = wrapped;
    return true;
  };

  const mount = () => {
    const desk = document.querySelector('#status-tooltip .global-sky-desk');
    if (!desk) return false;
    if (desk.querySelector('#behind-cameras-note')) return true;
    if (getComputedStyle(desk).position === 'static') desk.style.position = 'relative';
    desk.appendChild(makeNote());
    return true;
  };

  const observer = new MutationObserver(() => {
    installRendererHook();
    mount();
  });
  const start = () => {
    installRendererHook();
    mount();
    observer.observe(document.body, { childList: true, subtree: true });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
</script>`;

function injectBehindCamerasNote(html) {
  if (!html.includes('behind-cameras-note-style')) {
    if (!html.includes('</head>')) throw new Error('Behind the Cameras note injection failed: </head> missing.');
    html = html.replace('</head>', `${NOTE_STYLE}\n</head>`);
  }
  if (!html.includes('behind-cameras-note-loader')) {
    if (!html.includes('</body>')) throw new Error('Behind the Cameras note injection failed: </body> missing.');
    html = html.replace('</body>', `${NOTE_SCRIPT}\n</body>`);
  }
  return html;
}

let html = await readFile(HTML_FILE, 'utf8');
html = injectCameras(html);
html = injectBehindCamerasNote(html);

const ids = cameraIds(html).filter(id => id.startsWith('CAM-'));
const uniqueIds = new Set(ids);
for (const cam of CAMERAS) {
  if (!uniqueIds.has(cam.camera_id)) throw new Error(`2026-09-12 camera injection failed: ${cam.camera_id} missing.`);
}
if (uniqueIds.size !== 50) throw new Error(`2026-09-12 camera count guard failed: expected 50 unique cameras, found ${uniqueIds.size}.`);
if (html.includes("camera_id:'CAM-ID-SEMERU-A-20260912'")) throw new Error('Semeru Cam A must remain on HOLD at deployment gate; do not silently substitute another Semeru camera.');
if (!html.includes(`href = DOC_URL`) && !html.includes('note.href = DOC_URL')) throw new Error('Behind the Cameras note link assignment missing.');
if (!html.includes("note.target = '_blank'")) throw new Error('Behind the Cameras note must open in a new tab.');

await writeFile(HTML_FILE, html, 'utf8');

let manifest = {};
try { manifest = JSON.parse(await readFile(MANIFEST_FILE, 'utf8')); } catch {}
manifest.total_camera_count = 50;
manifest.added_camera_count = 29;
manifest.release_camera_additions_20260912 = 21;
manifest.release_held_at_deploy_gate_20260912 = ['Semeru Volcano Cam A'];
manifest.behind_cameras_note = true;
manifest.behind_cameras_document = DOC_URL;
manifest.required_camera_ids_20260912 = CAMERAS.map(cam => cam.camera_id);
await writeFile(MANIFEST_FILE, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

console.log('September 12 Watch Tower overlay OK: 21 new cameras added for 50 total; Semeru Cam A held; Behind the Cameras note linked in a new tab.');