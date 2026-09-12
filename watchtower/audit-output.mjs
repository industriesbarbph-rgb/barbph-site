import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('./public/global-sky.html', import.meta.url), 'utf8');
const manifest = JSON.parse(await readFile(new URL('./public/build-manifest.json', import.meta.url), 'utf8'));
const CANONICAL_URL = 'https://watchtower.barbph.com/';
const PREVIEW_URL = 'https://watchtower.barbph.com/global-sky-social-preview.png';
const BARBPH_URL = 'https://barbph.com/';
const TAIPEI_CAMERA_ID = 'CAM-TW-TAIPEI-XIANGSHAN-20260906';
const DOC_URL = 'https://docs.google.com/document/d/1jCrlDZmfVWZoHqZJp0FlfNfsLy70Kw5ChutEjR7N-vI/edit?usp=sharing';
const SEPT12_IDS = [
  'CAM-NZ-AUCKLAND-VIADUCT-20260912',
  'CAM-NZ-OHAKUNE-RUAPEHU-20260912',
  'CAM-AU-SYDNEY-HARBOUR-20260912',
  'CAM-NZ-TAIAROA-ALBATROSS-20260912',
  'CAM-JP-TOKYO-KABUKICHO-20260912',
  'CAM-JP-SAPPORO-TANUKIKOJI-20260912',
  'CAM-JP-TOKYO-SHINONOME2-20260912',
  'CAM-TW-TAICHUNG-TECHI-DAM-20260912',
  'CAM-JP-YAMANAKAKO-FUJI-20260912',
  'CAM-US-HI-MAUI-KAANAPALI-20260912',
  'CAM-TW-CHIAYI-FENQIHU-20260912',
  'CAM-JP-TOKYO-DOME-CITY-20260912',
  'CAM-TW-TAICHUNG-GAOMEI-20260912',
  'CAM-TH-KOH-SAMUI-GREEN-MANGO-20260912',
  'CAM-TH-KOH-PHANGAN-SANSKARA-20260912',
  'CAM-TW-YUNLIN-BEIGANG-20260912',
  'CAM-JP-HOKKAIDO-TOKACHI-20260912',
  'CAM-JP-TOKYO-RYOGOKU-20260912',
  'CAM-TW-HUALIEN-LIYU-LAKE-20260912',
  'CAM-TW-HUALIEN-CHANGHONG-20260912',
  'CAM-TW-TAITUNG-SANXIANTAI-20260912'
];

for (const [openPattern, closePattern, label] of [
  [/<script\b/gi, /<\/script>/gi, 'script'],
  [/<style\b/gi, /<\/style>/gi, 'style']
]) {
  const opens = html.match(openPattern)?.length || 0;
  const closes = html.match(closePattern)?.length || 0;
  if (opens !== closes) throw new Error(`Generated HTML has unbalanced ${label} tags: ${opens} open / ${closes} close.`);
}

const jsonLdMatches = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
if (jsonLdMatches.length !== 1) throw new Error(`Expected exactly one JSON-LD block, found ${jsonLdMatches.length}.`);
let schema;
try { schema = JSON.parse(jsonLdMatches[0][1]); }
catch (error) { throw new Error(`Generated JSON-LD does not parse: ${error.message}`); }
if (schema['@context'] !== 'https://schema.org' || schema['@type'] !== 'WebPage') throw new Error('Generated JSON-LD is not the expected Schema.org WebPage.');
if (schema.url !== CANONICAL_URL) throw new Error(`JSON-LD canonical URL mismatch: ${schema.url}`);
if (schema.image !== PREVIEW_URL) throw new Error(`JSON-LD image mismatch: ${schema.image}`);
if (schema.primaryImageOfPage?.url !== PREVIEW_URL || schema.primaryImageOfPage?.width !== 1447 || schema.primaryImageOfPage?.height !== 702) throw new Error('JSON-LD primaryImageOfPage contract failed.');
if (schema.isPartOf?.['@type'] !== 'WebSite' || schema.isPartOf?.name !== 'BarbPH' || schema.isPartOf?.url !== BARBPH_URL) throw new Error('JSON-LD BarbPH isPartOf relationship missing or incorrect.');
if (schema.publisher?.['@type'] !== 'Organization' || schema.publisher?.name !== 'Coach Doll Patrols' || schema.publisher?.url !== BARBPH_URL) throw new Error('JSON-LD publisher relationship missing or incorrect.');

let executableScripts = 0;
for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
  const attrs = match[1] || '';
  const code = match[2] || '';
  if (/\bsrc\s*=/i.test(attrs)) continue;
  if (/type\s*=\s*["']application\/ld\+json["']/i.test(attrs)) continue;
  if (/type\s*=\s*["']module["']/i.test(attrs)) throw new Error('Unexpected inline module script found; audit parser requires explicit handling.');
  try { new Function(code); }
  catch (error) { throw new Error(`Generated inline JavaScript does not parse: ${error.message}`); }
  executableScripts += 1;
}
if (executableScripts < 1) throw new Error('Generated page has no executable inline JavaScript.');

const cameraIds = [...html.matchAll(/camera_id:'([^']+)'/g)].map(m => m[1]).filter(id => id.startsWith('CAM-'));
const uniqueCameraIds = new Set(cameraIds);
if (uniqueCameraIds.size !== 50) throw new Error(`Expected 50 unique camera IDs, found ${uniqueCameraIds.size}.`);
if (cameraIds.length !== uniqueCameraIds.size) throw new Error('Duplicate camera IDs are present in generated HTML.');
for (const id of SEPT12_IDS) if (!uniqueCameraIds.has(id)) throw new Error(`September 12 camera missing: ${id}`);
if (!uniqueCameraIds.has(TAIPEI_CAMERA_ID)) throw new Error('Taipei Xiangshan camera record missing.');
if (html.includes("camera_id:'CAM-ID-SEMERU-A-20260912'")) throw new Error('Semeru Cam A was supposed to remain on HOLD at deployment gate.');

const inventoryStart = html.indexOf('        const VERIFIED_CAMERA_INVENTORY = [');
if (inventoryStart < 0) throw new Error('Generated camera inventory marker missing.');
const inventoryEnd = html.indexOf('\n        ];', inventoryStart);
if (inventoryEnd < 0) throw new Error('Generated camera inventory end missing.');
const inventoryText = html.slice(inventoryStart, inventoryEnd);
const refs = [...inventoryText.matchAll(/\b(EMBEDDED_CAMERA_SET|VERIFIED_CAMERA_SET_B|VERIFIED_CAMERA_EXPANSION|VERIFIED_CAMERA_ADDITIONS_20260905|VERIFIED_CAMERA_ADDITIONS_20260906|VERIFIED_CAMERA_ADDITIONS_20260912)\[(\d+)\]/g)]
  .map(match => `${match[1]}[${match[2]}]`);
if (refs.length !== 50) throw new Error(`Expected 50 camera references in rotation inventory, found ${refs.length}.`);
if (new Set(refs).size !== 50) throw new Error(`Rotation inventory contains duplicate references: ${refs.filter((ref, i) => refs.indexOf(ref) !== i).join(', ')}`);
for (const family of ['EMBEDDED_CAMERA_SET', 'VERIFIED_CAMERA_SET_B', 'VERIFIED_CAMERA_EXPANSION', 'VERIFIED_CAMERA_ADDITIONS_20260905']) {
  for (let i = 0; i < 7; i++) if (!refs.includes(`${family}[${i}]`)) throw new Error(`Rotation inventory omitted ${family}[${i}].`);
}
if (!refs.includes('VERIFIED_CAMERA_ADDITIONS_20260906[0]')) throw new Error('Rotation inventory omitted Taipei Xiangshan.');
for (let i = 0; i < 21; i++) if (!refs.includes(`VERIFIED_CAMERA_ADDITIONS_20260912[${i}]`)) throw new Error(`Rotation inventory omitted September 12 addition ${i}.`);

if (!html.includes('const SET_INTERVAL_MS = 2 * 60 * 1000;')) throw new Error('2-minute rotation constant missing.');
if (!html.includes('const start = (setIndex * FEED_SLOT_COUNT) % inventory.length;')) throw new Error('Seven-position rotation stepping logic changed unexpectedly.');
if (!html.includes('chosen.push(inventory[(start + i) % inventory.length]);')) throw new Error('Circular seven-camera selection logic changed unexpectedly.');

for (const required of [
  'id="behind-cameras-note-style"',
  'id="behind-cameras-note-loader"',
  'BEHIND THE CAMERAS',
  'OPEN THE ONGOING RECORD',
  DOC_URL,
  "note.target = '_blank'",
  "note.rel = 'noopener noreferrer'"
]) if (!html.includes(required)) throw new Error(`Behind the Cameras contract failed: ${required} missing.`);

if (manifest.total_camera_count !== 50) throw new Error(`Build manifest expected 50 cameras, found ${manifest.total_camera_count}.`);
if (manifest.release_camera_additions_20260912 !== 21) throw new Error('Build manifest September 12 addition count must be 21.');
if (manifest.behind_cameras_note !== true || manifest.behind_cameras_document !== DOC_URL) throw new Error('Build manifest Behind the Cameras contract failed.');

console.log(`Generated HTML audit OK: ${uniqueCameraIds.size}/50 camera IDs unique; 50/50 rotation references unique; 21 September 12 additions present; Semeru Cam A held; Behind the Cameras note opens the living document in a new tab; seven-slot two-minute rotation preserved.`);