import { readFile, writeFile } from 'node:fs/promises';

const HTML_FILE = new URL('./public/global-sky.html', import.meta.url);
const SITEMAP_FILE = new URL('./public/sitemap.xml', import.meta.url);
const ROBOTS_FILE = new URL('./public/robots.txt', import.meta.url);
const CANONICAL_URL = 'https://watchtower.barbph.com/';
const PREVIEW_URL = 'https://watchtower.barbph.com/global-sky-social-preview.png';
const BARBPH_URL = 'https://barbph.com/';
const TOKYO_ATTRIBUTION = '著作権者: (一社)大手町・丸の内・有楽町地区まちづくり協議会';

function requireReplace(text, pattern, replacement, label) {
  const next = text.replace(pattern, replacement);
  if (next === text) throw new Error(`Finalizer guard failed: ${label} was not found.`);
  return next;
}

function matchReplace(text, pattern, replacement, label) {
  if (!pattern.test(text)) throw new Error(`Finalizer guard failed: ${label} was not found.`);
  return text.replace(pattern, replacement);
}

let html = await readFile(HTML_FILE, 'utf8');

// Use the camera owner's exact copyright-holder wording, rather than a translation.
html = html.replaceAll('© Otemachi–Marunouchi–Yurakucho District Council', TOKYO_ATTRIBUTION);
if (!html.includes(`attribution:'${TOKYO_ATTRIBUTION}'`)) {
  throw new Error('Finalizer guard failed: exact Tokyo Station copyright-holder wording is missing.');
}

// Make the required attribution visible even before the user enlarges the camera.
if (!html.includes('feed-attribution')) {
  const labelNeedle = '            label.innerHTML = `<span class="place">${cityText}</span><span class="country">${countryText}</span><span class="state" id="feed-state-${item.slot}"></span>`;';
  html = requireReplace(
    html,
    labelNeedle,
    `${labelNeedle}\n\n            const feedAttribution = document.createElement('div');\n            feedAttribution.className = 'feed-attribution';\n            feedAttribution.textContent = String(cam.attribution || '');\n            if (!feedAttribution.textContent) feedAttribution.hidden = true;`,
    'feed label creation'
  );

  const appendRegex = /^(\s*)panel\.appendChild\(label\);$/gm;
  const appendMatches = [...html.matchAll(appendRegex)];
  if (appendMatches.length !== 2) throw new Error(`Finalizer guard failed: expected 2 feed-label append points, found ${appendMatches.length}.`);
  html = html.replace(appendRegex, (_match, indent) => `${indent}panel.appendChild(label);\n${indent}panel.appendChild(feedAttribution);`);

  const cssAnchor = '        .feed-fallback {';
  const attributionCss = `        .feed-attribution {\n            position: absolute;\n            top: 4px;\n            left: 4px;\n            right: 4px;\n            z-index: 3;\n            padding: 2px 4px;\n            border-radius: 4px;\n            background: rgba(0,0,0,.46);\n            color: rgba(255,255,255,.94);\n            font: 500 clamp(4.8px, .38vw, 7px)/1.15 'Oswald', sans-serif;\n            letter-spacing: .01em;\n            text-align: left;\n            white-space: normal;\n            pointer-events: none;\n            text-shadow: 0 1px 3px rgba(0,0,0,.96);\n        }\n        .feed-attribution[hidden] { display: none !important; }\n        @media (max-width: 760px) {\n            .feed-attribution {\n                top: 2px;\n                left: 2px;\n                right: 2px;\n                padding: 1px 2px;\n                font-size: 3.7px;\n            }\n        }\n\n`;
  html = requireReplace(html, cssAnchor, attributionCss + cssAnchor, 'feed attribution CSS anchor');
}

// Restore full location strings and give narrow feed labels a wrap-safe hook.
const mobileLabelNeedle = '            label.innerHTML = `<span class="place">${cityText}</span><span class="country">${countryText}</span><span class="state" id="feed-state-${item.slot}"></span>`;';
if (!html.includes("label.classList.add('global-sky-feed-label')")) {
  html = requireReplace(
    html,
    mobileLabelNeedle,
    `${mobileLabelNeedle}
            label.classList.add('global-sky-feed-label');
            const fullPlace = label.querySelector('.place');
            const fullCountry = label.querySelector('.country');
            if (fullPlace) fullPlace.textContent = String(cam.city || cityText || '');
            if (fullCountry) fullCountry.textContent = String(cam.country || countryText || '');`,
    'full mobile feed label hook'
  );
}

// Keep narrow mobile feed captions readable without changing the feed-band geometry.
const GLOBAL_SKY_FEED_TEXT_STYLE = `
<style id="global-sky-feed-text-fix">
  .global-sky-feed-label {
    height: auto !important;
    min-height: 0 !important;
    max-width: calc(100% - 4px) !important;
    overflow: visible !important;
    text-overflow: clip !important;
    white-space: normal !important;
  }
  .global-sky-feed-label .place,
  .global-sky-feed-label .country {
    display: block !important;
    max-width: 100% !important;
    overflow: visible !important;
    text-overflow: clip !important;
    white-space: normal !important;
    overflow-wrap: anywhere !important;
    word-break: normal !important;
  }
  .feed-attribution {
    max-height: none !important;
    overflow: visible !important;
    text-overflow: clip !important;
    white-space: normal !important;
    overflow-wrap: anywhere !important;
    word-break: break-word !important;
  }
  @media (max-width: 760px) {
    .global-sky-feed-label {
      padding-top: 2px !important;
      padding-bottom: 2px !important;
      line-height: 1.05 !important;
    }
    .global-sky-feed-label .place {
      font-size: clamp(4.5px, 1.55vw, 7px) !important;
      line-height: 1.05 !important;
    }
    .global-sky-feed-label .country {
      font-size: clamp(3.8px, 1.25vw, 5.8px) !important;
      line-height: 1.05 !important;
    }
    .feed-attribution {
      font-size: 3.45px !important;
      line-height: 1.12 !important;
    }
  }
</style>`;

html = html.replace(/\s*<style id="global-sky-feed-text-fix">[\s\S]*?<\/style>\s*/g, '\n');
if (!html.includes('</head>')) throw new Error('Finalizer guard failed: </head> missing for mobile feed text style.');
html = html.replace('</head>', `${GLOBAL_SKY_FEED_TEXT_STYLE}\n</head>`);

// Remove every copy of the old browser-generated canonical/OG URL script.
// Production has gone through several packaging layers, so this deliberately
// tolerates duplicate copies while still requiring clean server-delivered HTML.
const dynamicMarker = '/* Canonical and og:url resolve to the final deployed URL automatically,';
let removedDynamicScripts = 0;
while (html.includes(dynamicMarker)) {
  const markerIndex = html.indexOf(dynamicMarker);
  const scriptStart = html.lastIndexOf('<script>', markerIndex);
  const scriptEnd = html.indexOf('</script>', markerIndex);
  if (scriptStart < 0 || scriptEnd < 0 || scriptEnd < scriptStart) {
    throw new Error('Finalizer guard failed: dynamic canonical/social script boundaries were not found.');
  }
  html = html.slice(0, scriptStart) + html.slice(scriptEnd + '</script>'.length);
  removedDynamicScripts += 1;
}

// If a packaging variant lost the identifying comment but retained the exact
// old metadata body, remove that script too. Do not touch unrelated location code.
for (const legacyToken of ['location.origin + location.pathname', 'absolutePreview = location.origin']) {
  while (html.includes(legacyToken)) {
    const tokenIndex = html.indexOf(legacyToken);
    const scriptStart = html.lastIndexOf('<script>', tokenIndex);
    const scriptEnd = html.indexOf('</script>', tokenIndex);
    const scriptText = scriptStart >= 0 && scriptEnd >= 0 ? html.slice(scriptStart, scriptEnd + '</script>'.length) : '';
    const isLegacyMetadataScript = scriptText.includes('canonical') && scriptText.includes('og:url') && scriptText.includes('global-sky-social-preview.png');
    if (!isLegacyMetadataScript) {
      const context = html.slice(Math.max(0, tokenIndex - 120), Math.min(html.length, tokenIndex + 220)).replace(/\s+/g, ' ');
      throw new Error(`Finalizer guard failed: legacy metadata token remains outside the known metadata script: ${legacyToken}; context=${context}`);
    }
    html = html.slice(0, scriptStart) + html.slice(scriptEnd + '</script>'.length);
    removedDynamicScripts += 1;
  }
}

html = html.replace(/\s*<link rel="canonical"[^>]*>\s*/g, '\n');
html = html.replace(/\s*<meta property="og:url"[^>]*>\s*/g, '\n');

const applicationName = '    <meta name="application-name" content="Coach Doll Patrols Global Sky">';
html = requireReplace(
  html,
  applicationName,
  `${applicationName}\n    <link rel="canonical" href="${CANONICAL_URL}">\n    <meta property="og:url" content="${CANONICAL_URL}">`,
  'application-name metadata anchor'
);

const SEO_TITLE = 'Live Cameras & Webcams Around the World | Global Sky';
const SEO_DESCRIPTION = 'Watch real-time live cameras and webcams around the world with Global Sky, rotating through city, street, beach, scenic, wildlife and weather views every two minutes.';

html = matchReplace(html, /<title>[^<]*<\/title>/, `<title>${SEO_TITLE}</title>`, 'document title');
html = matchReplace(html, /<meta name="description" content="[^"]*">/, `<meta name="description" content="${SEO_DESCRIPTION}">`, 'meta description');
html = matchReplace(html, /<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${SEO_TITLE}">`, 'og:title');
html = matchReplace(html, /<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${SEO_DESCRIPTION}">`, 'og:description');
html = matchReplace(html, /<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${SEO_TITLE}">`, 'twitter:title');
html = matchReplace(html, /<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${SEO_DESCRIPTION}">`, 'twitter:description');

html = html.replace(
  '<h1>Global Sky Live Cameras by Coach Doll Patrols</h1>',
  '<h1>Live Cameras &amp; Webcams Around the World — Global Sky</h1>'
);
html = html.replace(
  '<p>Global Sky is a live worldwide camera experience that rotates through real-time views from locations around the world every two minutes.</p>',
  '<p>Global Sky by Coach Doll Patrols is a real-time live camera and webcam experience with city, street, beach, scenic, wildlife and weather views from locations around the world, rotating every two minutes.</p>'
);

html = matchReplace(html, /<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${PREVIEW_URL}">`, 'og:image');
html = matchReplace(html, /<meta name="twitter:image" content="[^"]*">/, `<meta name="twitter:image" content="${PREVIEW_URL}">`, 'twitter:image');
html = matchReplace(html, /<meta property="og:image:width" content="[^"]*">/, '<meta property="og:image:width" content="1447">', 'og:image width');
html = matchReplace(html, /<meta property="og:image:height" content="[^"]*">/, '<meta property="og:image:height" content="702">', 'og:image height');

// Enrich the existing WebPage JSON-LD without changing the visible Watch Tower.
const jsonLdRegex = /<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/i;
const jsonLdMatch = html.match(jsonLdRegex);
if (!jsonLdMatch) throw new Error('Finalizer guard failed: WebPage JSON-LD block missing.');
let schema;
try {
  schema = JSON.parse(jsonLdMatch[1]);
} catch (error) {
  throw new Error(`Finalizer guard failed: JSON-LD does not parse: ${error.message}`);
}
if (schema['@type'] !== 'WebPage') throw new Error(`Finalizer guard failed: expected WebPage JSON-LD, found ${schema['@type'] || 'none'}.`);
schema.name = SEO_TITLE;
schema.description = SEO_DESCRIPTION;
schema.keywords = [
  'live cameras around the world',
  'worldwide live cameras',
  'live webcams',
  'live webcam feeds',
  'real-time live cameras',
  'live city cameras',
  'live street cameras',
  'live scenic cameras',
  'live beach cameras',
  'live wildlife cameras',
  'live weather cameras'
];
schema.about = [
  { '@type': 'Thing', name: 'Live cameras and webcams around the world' },
  { '@type': 'Thing', name: 'Real-time city, street, beach, scenic, wildlife and weather views' }
];
schema.url = CANONICAL_URL;
schema.image = PREVIEW_URL;
schema.primaryImageOfPage = {
  '@type': 'ImageObject',
  url: PREVIEW_URL,
  width: 1447,
  height: 702
};
schema.isPartOf = {
  '@type': 'WebSite',
  name: 'BarbPH',
  url: BARBPH_URL
};
if (!schema.publisher || typeof schema.publisher !== 'object') {
  schema.publisher = { '@type': 'Organization', name: 'Coach Doll Patrols' };
}
schema.publisher.url = BARBPH_URL;
const serializedSchema = JSON.stringify(schema, null, 2);
html = html.replace(jsonLdRegex, `<script type="application/ld+json">\n${serializedSchema}\n    </script>`);

for (const required of [
  `<link rel="canonical" href="${CANONICAL_URL}">`,
  `<meta property="og:url" content="${CANONICAL_URL}">`,
  `<meta property="og:image" content="${PREVIEW_URL}">`,
  `<meta name="twitter:image" content="${PREVIEW_URL}">`,
  `"url": "${CANONICAL_URL}"`,
  `"image": "${PREVIEW_URL}"`,
  '"isPartOf": {',
  '"name": "BarbPH"',
  TOKYO_ATTRIBUTION,
  'feed-attribution',
  'feed-focus-attribution'
]) {
  if (!html.includes(required)) throw new Error(`Finalizer contract failed: ${required} missing.`);
}

for (const forbidden of [dynamicMarker, 'location.origin + location.pathname', 'absolutePreview = location.origin']) {
  if (html.includes(forbidden)) throw new Error(`Finalizer contract failed: dynamic social/canonical metadata code remains: ${forbidden}`);
}

await writeFile(HTML_FILE, html, 'utf8');
await writeFile(
  SITEMAP_FILE,
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://watchtower.barbph.com/</loc></url>\n</urlset>\n',
  'utf8'
);
await writeFile(
  ROBOTS_FILE,
  'User-agent: *\nAllow: /\n\nSitemap: https://watchtower.barbph.com/sitemap.xml\n',
  'utf8'
);

console.log(`Watch Tower finalizer OK: exact Tokyo attribution visible on-panel and in focus view; static canonical/social metadata; search-focused title/description; enriched WebPage JSON-LD; canonical sitemap + robots.txt; removed ${removedDynamicScripts} legacy metadata script(s).`);
