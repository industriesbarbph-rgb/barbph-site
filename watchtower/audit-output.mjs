import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('./public/global-sky.html', import.meta.url), 'utf8');

// Structural HTML sanity checks around the areas our build mutates.
for (const [openPattern, closePattern, label] of [
  [/<script\b/gi, /<\/script>/gi, 'script'],
  [/<style\b/gi, /<\/style>/gi, 'style']
]) {
  const opens = html.match(openPattern)?.length || 0;
  const closes = html.match(closePattern)?.length || 0;
  if (opens !== closes) throw new Error(`Generated HTML has unbalanced ${label} tags: ${opens} open / ${closes} close.`);
}

// Parse every executable inline script. JSON-LD is data, not JavaScript.
let executableScripts = 0;
const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
for (const match of html.matchAll(scriptRegex)) {
  const attrs = match[1] || '';
  const code = match[2] || '';
  if (/\bsrc\s*=/i.test(attrs)) continue;
  if (/type\s*=\s*["']application\/ld\+json["']/i.test(attrs)) continue;
  if (/type\s*=\s*["']module["']/i.test(attrs)) {
    throw new Error('Unexpected inline module script found; audit parser requires explicit handling.');
  }
  try {
    new Function(code);
  } catch (error) {
    throw new Error(`Generated inline JavaScript does not parse: ${error.message}`);
  }
  executableScripts += 1;
}
if (executableScripts < 1) throw new Error('Generated page has no executable inline JavaScript.');

// The 28-camera inventory must reference every member of each seven-camera
// source family exactly once. This proves the four 7-camera rotation blocks do
// not silently duplicate one camera while omitting another.
const inventoryStart = html.indexOf('        const VERIFIED_CAMERA_INVENTORY = [');
if (inventoryStart < 0) throw new Error('Generated camera inventory marker missing.');
const inventoryEnd = html.indexOf('\n        ];', inventoryStart);
if (inventoryEnd < 0) throw new Error('Generated camera inventory end missing.');
const inventoryText = html.slice(inventoryStart, inventoryEnd);
const refs = [...inventoryText.matchAll(/\b(EMBEDDED_CAMERA_SET|VERIFIED_CAMERA_SET_B|VERIFIED_CAMERA_EXPANSION|VERIFIED_CAMERA_ADDITIONS_20260905)\[(\d+)\]/g)]
  .map(match => `${match[1]}[${match[2]}]`);
if (refs.length !== 28) throw new Error(`Expected 28 camera references in rotation inventory, found ${refs.length}.`);
const uniqueRefs = new Set(refs);
if (uniqueRefs.size !== 28) throw new Error(`Rotation inventory contains duplicate references: ${refs.filter((ref, i) => refs.indexOf(ref) !== i).join(', ')}`);
for (const family of ['EMBEDDED_CAMERA_SET', 'VERIFIED_CAMERA_SET_B', 'VERIFIED_CAMERA_EXPANSION', 'VERIFIED_CAMERA_ADDITIONS_20260905']) {
  for (let i = 0; i < 7; i++) {
    const ref = `${family}[${i}]`;
    if (!uniqueRefs.has(ref)) throw new Error(`Rotation inventory omitted ${ref}.`);
  }
}

// With 28 cameras and a seven-slot step, the browser-side algorithm must form
// exactly four non-overlapping sets before repeating.
if (!html.includes('const SET_INTERVAL_MS = 2 * 60 * 1000;')) throw new Error('2-minute rotation constant missing.');
if (!html.includes('const start = (setIndex * FEED_SLOT_COUNT) % inventory.length;')) throw new Error('Seven-position rotation stepping logic changed unexpectedly.');
if (!html.includes('chosen.push(inventory[(start + i) % inventory.length]);')) throw new Error('Circular seven-camera selection logic changed unexpectedly.');

console.log(`Generated HTML audit OK: ${executableScripts} inline script(s) parse; HTML script/style tags balanced; 28/28 rotation references unique; four 7-camera sets preserved.`);
