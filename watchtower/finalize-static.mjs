import { readFile, writeFile } from 'node:fs/promises';

const HTML_FILE = new URL('./public/global-sky.html', import.meta.url);
const SITEMAP_FILE = new URL('./public/sitemap.xml', import.meta.url);
const CANONICAL_URL = 'https://watchtower.barbph.com/';
const PREVIEW_URL = 'https://watchtower.barbph.com/global-sky-social-preview.png';
const TOKYO_ATTRIBUTION = '著作権者: (一社)大手町・丸の内・有楽町地区まちづくり協議会';

function requireReplace(text, pattern, replacement, label) {
  const next = text.replace(pattern, replacement);
  if (next === text) throw new Error(`Finalizer guard failed: ${label} was not found.`);
  return next;
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

// Remove the old browser-generated canonical/OG URL script. Social crawlers need
// these values in the server-delivered HTML and may not execute JavaScript.
html = html.replace(/\n\s*<script>\s*\/\* Canonical and og:url resolve to the final deployed URL automatically,[\s\S]*?<\/script>\s*/m, '\n');
html = html.replace(/\s*<link rel="canonical"[^>]*>\s*/g, '\n');
html = html.replace(/\s*<meta property="og:url"[^>]*>\s*/g, '\n');

const applicationName = '    <meta name="application-name" content="Coach Doll Patrols Global Sky">';
html = requireReplace(
  html,
  applicationName,
  `${applicationName}\n    <link rel="canonical" href="${CANONICAL_URL}">\n    <meta property="og:url" content="${CANONICAL_URL}">`,
  'application-name metadata anchor'
);

html = requireReplace(html, /<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${PREVIEW_URL}">`, 'og:image');
html = requireReplace(html, /<meta name="twitter:image" content="[^"]*">/, `<meta name="twitter:image" content="${PREVIEW_URL}">`, 'twitter:image');
html = requireReplace(html, /<meta property="og:image:width" content="[^"]*">/, '<meta property="og:image:width" content="1447">', 'og:image width');
html = requireReplace(html, /<meta property="og:image:height" content="[^"]*">/, '<meta property="og:image:height" content="702">', 'og:image height');

for (const required of [
  `<link rel="canonical" href="${CANONICAL_URL}">`,
  `<meta property="og:url" content="${CANONICAL_URL}">`,
  `<meta property="og:image" content="${PREVIEW_URL}">`,
  `<meta name="twitter:image" content="${PREVIEW_URL}">`,
  TOKYO_ATTRIBUTION,
  'feed-attribution',
  'feed-focus-attribution'
]) {
  if (!html.includes(required)) throw new Error(`Finalizer contract failed: ${required} missing.`);
}

if (html.includes('location.origin + location.pathname') || html.includes('absolutePreview = location.origin')) {
  throw new Error('Finalizer contract failed: dynamic social/canonical metadata code remains.');
}

await writeFile(HTML_FILE, html, 'utf8');
await writeFile(
  SITEMAP_FILE,
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://watchtower.barbph.com/</loc></url>\n</urlset>\n',
  'utf8'
);

console.log('Watch Tower finalizer OK: exact Tokyo attribution visible on-panel and in focus view; canonical/social metadata static; sitemap canonical-only.');
