import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const SOURCE_URL = 'https://watchtower.barbph.com/global-sky.html';
const OUT_DIR = new URL('./public/', import.meta.url);
const PREVIEW_URL = 'https://raw.githubusercontent.com/industriesbarbph-rgb/barbph-media/3b185df50726e8b8ace56dbc3a3a0ecffebab9d6/watchtower.barbph.com.png';
const PREVIEW_WIDTH = 1447;
const PREVIEW_HEIGHT = 702;

const requiredIds = [
  'CAM-JP-TOKYO-STATION-20260905',
  'CAM-JP-YOKOSUKA-NAGAI-20260905',
  'CAM-JP-SHINJUKU-EAST-20260905',
  'CAM-KR-SEOUL-NAMSAN-20260905',
  'CAM-JP-HAKONE-JUKKOKU-20260905',
  'CAM-JP-FUJI-VIEW-HOTEL-20260905',
  'CAM-ID-BALI-TROPICAL-20260905'
];

const additions = `
        const VERIFIED_CAMERA_ADDITIONS_20260905 = [
            {
                camera_id:'CAM-JP-TOKYO-STATION-20260905', city:'Tokyo Station – Marunouchi Plaza', country:'Japan', provider:'Otemachi-Marunouchi-Yurakucho District Council / YouTube',
                attribution:'© Otemachi–Marunouchi–Yurakucho District Council',
                embed_url:'https://www.youtube-nocookie.com/embed/ZN4gh5IOowM?autoplay=1&mute=1&playsinline=1&rel=0',
                source_page:'https://seetheview.com/cam/1811/tokyo-station-marunouchi-plaza-live-camera'
            },
            {
                camera_id:'CAM-JP-YOKOSUKA-NAGAI-20260905', city:'Nagai Fishing Harbor', country:'Japan', provider:'Yokosuka City Official Channel / YouTube',
                embed_url:'https://www.youtube-nocookie.com/embed/pkonyjvd7xU?autoplay=1&mute=1&playsinline=1&rel=0',
                source_page:'https://seetheview.com/cam/2470/nagai-fishing-harbor-main-port-disaster-surveillance-camera'
            },
            {
                camera_id:'CAM-JP-SHINJUKU-EAST-20260905', city:'Shinjuku Station East Exit', country:'Japan', provider:'Cross Shinjuku Vision / YouTube',
                embed_url:'https://www.youtube-nocookie.com/embed/live_stream?channel=UC8cnCaq-MquhsebMer9A9rQ&autoplay=1&mute=1&playsinline=1&rel=0',
                source_page:'https://shinjuku.xspace.tokyo/en/'
            },
            {
                camera_id:'CAM-KR-SEOUL-NAMSAN-20260905', city:'Namsan / YTN Seoul Tower', country:'South Korea', provider:'YTN Seoul Tower / YouTube',
                embed_url:'https://www.youtube-nocookie.com/embed/M6lq50Ptp1g?autoplay=1&mute=1&playsinline=1&rel=0',
                source_page:'https://seetheview.com/cam/2068/seoul-tower-panoramic-live'
            },
            {
                camera_id:'CAM-JP-HAKONE-JUKKOKU-20260905', city:'Jukkoku Pass – Panorama Terrace 1059', country:'Japan', provider:'Fujiyama NAVI / YouTube',
                embed_url:'https://www.youtube-nocookie.com/embed/4Hro9QIrsYA?autoplay=1&mute=1&playsinline=1&rel=0',
                source_page:'https://seetheview.com/cam/2534/jukkoku-pass-mt-fuji-view-live-camera'
            },
            {
                camera_id:'CAM-JP-FUJI-VIEW-HOTEL-20260905', city:'Fuji View Hotel', country:'Japan', provider:'Fuji View Hotel / YouTube',
                embed_url:'https://www.youtube-nocookie.com/embed/6sin2Z5WM3I?autoplay=1&mute=1&playsinline=1&rel=0',
                source_page:'https://seetheview.com/cam/2537/mt-fuji-from-fuji-view-hotel'
            },
            {
                camera_id:'CAM-ID-BALI-TROPICAL-20260905', city:'Bali Tropical Beach', country:'Indonesia', provider:'Luxury Island / YouTube',
                embed_url:'https://www.youtube-nocookie.com/embed/1avu7zP4dnU?autoplay=1&mute=1&playsinline=1&rel=0',
                source_page:'https://seetheview.com/cam/395/bali-tropical-beach-live-ocean-waves-sounds-24-7'
            }
        ];

`;

const distributedInventory = `        const VERIFIED_CAMERA_INVENTORY = [
            // Set 1 — Europe / Oceania / US / Korea / Thailand / Japan
            EMBEDDED_CAMERA_SET[0],
            VERIFIED_CAMERA_ADDITIONS_20260905[0],
            EMBEDDED_CAMERA_SET[1],
            EMBEDDED_CAMERA_SET[5],
            VERIFIED_CAMERA_SET_B[0],
            VERIFIED_CAMERA_EXPANSION[0],
            VERIFIED_CAMERA_EXPANSION[1],

            // Set 2 — Europe / Canada / US / Thailand / Philippines / Japan
            VERIFIED_CAMERA_SET_B[5],
            VERIFIED_CAMERA_ADDITIONS_20260905[1],
            EMBEDDED_CAMERA_SET[2],
            EMBEDDED_CAMERA_SET[6],
            VERIFIED_CAMERA_SET_B[1],
            VERIFIED_CAMERA_EXPANSION[2],
            VERIFIED_CAMERA_EXPANSION[3],

            // Set 3 — Norway / Finland / Netherlands / Hong Kong / Korea / Japan
            VERIFIED_CAMERA_ADDITIONS_20260905[2],
            VERIFIED_CAMERA_ADDITIONS_20260905[4],
            EMBEDDED_CAMERA_SET[3],
            VERIFIED_CAMERA_SET_B[2],
            VERIFIED_CAMERA_SET_B[4],
            VERIFIED_CAMERA_EXPANSION[5],
            VERIFIED_CAMERA_ADDITIONS_20260905[3],

            // Set 4 — Slovenia / Finland / US / Philippines / Hong Kong / Bali / Japan
            VERIFIED_CAMERA_ADDITIONS_20260905[5],
            EMBEDDED_CAMERA_SET[4],
            VERIFIED_CAMERA_SET_B[3],
            VERIFIED_CAMERA_SET_B[6],
            VERIFIED_CAMERA_EXPANSION[4],
            VERIFIED_CAMERA_EXPANSION[6],
            VERIFIED_CAMERA_ADDITIONS_20260905[6]
        ];`;

const oldInventory = `        const VERIFIED_CAMERA_INVENTORY = [
            ...EMBEDDED_CAMERA_SET,
            ...VERIFIED_CAMERA_SET_B,
            ...VERIFIED_CAMERA_EXPANSION
        ];`;

async function sourceHtml() {
  if (process.env.GLOBAL_SKY_SOURCE_FILE) return readFile(process.env.GLOBAL_SKY_SOURCE_FILE, 'utf8');
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(SOURCE_URL, { redirect: 'follow' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  throw new Error(`Unable to fetch Global Sky source: ${lastError}`);
}

function idsFrom(html) {
  return [...html.matchAll(/camera_id:'([^']+)'/g)].map(m => m[1]);
}

async function socialPreviewBytes() {
  let bytes;
  if (process.env.GLOBAL_SKY_PREVIEW_FILE) {
    bytes = await readFile(process.env.GLOBAL_SKY_PREVIEW_FILE);
  } else {
    const response = await fetch(PREVIEW_URL, { redirect: 'follow' });
    if (!response.ok) throw new Error(`Unable to fetch social preview: HTTP ${response.status}`);
    bytes = Buffer.from(await response.arrayBuffer());
  }

  if (bytes.length < 24 || bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
    throw new Error('Social preview guard failed: expected a PNG file.');
  }
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  if (width !== PREVIEW_WIDTH || height !== PREVIEW_HEIGHT) {
    throw new Error(`Social preview guard failed: expected ${PREVIEW_WIDTH}x${PREVIEW_HEIGHT}, found ${width}x${height}.`);
  }
  return {
    bytes,
    width,
    height,
    sha256: createHash('sha256').update(bytes).digest('hex')
  };
}

function removeRange(html, startMarker, endMarker, label) {
  const start = html.indexOf(startMarker);
  if (start < 0) return html;
  const end = html.indexOf(endMarker, start + startMarker.length);
  if (end < 0) throw new Error(`Static cleanup guard failed: ${label} end marker not found.`);
  return html.slice(0, start) + html.slice(end);
}

function ensureCameraInventory(html) {
  const hasAllAdditions = requiredIds.every(id => html.includes(`camera_id:'${id}'`));
  const addStart = html.indexOf('        const VERIFIED_CAMERA_ADDITIONS_20260905 = [');
  const invStart = html.indexOf('        const VERIFIED_CAMERA_INVENTORY = [');

  if (addStart >= 0 && invStart > addStart && hasAllAdditions) {
    const invEndMarker = '\n        ];';
    const invEnd = html.indexOf(invEndMarker, invStart);
    if (invEnd < 0) throw new Error('Inventory guard failed: existing 28-camera inventory end not found.');
    return html.slice(0, addStart) + additions + distributedInventory + html.slice(invEnd + invEndMarker.length);
  }

  if (!html.includes(oldInventory)) {
    throw new Error('Inventory guard failed: source is neither the preserved 21-camera page nor the approved 28-camera page.');
  }
  return html.replace(oldInventory, additions + distributedInventory);
}

function stripLedgerAndBackend(html) {
  let out = html;

  out = removeRange(out, '        /* Built-in receipt view.', '        @media (prefers-reduced-motion: reduce)', 'receipt CSS');
  out = removeRange(out, '    <section id="receipt-view"', '    <div id="feed-focus-overlay"', 'receipt HTML');

  const receiptHook = `                const receiptButton = document.getElementById('open-broadcast-receipt');\n                if (receiptButton) receiptButton.addEventListener('click', openCurrentReceipt);\n`;
  out = out.replace(receiptHook, '');

  if (out.includes('        async function postEvent(event) {')) {
    out = removeRange(out, '        async function postEvent(event) {', '        function startPanelModeHealthProbe', 'event API function');
    out = out.replace('        function startPanelModeHealthProbe', '        function postEvent() {}\n\n        function startPanelModeHealthProbe');
  }

  if (out.includes('        function renderReceipt(')) {
    out = removeRange(out, '        function renderReceipt(', '        async function init() {', 'receipt functions');
  }

  if (out.includes("fetch('/api/stage/current'")) {
    out = removeRange(out, '        async function init() {', '        function handleViewportChange()', 'remote startup function');
    out = out.replace(
      '        function handleViewportChange()',
      `        async function init() {\n            makeStatusPanels();\n            makeFeedPanels();\n            stageData = detachedStageData();\n            mountStageData();\n            scheduleGeometry();\n        }\n\n        function handleViewportChange()`
    );
  }

  out = out.replace('        let ledgerOnline = false;\n', '');
  out = out.replace('            if (ledgerOnline || !stageData?.session) return false;', '            if (!stageData?.session) return false;');

  const heartbeatStart = "                    if (ledgerOnline && stageData?.session?.broadcast_id) {";
  const heartbeatEnd = '                        });\n                    }';
  const hs = out.indexOf(heartbeatStart);
  if (hs >= 0) {
    const he = out.indexOf(heartbeatEnd, hs);
    if (he < 0) throw new Error('Static cleanup guard failed: heartbeat ledger block end missing.');
    out = out.slice(0, hs) + out.slice(he + heartbeatEnd.length);
  }

  const forbidden = ['/api/', 'ledgerOnline', 'receipt-view', 'receipt-mode', 'renderReceipt', 'initReceiptView', 'open-broadcast-receipt', 'openCurrentReceipt'];
  for (const token of forbidden) {
    if (out.includes(token)) throw new Error(`Static cleanup failed: forbidden ledger/backend token remains: ${token}`);
  }
  return out;
}

function applySocialMetadata(html) {
  let out = html;
  out = out.replace(/<meta property="og:image:width" content="[^"]+">/, '<meta property="og:image:width" content="1447">');
  out = out.replace(/<meta property="og:image:height" content="[^"]+">/, '<meta property="og:image:height" content="702">');
  return out;
}

function applyAttributionUI(html) {
  let out = html;
  if (!out.includes('.feed-focus-country')) throw new Error('Attribution guard failed: focus caption CSS marker missing.');
  if (!out.includes("const feedFocusCountry = document.getElementById('feed-focus-country');")) throw new Error('Attribution guard failed: focus country element missing.');

  if (!out.includes('feed-focus-attribution')) {
    out = out.replace(
      '                <span id="feed-focus-country" class="feed-focus-country"></span>',
      '                <span id="feed-focus-country" class="feed-focus-country"></span>\n                <span id="feed-focus-attribution" class="feed-focus-attribution"></span>'
    );
    out = out.replace(
      '        .feed-focus-media iframe { pointer-events: auto; }',
      `        .feed-focus-media iframe { pointer-events: auto; }\n        .feed-focus-attribution {\n            display: block;\n            margin-top: 5px;\n            max-width: min(92vw, 760px);\n            font: 500 clamp(8px, .85vw, 12px)/1.25 'Oswald', sans-serif;\n            letter-spacing: .025em;\n            color: rgba(255,255,255,.86);\n            text-transform: none;\n        }`
    );
    out = out.replace(
      "        const feedFocusCountry = document.getElementById('feed-focus-country');",
      "        const feedFocusCountry = document.getElementById('feed-focus-country');\n        const feedFocusAttribution = document.getElementById('feed-focus-attribution');"
    );
    out = out.replace(
      "            feedFocusCountry.textContent = cam.country || '';",
      "            feedFocusCountry.textContent = cam.country || '';\n            if (feedFocusAttribution) feedFocusAttribution.textContent = cam.attribution || cam.provider || '';"
    );
  }

  return out;
}

const source = await sourceHtml();
if (!source.includes('<title>Global Sky Live Cameras | Coach Doll Patrols</title>')) throw new Error('Source guard failed: Global Sky title marker missing.');

const sourceUnique = new Set(idsFrom(source).filter(id => id.startsWith('CAM-')));
if (![21, 28].includes(sourceUnique.size)) throw new Error(`Source guard failed: expected 21 or 28 unique cameras, found ${sourceUnique.size}.`);

let patched = ensureCameraInventory(source);
patched = stripLedgerAndBackend(patched);
patched = applySocialMetadata(patched);
patched = applyAttributionUI(patched);

const uniqueAfter = new Set(idsFrom(patched));
for (const required of requiredIds) if (!uniqueAfter.has(required)) throw new Error(`Camera injection failed: ${required} missing.`);
if (uniqueAfter.size !== 28) throw new Error(`Camera count guard failed: expected 28 unique cameras, found ${uniqueAfter.size}.`);
if (!patched.includes('const SET_INTERVAL_MS = 2 * 60 * 1000;')) throw new Error('Rotation guard failed: 2-minute set interval missing.');
if (!patched.includes("camera_id:'CAM-FI-ROVANIEMI-CS-6452'")) throw new Error('Inventory guard failed: Rovaniemi missing.');
if (!patched.includes('GLOBAL SKY DESK')) throw new Error('Broadcast ID desk guard failed.');
if (!patched.includes('© Otemachi–Marunouchi–Yurakucho District Council')) throw new Error('Attribution guard failed: Tokyo Station attribution missing.');
if (!patched.includes('feed-focus-attribution')) throw new Error('Attribution guard failed: visible attribution UI missing.');
if (!patched.includes('<meta property="og:image:width" content="1447">') || !patched.includes('<meta property="og:image:height" content="702">')) throw new Error('Social preview metadata guard failed.');

const preview = await socialPreviewBytes();

await mkdir(OUT_DIR, { recursive: true });
await writeFile(new URL('global-sky-social-preview.png', OUT_DIR), preview.bytes);
await writeFile(new URL('global-sky.html', OUT_DIR), patched, 'utf8');
await writeFile(new URL('_redirects', OUT_DIR), '/  /global-sky.html  200\n', 'utf8');
await writeFile(new URL('robots.txt', OUT_DIR), 'User-agent: *\nAllow: /\nSitemap: https://watchtower.barbph.com/sitemap.xml\n', 'utf8');
await writeFile(new URL('sitemap.xml', OUT_DIR), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://watchtower.barbph.com/</loc></url>\n  <url><loc>https://watchtower.barbph.com/global-sky.html</loc></url>\n</urlset>\n', 'utf8');
await writeFile(new URL('build-manifest.json', OUT_DIR), JSON.stringify({
  source: SOURCE_URL,
  accepted_source_camera_counts: [21, 28],
  total_camera_count: 28,
  added_camera_count: 7,
  scout: false,
  functions: false,
  ledger: false,
  backend_api: false,
  broadcast_id_desk: true,
  rotation_minutes: 2,
  camera_sets: 4,
  social_preview: {
    file: 'global-sky-social-preview.png',
    width: preview.width,
    height: preview.height,
    sha256: preview.sha256,
    source: PREVIEW_URL
  },
  tokyo_station_attribution: true,
  required_camera_ids: requiredIds
}, null, 2) + '\n', 'utf8');

console.log(`Global Sky static build OK: 28 cameras in 4 distributed sets; Scout/ledger/API removed; preview ${preview.width}x${preview.height} sha256=${preview.sha256}; future 21/28 source rebuilds supported.`);
