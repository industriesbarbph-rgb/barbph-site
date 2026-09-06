import { writeFile } from 'node:fs/promises';

const SOURCE_URL = 'https://watchtower.barbph.com/global-sky.html';
const OUT_FILE = new URL('./.global-sky-source.html', import.meta.url);
const CAMERA_ID = 'CAM-TW-TAIPEI-XIANGSHAN-20260906';
const additionStart = '        const VERIFIED_CAMERA_ADDITIONS_20260906 = [';
const inventoryMarker = '        const VERIFIED_CAMERA_INVENTORY = [\n';
const taipeiRef = '            VERIFIED_CAMERA_ADDITIONS_20260906[0],\n';

const response = await fetch(SOURCE_URL, { redirect: 'follow' });
if (!response.ok) throw new Error(`Unable to fetch current Global Sky source: HTTP ${response.status}`);
let html = await response.text();

// build-static.mjs owns the preserved 28-camera base. If the live source already
// contains our Taipei overlay, temporarily remove only that overlay so the base
// builder remains deterministic; inject-taipei.mjs adds it back afterward.
if (html.includes(`camera_id:'${CAMERA_ID}'`)) {
  const start = html.indexOf(additionStart);
  const inventory = html.indexOf(inventoryMarker, start);
  if (start < 0 || inventory < 0) throw new Error('Taipei source normalization failed: overlay boundaries missing.');
  html = html.slice(0, start) + html.slice(inventory);
  html = html.replace(inventoryMarker + taipeiRef, inventoryMarker);
  if (html.includes(`camera_id:'${CAMERA_ID}'`) || html.includes('VERIFIED_CAMERA_ADDITIONS_20260906[0]')) {
    throw new Error('Taipei source normalization failed: overlay remnants remain.');
  }
}

await writeFile(OUT_FILE, html, 'utf8');
console.log('Watch Tower source prepared for deterministic 28-base + Taipei build.');
