import fs from 'node:fs';

const file = 'dist/index.html';
if (!fs.existsSync(file)) throw new Error('dist/index.html was not generated.');

let html = fs.readFileSync(file, 'utf8');
const legacyJsonLd = /<script\b(?=[^>]*type=["']application\/ld\+json["'])(?![^>]*\bid=)[^>]*>[\s\S]*?<\/script>/i;
html = html.replace(legacyJsonLd, '');

const schemaCount = (html.match(/type=["']application\/ld\+json["']/gi) || []).length;
if (schemaCount !== 1 || !html.includes('id="barbph-structured-data"')) {
  throw new Error(`Homepage structured-data cleanup failed. Found ${schemaCount} JSON-LD blocks.`);
}

fs.writeFileSync(file, html);
console.log('Homepage structured data deduplicated.');
