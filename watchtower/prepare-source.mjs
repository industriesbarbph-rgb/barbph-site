import { writeFile } from 'node:fs/promises';

const SOURCE_URL = 'https://watchtower.barbph.com/global-sky.html';
const OUT_FILE = new URL('./.global-sky-source.html', import.meta.url);
const INVENTORY_MARKER = '        const VERIFIED_CAMERA_INVENTORY = [\n';

const overlays = [
  {
    name: '2026-09-12 camera overlay',
    cameraId: 'CAM-NZ-AUCKLAND-VIADUCT-20260912',
    additionStart: '        const VERIFIED_CAMERA_ADDITIONS_20260912 = [',
    refFamily: 'VERIFIED_CAMERA_ADDITIONS_20260912',
    refCount: 21
  },
  {
    name: 'Taipei Xiangshan overlay',
    cameraId: 'CAM-TW-TAIPEI-XIANGSHAN-20260906',
    additionStart: '        const VERIFIED_CAMERA_ADDITIONS_20260906 = [',
    refFamily: 'VERIFIED_CAMERA_ADDITIONS_20260906',
    refCount: 1
  }
];

function stripOverlay(html, overlay) {
  const hasOverlay = html.includes(`camera_id:'${overlay.cameraId}'`) || html.includes(overlay.additionStart);
  if (!hasOverlay) return html;

  const start = html.indexOf(overlay.additionStart);
  const inventory = html.indexOf(INVENTORY_MARKER, Math.max(0, start));
  if (start < 0 || inventory < 0) {
    throw new Error(`${overlay.name} source normalization failed: overlay boundaries missing.`);
  }

  html = html.slice(0, start) + html.slice(inventory);
  for (let i = 0; i < overlay.refCount; i++) {
    const line = `            ${overlay.refFamily}[${i}],\n`;
    html = html.replace(line, '');
  }

  if (html.includes(`camera_id:'${overlay.cameraId}'`) || html.includes(overlay.additionStart) || html.includes(`${overlay.refFamily}[0]`)) {
    throw new Error(`${overlay.name} source normalization failed: overlay remnants remain.`);
  }
  return html;
}

function stripTaggedBlock(html, tag, id) {
  const startToken = `<${tag} id="${id}">`;
  const start = html.indexOf(startToken);
  if (start < 0) return html;
  const endToken = `</${tag}>`;
  const end = html.indexOf(endToken, start + startToken.length);
  if (end < 0) throw new Error(`Source normalization failed: ${id} closing ${endToken} missing.`);
  return html.slice(0, start) + html.slice(end + endToken.length);
}

const response = await fetch(SOURCE_URL, { redirect: 'follow' });
if (!response.ok) throw new Error(`Unable to fetch current Global Sky source: HTTP ${response.status}`);
let html = await response.text();

// The static builder owns the preserved 28-camera base. Remove release overlays
// from the live page before rebuilding, then add them back in deterministic order.
for (const overlay of overlays) html = stripOverlay(html, overlay);
html = stripTaggedBlock(html, 'style', 'behind-cameras-note-style');
html = stripTaggedBlock(html, 'script', 'behind-cameras-note-loader');

await writeFile(OUT_FILE, html, 'utf8');
console.log('Watch Tower source prepared for deterministic 28-base + Taipei + September 12 overlay build.');