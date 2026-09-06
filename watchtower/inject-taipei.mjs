import { readFile, writeFile } from 'node:fs/promises';

const HTML_FILE = new URL('./public/global-sky.html', import.meta.url);
const CAMERA_ID = 'CAM-TW-TAIPEI-XIANGSHAN-20260906';
const inventoryMarker = '        const VERIFIED_CAMERA_INVENTORY = [\n';

let html = await readFile(HTML_FILE, 'utf8');

if (html.includes(`camera_id:'${CAMERA_ID}'`)) {
  console.log('Taipei Xiangshan camera already present; no duplicate added.');
  process.exit(0);
}

if (!html.includes(inventoryMarker)) {
  throw new Error('Taipei injection failed: camera inventory marker missing.');
}

const addition = `        const VERIFIED_CAMERA_ADDITIONS_20260906 = [
            {
                camera_id:'${CAMERA_ID}', city:'Xiangshan (Elephant Mountain) – Taipei Skyline', country:'Taiwan', provider:'Taipei City Government Department of Information and Tourism / YouTube',
                attribution:'Taipei City Government Department of Information and Tourism',
                embed_url:'https://www.youtube-nocookie.com/embed/z_fY1pj1VBw?autoplay=1&mute=1&playsinline=1&rel=0',
                source_page:'https://www.youtube.com/watch?v=z_fY1pj1VBw'
            }
        ];

`;

html = html.replace(inventoryMarker, addition + inventoryMarker + '            VERIFIED_CAMERA_ADDITIONS_20260906[0],\n');

if (!html.includes(`camera_id:'${CAMERA_ID}'`) || !html.includes('VERIFIED_CAMERA_ADDITIONS_20260906[0]')) {
  throw new Error('Taipei injection failed: camera record or inventory reference missing after patch.');
}

await writeFile(HTML_FILE, html, 'utf8');
console.log('Taipei Xiangshan camera injected into Watch Tower inventory.');
