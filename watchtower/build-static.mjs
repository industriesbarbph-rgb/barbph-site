import { mkdir, readFile, writeFile } from 'node:fs/promises';

// During this migration build, the public production URL still serves the
// preserved 21-camera Global Sky. The source guards below deliberately refuse
// to mutate an unexpected page shape.
const SOURCE_URL = 'https://watchtower.barbph.com/global-sky.html';
const OUT_DIR = new URL('./public/', import.meta.url);

const additions = `
        const VERIFIED_CAMERA_ADDITIONS_20260905 = [
            {
                camera_id:'CAM-JP-TOKYO-STATION-20260905', city:'Tokyo Station – Marunouchi Plaza', country:'Japan', provider:'Otemachi-Marunouchi-Yurakucho District Council / YouTube',
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

const oldInventory = `        const VERIFIED_CAMERA_INVENTORY = [
            ...EMBEDDED_CAMERA_SET,
            ...VERIFIED_CAMERA_SET_B,
            ...VERIFIED_CAMERA_EXPANSION
        ];`;

const newInventory = `${additions}        const VERIFIED_CAMERA_INVENTORY = [
            ...EMBEDDED_CAMERA_SET,
            ...VERIFIED_CAMERA_SET_B,
            ...VERIFIED_CAMERA_EXPANSION,
            ...VERIFIED_CAMERA_ADDITIONS_20260905
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
  throw new Error(`Unable to fetch preserved Global Sky source: ${lastError}`);
}

function idsFrom(html) {
  return [...html.matchAll(/camera_id:'([^']+)'/g)].map(m => m[1]);
}

function removeRange(html, startMarker, endMarker, label) {
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) throw new Error(`Static cleanup guard failed: ${label} markers not found.`);
  return html.slice(0, start) + html.slice(end);
}

function stripLedgerAndBackend(html) {
  let out = html;

  // Remove the hidden receipt page and its CSS, but keep the visible Broadcast
  // ID icon and Global Sky Desk exactly as they are.
  out = removeRange(
    out,
    '        /* Built-in receipt view.',
    '        @media (prefers-reduced-motion: reduce)',
    'receipt CSS'
  );
  out = removeRange(
    out,
    '    <section id="receipt-view"',
    '    <div id="feed-focus-overlay"',
    'receipt HTML'
  );

  // Remove the dead receipt-button hook. The Global Sky Desk itself remains.
  const receiptHook = `                const receiptButton = document.getElementById('open-broadcast-receipt');\n                if (receiptButton) receiptButton.addEventListener('click', openCurrentReceipt);\n`;
  if (!out.includes(receiptHook)) throw new Error('Static cleanup guard failed: receipt hook missing.');
  out = out.replace(receiptHook, '');

  // Event logging becomes an intentional local no-op. Camera health/failover
  // code may still call postEvent(), but it no longer performs a network call.
  out = removeRange(
    out,
    '        async function postEvent(event) {',
    '        function startPanelModeHealthProbe',
    'event API function'
  );
  out = out.replace(
    '        function startPanelModeHealthProbe',
    '        function postEvent() {}\n\n        function startPanelModeHealthProbe'
  );

  // Remove receipt rendering/fetching and replace startup with the existing
  // detached browser-side stage only. No /api/stage/current request remains.
  out = removeRange(
    out,
    '        function renderReceipt(',
    '        async function init() {',
    'receipt functions'
  );
  out = removeRange(
    out,
    '        async function init() {',
    '        function handleViewportChange()',
    'remote startup function'
  );
  out = out.replace(
    '        function handleViewportChange()',
    `        async function init() {\n            makeStatusPanels();\n            makeFeedPanels();\n            stageData = detachedStageData();\n            mountStageData();\n            scheduleGeometry();\n        }\n\n        function handleViewportChange()`
  );

  // Remove the backend-state switch so the two-minute local rotation always
  // remains active.
  out = out.replace('        let ledgerOnline = false;\n', '');
  const rotationGate = '            if (ledgerOnline || !stageData?.session) return false;';
  if (!out.includes(rotationGate)) throw new Error('Static cleanup guard failed: rotation gate missing.');
  out = out.replace(rotationGate, '            if (!stageData?.session) return false;');

  // Remove the heartbeat logging branch; the visible signal indicator stays.
  const heartbeatStart = "                    if (ledgerOnline && stageData?.session?.broadcast_id) {";
  const heartbeatEnd = '                        });\n                    }';
  const hs = out.indexOf(heartbeatStart);
  const he = out.indexOf(heartbeatEnd, hs);
  if (hs < 0 || he < 0) throw new Error('Static cleanup guard failed: heartbeat ledger block missing.');
  out = out.slice(0, hs) + out.slice(he + heartbeatEnd.length);

  const forbidden = [
    '/api/',
    'ledgerOnline',
    'receipt-view',
    'receipt-mode',
    'renderReceipt',
    'initReceiptView',
    'open-broadcast-receipt',
    'openCurrentReceipt'
  ];
  for (const token of forbidden) {
    if (out.includes(token)) throw new Error(`Static cleanup failed: forbidden ledger/backend token remains: ${token}`);
  }

  return out;
}

const html = await sourceHtml();
if (!html.includes('<title>Global Sky Live Cameras | Coach Doll Patrols</title>')) throw new Error('Source guard failed: Global Sky title marker missing.');
if (!html.includes(oldInventory)) throw new Error('Source guard failed: expected 21-camera inventory block was not found.');

const uniqueBaseline = new Set(idsFrom(html).filter(id => id.startsWith('CAM-')));
if (uniqueBaseline.size !== 21) throw new Error(`Source guard failed: expected 21 unique baseline cameras, found ${uniqueBaseline.size}.`);

let patched = html.replace(oldInventory, newInventory);
patched = stripLedgerAndBackend(patched);

const uniqueAfter = new Set(idsFrom(patched));
const requiredIds = [
  'CAM-JP-TOKYO-STATION-20260905',
  'CAM-JP-YOKOSUKA-NAGAI-20260905',
  'CAM-JP-SHINJUKU-EAST-20260905',
  'CAM-KR-SEOUL-NAMSAN-20260905',
  'CAM-JP-HAKONE-JUKKOKU-20260905',
  'CAM-JP-FUJI-VIEW-HOTEL-20260905',
  'CAM-ID-BALI-TROPICAL-20260905'
];
for (const required of requiredIds) if (!uniqueAfter.has(required)) throw new Error(`Camera injection failed: ${required} missing.`);
if (uniqueAfter.size !== 28) throw new Error(`Camera count guard failed: expected 28 unique cameras, found ${uniqueAfter.size}.`);
if (!patched.includes('const SET_INTERVAL_MS = 2 * 60 * 1000;')) throw new Error('Rotation guard failed: 2-minute set interval missing.');
if (!patched.includes("camera_id:'CAM-FI-ROVANIEMI-CS-6452'")) throw new Error('Inventory guard failed: Rovaniemi missing.');
if (!patched.includes('GLOBAL SKY DESK')) throw new Error('Broadcast ID desk guard failed.');

await mkdir(OUT_DIR, { recursive: true });
await writeFile(new URL('global-sky.html', OUT_DIR), patched, 'utf8');
await writeFile(new URL('_redirects', OUT_DIR), '/  /global-sky.html  200\n', 'utf8');
await writeFile(new URL('build-manifest.json', OUT_DIR), JSON.stringify({
  source: SOURCE_URL,
  baseline_camera_count: 21,
  added_camera_count: 7,
  total_camera_count: 28,
  scout: false,
  functions: false,
  ledger: false,
  backend_api: false,
  broadcast_id_desk: true,
  rotation_minutes: 2,
  required_camera_ids: requiredIds
}, null, 2) + '\n', 'utf8');

console.log('Global Sky static build OK: 28 cameras; Scout and ledger/backend removed; Broadcast ID desk and 2-minute rotation preserved.');
