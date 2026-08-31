import fs from 'node:fs';
import path from 'node:path';

const HOME = 'dist/index.html';
const FUNCTIONS_DIR = 'dist-functions';
const OLD_SHEET_ID = '1TSpt_DxEDhpsXE09lNx8S63b7cDomEXhVua--p99DGM';
const PUBLIC_SHEET_ID = '1NA3jrA3gdctbpfhXtz2TAiRGRFWsyWRTT6EvoJNIfUw';
const OLD_THEME_GID = '342757810';
const PUBLIC_THEME_GID = '2000682467';

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (entry.isFile()) out.push(p);
  }
  return out;
}

if (!fs.existsSync(HOME)) throw new Error('dist/index.html was not generated.');

let html = fs.readFileSync(HOME, 'utf8');
const legacyJsonLd = /<script\b(?=[^>]*type=["']application\/ld\+json["'])(?![^>]*\bid=)[^>]*>[\s\S]*?<\/script>/i;
html = html.replace(legacyJsonLd, '');

const schemaCount = (html.match(/type=["']application\/ld\+json["']/gi) || []).length;
if (schemaCount !== 1 || !html.includes('id="barbph-structured-data"')) {
  throw new Error(`Homepage structured-data cleanup failed. Found ${schemaCount} JSON-LD blocks.`);
}
fs.writeFileSync(HOME, html);

for (const file of walk(FUNCTIONS_DIR).filter(f => /\.(?:mjs|js|cjs|json)$/i.test(f))) {
  let text = fs.readFileSync(file, 'utf8');
  text = text.replaceAll(OLD_SHEET_ID, PUBLIC_SHEET_ID);
  text = text.replaceAll(`gid=${OLD_THEME_GID}`, `gid=${PUBLIC_THEME_GID}`);
  fs.writeFileSync(file, text);
}

const remainingOldSheetRefs = walk(FUNCTIONS_DIR).filter(file => {
  if (!/\.(?:mjs|js|cjs|json)$/i.test(file)) return false;
  return fs.readFileSync(file, 'utf8').includes(OLD_SHEET_ID);
});
if (remainingOldSheetRefs.length) {
  throw new Error(`Old admin sheet ID survived in deployed functions:\n${remainingOldSheetRefs.join('\n')}`);
}

for (const rel of ['post-build-fix.js', 'build-site.js', 'build-catalog.js', 'netlify.toml', 'package.json', 'package-lock.json']) {
  fs.rmSync(path.join('dist', rel), { force: true });
}

const publicFiles = walk('dist');
const leaks = publicFiles.filter(file => {
  const rel = path.relative('dist', file).replaceAll('\\', '/');
  return /(^|\/)(?:overnight-work-log)(\/|$)/i.test(rel)
    || /\.(?:md|txt|ya?ml)$/i.test(rel)
    || /(?:^|[-_.])(test|prototype|diagnostic)(?:[-_.]|$)/i.test(path.basename(rel))
    || /^(?:partnerships|overnight-work-ruler|systems)\.html$/i.test(path.basename(rel));
});
if (leaks.length) throw new Error(`Internal files survived final public-surface check:\n${leaks.join('\n')}`);

console.log(`Final BarbPH post-build guard passed. ${publicFiles.length} public files.`);