import { mkdir, readFile, writeFile } from 'node:fs/promises';

const SOURCE_URL = 'https://6a92f93b90ee21cdc0f68168--thriving-pie-e168bd.netlify.app/global-sky.html';
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
            ...EMEDDED_CAMERA_SET,
            ...VERIFIED_CAMERA_SET_B,
            ...VERIFIED_CAMERA_EXPANSION,
            ...VERIFIED_CAMERA_ADDITIONS_20260905
        ];`.replace('...EMEDDED_CAMERA_SET', '...EMBEDDED_CAMERA_SET');

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
  throw new Error(`Unable to fetch immutable Global Sky source: ${lastError}`);
}

function idsFrom(html) {
  return [...html.matchAll(/camera_id:'([^']+)'/g)].map(m => m[1]);
}

const html = await sourceHtml();
if (!html.includes('<title>Global Sky Live Cameras | Coach Doll Patrols</title>')) throw new Error('Source guard failed: Global Sky title marker missing.');
if (!html.includes(oldInventory)) throw new Error('Source guard failed: expected 21-camera inventory block was not found.');

const uniqueBaseline = new Set(idsFrom(html).filter(id => id.startsWith('CAM-')));
if (uniqueBaseline.size !== 21) throw new Error(`Source guard failed: expected 21 unique baseline cameras, found ${uniqueBaseline.size}.`);

const patched = html.replace(oldInventory, newInventory);
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

await mkdir(OUT_DIR, { recursive: true });
await writeFile(new URL('global-sky.html', OUT_DIR), patched, 'utf8');
await writeFile(new URL('_redirects', OUT_DIR), '/  /global-sky.html  200\n', 'utf8');
await writeFile(new URL('build-manifest.json', OUT_DIR), JSON.stringify({
  source: SOURCE_URL,
  baseline_camera_count: 21,
  added_camera_count: 7,
  total_camera_count: 28,
  scout: false,
  required_camera_ids: requiredIds
}, null, 2) + '\n', 'utf8');

console.log('Global Sky static build OK: 21 existing + 7 approved = 28 cameras; Scout disabled.');
