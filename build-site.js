import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'dist');
const FUNCTIONS_OUT = path.join(ROOT, 'dist-functions');
const SOURCE_FUNCTIONS = path.join(ROOT, 'netlify', 'functions');
const PUBLIC_SHEET_ID = '1NA3jrA3gdctbpfhXtz2TAiRGRFWsyWRTT6EvoJNIfUw';
const OLD_THEME_SOURCES_GID = '342757810';
const PUBLIC_THEME_SOURCES_GID = '2000682467';

const ROOT_INTERNAL = new Set([
  '.gitignore',
  'package.json',
  'package-lock.json',
  'netlify.toml',
  'build-catalog.js',
  'build-site.js',
]);

const DIR_INTERNAL = new Set([
  '.git', '.github', '.netlify', 'netlify', 'node_modules', 'overnight-work-log',
  'dist', 'dist-functions'
]);

const INTERNAL_HTML = /(?:^|[-_.])(test|prototype|diagnostic)(?:[-_.]|$)|^partnerships\.html$|^overnight-work-ruler\.html$|^systems\.html$/i;
const INTERNAL_FUNCTIONS = new Set(['google-form-probe.mjs', 'randomizer-tantrum-lab.mjs']);

function resetDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function shouldCopy(rel) {
  const normalized = rel.replaceAll('\\', '/');
  const parts = normalized.split('/');
  if (parts.some(p => DIR_INTERNAL.has(p))) return false;
  if (parts.length === 1) {
    const base = parts[0];
    if (ROOT_INTERNAL.has(base)) return false;
    if (/\.(md|txt|ya?ml)$/i.test(base)) return false;
    if (/\.html$/i.test(base) && INTERNAL_HTML.test(base)) return false;
  }
  return true;
}

function copyPublicTree(src, dst, rel = '') {
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const nextRel = rel ? `${rel}/${entry.name}` : entry.name;
    if (!shouldCopy(nextRel)) continue;
    const from = path.join(src, entry.name);
    const to = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(to, { recursive: true });
      copyPublicTree(from, to, nextRel);
    } else if (entry.isFile()) {
      fs.mkdirSync(path.dirname(to), { recursive: true });
      fs.copyFileSync(from, to);
    }
  }
}

function retargetSheetRefs(text) {
  text = text.replace(/(\bconst\s+(?:SID|SHEET_ID)\s*=\s*["'])[A-Za-z0-9_-]+(["'])/g, `$1${PUBLIC_SHEET_ID}$2`);
  text = text.replace(/(docs\.google\.com\/spreadsheets\/d\/)[A-Za-z0-9_-]+/g, `$1${PUBLIC_SHEET_ID}`);
  text = text.replaceAll(`gid=${OLD_THEME_SOURCES_GID}`, `gid=${PUBLIC_THEME_SOURCES_GID}`);
  return text;
}

function runCatalogBuild() {
  const source = path.join(ROOT, 'build-catalog.js');
  if (!fs.existsSync(source)) return;
  const temp = path.join(ROOT, '.barbph-catalog-build.mjs');
  let code = fs.readFileSync(source, 'utf8');
  code = retargetSheetRefs(code);
  fs.writeFileSync(temp, code);
  try {
    execFileSync(process.execPath, [temp], { cwd: ROOT, stdio: 'inherit' });
  } finally {
    fs.rmSync(temp, { force: true });
  }
}

function rewriteFunctions() {
  resetDir(FUNCTIONS_OUT);
  copyRecursive(SOURCE_FUNCTIONS, FUNCTIONS_OUT);
  const files = walk(FUNCTIONS_OUT).filter(f => /\.(?:mjs|js|cjs|json)$/i.test(f));
  for (const file of files) {
    const name = path.basename(file);
    if (INTERNAL_FUNCTIONS.has(name)) { fs.rmSync(file, { force: true }); continue; }
    let text = retargetSheetRefs(fs.readFileSync(file, 'utf8'));

    if (name === 'catalog-feed.mjs' || name === 'content-feed.mjs') {
      text = text.replace(
        'function json(body,status=200){return Response.json(body,{status,headers:{"cache-control":"no-store"}})}',
        'function json(body,status=200){const ok=status===200;return Response.json(body,{status,headers:{"cache-control":ok?"public, max-age=60":"no-store","Netlify-CDN-Cache-Control":ok?"public, durable, s-maxage=3600, stale-while-revalidate=3600":"no-store"}})}'
      );
    }
    fs.writeFileSync(file, text);
  }
}

function copyRecursive(src, dst) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dst, entry.name);
    if (entry.isDirectory()) copyRecursive(from, to);
    else if (entry.isFile()) fs.copyFileSync(from, to);
  }
}

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

function escRE(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function setTitle(html, title) {
  if (/<title>[\s\S]*?<\/title>/i.test(html)) return html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`);
  return html.replace(/<\/head>/i, `<title>${title}</title>\n</head>`);
}

function setMeta(html, kind, key, content) {
  const re = new RegExp(`<meta\\b(?=[^>]*\\b${kind}=["']${escRE(key)}["'])[^>]*>`, 'i');
  const tag = `<meta ${kind}="${key}" content="${content}">`;
  return re.test(html) ? html.replace(re, tag) : html.replace(/<\/head>/i, `  ${tag}\n</head>`);
}

function setCanonical(html, href) {
  const re = /<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/i;
  const tag = `<link rel="canonical" href="${href}">`;
  return re.test(html) ? html.replace(re, tag) : html.replace(/<\/head>/i, `  ${tag}\n</head>`);
}

function insertJsonLd(html, data, id) {
  const json = JSON.stringify(data, null, 2).replace(/</g, '\\u003c');
  const tag = `<script type="application/ld+json" id="${id}">\n${json}\n</script>`;
  const re = new RegExp(`<script\\b[^>]*id=["']${escRE(id)}["'][^>]*>[\\s\\S]*?<\\/script>`, 'i');
  return re.test(html) ? html.replace(re, tag) : html.replace(/<\/head>/i, `${tag}\n</head>`);
}

function commonSeo(html, cfg) {
  html = setTitle(html, cfg.title);
  html = setMeta(html, 'name', 'description', cfg.description);
  html = setMeta(html, 'name', 'robots', 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1');
  html = setCanonical(html, cfg.canonical);
  html = setMeta(html, 'property', 'og:type', 'website');
  html = setMeta(html, 'property', 'og:site_name', 'BarbPH');
  html = setMeta(html, 'property', 'og:title', cfg.ogTitle || cfg.title);
  html = setMeta(html, 'property', 'og:description', cfg.ogDescription || cfg.description);
  html = setMeta(html, 'property', 'og:url', cfg.canonical);
  html = setMeta(html, 'property', 'og:image', 'https://barbph.com/3stars1sun%20%283%29.png');
  html = setMeta(html, 'property', 'og:image:width', '1200');
  html = setMeta(html, 'property', 'og:image:height', '630');
  html = setMeta(html, 'property', 'og:image:alt', cfg.imageAlt || 'Charcoal sun artwork from BarbPH');
  html = setMeta(html, 'property', 'og:locale', 'en_PH');
  html = setMeta(html, 'name', 'twitter:card', 'summary_large_image');
  html = setMeta(html, 'name', 'twitter:title', cfg.ogTitle || cfg.title);
  html = setMeta(html, 'name', 'twitter:description', cfg.ogDescription || cfg.description);
  html = setMeta(html, 'name', 'twitter:image', 'https://barbph.com/3stars1sun%20%283%29.png');
  html = setMeta(html, 'name', 'twitter:image:alt', cfg.imageAlt || 'Charcoal sun artwork from BarbPH');
  return html;
}

function cleanInternalLinks(html) {
  const replacements = new Map([
    ['index.html', '/'], ['/index.html', '/'],
    ['products.html', '/products'], ['/products.html', '/products'],
    ['programs.html', '/programs'], ['/programs.html', '/programs'],
    ['publications.html', '/publications'], ['/publications.html', '/publications'],
    ['partnership.html', '/partnership'], ['/partnership.html', '/partnership'],
    ['partnership-guide.html', '/partnership-guide'], ['/partnership-guide.html', '/partnership-guide'],
    ['ticker.html', '/ticker'], ['/ticker.html', '/ticker']
  ]);
  return html.replace(/href=(['"])([^'"]+)\1/gi, (full, quote, href) => {
    const next = replacements.get(href);
    return next ? `href=${quote}${next}${quote}` : full;
  });
}

function imageCdnUrl(source) {
  return `/.netlify/images?url=${encodeURIComponent('/' + source)}&fm=webp&q=82`;
}

function optimizeHomepageImages(html) {
  const names = [
    'ChatGPT Image Aug 22, 2026, 06_25_20 PM (1)(1).png',
    'ChatGPT Image Aug 22, 2026, 06_40_38 PM(1).png',
    'ChatGPT Image Aug 22, 2026, 06_40_45 PM(1).png',
    'ChatGPT Image Aug 22, 2026, 06_39_58 PM (1)(1).png',
    'ChatGPT Image Aug 22, 2026, 06_39_59 PM (3)(1).png'
  ];
  for (const name of names) {
    const escaped = escRE(name);
    const re = new RegExp(`src=["']${escaped}["']\\s+data-webp=["'][^"']+["']`, 'g');
    html = html.replace(re, `src="${imageCdnUrl(name)}"`);
  }
  return html;
}

function postProcessIndex(html) {
  const socialTitle = 'BarbPH | Digital Assets, Coaching Programs, Multidisciplinary Arts & Interactive Builds';
  const description = 'Explore BarbPH digital assets, coaching programs, multidisciplinary arts, interactive builds, publications, live systems, and independent digital projects.';
  html = commonSeo(html, {
    title: 'BarbPH | Digital Assets, Coaching & Multidisciplinary Arts',
    description,
    canonical: 'https://barbph.com/',
    ogTitle: socialTitle,
    ogDescription: description,
    imageAlt: 'Charcoal sun artwork from BarbPH'
  });
  html = html.replace(/<h1 class="visually-hidden">[\s\S]*?<\/h1>/i, '<h1 class="visually-hidden">BarbPH: Digital Assets, Coaching Programs, Multidisciplinary Arts and Interactive Builds</h1>');
  html = html.replace(/<p class="visually-hidden">BarbPH is a living stage[\s\S]*?<\/p>/i, '<p class="visually-hidden">BarbPH is a living stage for digital assets, coaching programs, multidisciplinary arts, interactive builds, publications, live systems and Daily Discover.</p>');
  html = html.replace(/digital products/gi, 'digital assets');
  html = html.replace(/practical programs/gi, 'coaching programs');
  html = html.replace(/telecast\.\./gi, 'telecast.');
  html = html.replace(/among others\.\./gi, 'among others.');
  html = html.replace(/know more\.\./gi, 'know more.');
  html = optimizeHomepageImages(html);
  html = insertJsonLd(html, {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://barbph.com/#organization',
        name: 'BarbPH',
        url: 'https://barbph.com/',
        description: 'Digital assets, coaching programs, multidisciplinary arts, interactive builds, publications and live systems from BarbPH.'
      },
      {
        '@type': 'WebSite',
        '@id': 'https://barbph.com/#website',
        name: 'BarbPH',
        url: 'https://barbph.com/',
        publisher: { '@id': 'https://barbph.com/#organization' },
        description
      }
    ]
  }, 'barbph-structured-data');
  return cleanInternalLinks(html);
}

function postProcessProducts(html) {
  const description = 'Explore BarbPH digital assets and interactive builds, including IKL, The Watch Tower, JANA, Will Wheel, The Bible, and experimental tools.';
  html = commonSeo(html, {
    title: 'Digital Assets | BarbPH',
    description,
    canonical: 'https://barbph.com/products',
    ogTitle: 'Digital Assets | BarbPH',
    ogDescription: description,
    imageAlt: 'Digital assets from BarbPH'
  });
  html = html.replace(/<h1 class="page-title">Products<\/h1>/i, '<h1 class="page-title">Digital Assets</h1>');
  html = html.replace("fetch('/.netlify/functions/catalog-feed?type=products', {cache:'no-store'})", "fetch('/.netlify/functions/catalog-feed?type=products')");
  html = insertJsonLd(html, {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': 'https://barbph.com/products#collection',
    name: 'BarbPH Digital Assets',
    url: 'https://barbph.com/products',
    description,
    isPartOf: { '@id': 'https://barbph.com/#website' }
  }, 'barbph-products-structured-data');
  return cleanInternalLinks(html);
}

function postProcessPrograms(html) {
  const description = 'Explore BarbPH coaching programs for mentorship, career navigation, interview practice, consultation, and guided group development.';
  html = commonSeo(html, {
    title: 'Coaching Programs | BarbPH',
    description,
    canonical: 'https://barbph.com/programs',
    ogTitle: 'Coaching Programs | BarbPH',
    ogDescription: description,
    imageAlt: 'Coaching programs from BarbPH'
  });
  html = html.replace(/<h1 class="page-title">Programs<\/h1>/i, '<h1 class="page-title">Coaching Programs</h1>');
  html = insertJsonLd(html, {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': 'https://barbph.com/programs#collection',
    name: 'BarbPH Coaching Programs',
    url: 'https://barbph.com/programs',
    description,
    isPartOf: { '@id': 'https://barbph.com/#website' }
  }, 'barbph-programs-structured-data');
  return cleanInternalLinks(html);
}

function postProcessPublications(html) {
  const description = 'Read BarbPH publications and The Bulletin: essays, releases, updates, notes, and selected work from BarbPH.';
  html = commonSeo(html, {
    title: 'Publications & Bulletin | BarbPH',
    description,
    canonical: 'https://barbph.com/publications',
    ogTitle: 'Publications & Bulletin | BarbPH',
    ogDescription: description,
    imageAlt: 'BarbPH publications and bulletin'
  });
  html = html.replace("fetch('/.netlify/functions/content-feed', {cache:'no-store'})", "fetch('/.netlify/functions/content-feed')");
  html = html.replace(/20% off Jana this week\s+[—–-]\s+code BARB20/g, '20% off Jana this week, code BARB20');
  html = insertJsonLd(html, {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': 'https://barbph.com/publications#collection',
    name: 'BarbPH Publications & Bulletin',
    url: 'https://barbph.com/publications',
    description,
    isPartOf: { '@id': 'https://barbph.com/#website' }
  }, 'barbph-publications-structured-data');
  return cleanInternalLinks(html);
}

function postProcessPartnership(html) {
  const description = 'Explore BarbPH partnership opportunities, submit a proposal, and learn how BarbPH collaborations work.';
  html = commonSeo(html, {
    title: 'Partnerships | BarbPH',
    description,
    canonical: 'https://barbph.com/partnership',
    ogTitle: 'Partnerships | BarbPH',
    ogDescription: description,
    imageAlt: 'BarbPH partnership opportunities'
  });
  html = insertJsonLd(html, {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': 'https://barbph.com/partnership#webpage',
    name: 'BarbPH Partnerships',
    url: 'https://barbph.com/partnership',
    description,
    isPartOf: { '@id': 'https://barbph.com/#website' }
  }, 'barbph-partnership-structured-data');
  return cleanInternalLinks(html);
}

function processHtml() {
  const handlers = new Map([
    ['index.html', postProcessIndex],
    ['products.html', postProcessProducts],
    ['programs.html', postProcessPrograms],
    ['publications.html', postProcessPublications],
    ['partnership.html', postProcessPartnership]
  ]);
  for (const file of walk(OUT).filter(f => /\.html$/i.test(f))) {
    let html = fs.readFileSync(file, 'utf8');
    const rel = path.relative(OUT, file).replaceAll('\\', '/');
    const handler = handlers.get(rel);
    html = handler ? handler(html) : cleanInternalLinks(html);
    fs.writeFileSync(file, html);
  }
}

function writeControlFiles() {
  fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /.netlify/functions/\n\nSitemap: https://barbph.com/sitemap.xml\n`);
  fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://barbph.com/</loc></url>\n  <url><loc>https://barbph.com/products</loc></url>\n  <url><loc>https://barbph.com/programs</loc></url>\n  <url><loc>https://barbph.com/publications</loc></url>\n  <url><loc>https://barbph.com/partnership</loc></url>\n</urlset>\n`);
  fs.writeFileSync(path.join(OUT, '_redirects'), `/index.html / 301!\n/products.html /products 301!\n/programs.html /programs 301!\n/publications.html /publications 301!\n/partnership.html /partnership 301!\n/partnerships.html /partnership 301!\n/partnerships /partnership 301!\n/systems.html /?systems=open 301!\n\n/products /products.html 200\n/programs /programs.html 200\n/publications /publications.html 200\n/partnership /partnership.html 200\n/systems /?systems=open 301!\n/partnership-guide.html /partnership-guide 301!\n/partnership-guide /partnership-guide.html 200\n/ticker.html /ticker 301!\n/ticker /ticker.html 200\n`);
}

function preflight() {
  const required = ['index.html', 'products.html', 'programs.html', 'publications.html', 'partnership.html', 'robots.txt', 'sitemap.xml', '_redirects'];
  for (const rel of required) {
    if (!fs.existsSync(path.join(OUT, rel))) throw new Error(`Missing required public file: ${rel}`);
  }

  const publicFiles = walk(OUT);
  const leaks = publicFiles.filter(f => /\.(md|txt)$/i.test(f) || INTERNAL_HTML.test(path.basename(f)) || f.includes(`${path.sep}overnight-work-log${path.sep}`));
  if (leaks.length) throw new Error(`Internal files leaked into dist:\n${leaks.join('\n')}`);

  const deployedFunctionFiles = walk(FUNCTIONS_OUT).filter(f => /\.(mjs|js|cjs)$/i.test(f));
  const wrongSheetRefs = deployedFunctionFiles.filter(file => {
    const text = fs.readFileSync(file, 'utf8');
    const ids = [
      ...[...text.matchAll(/\bconst\s+(?:SID|SHEET_ID)\s*=\s*["']([A-Za-z0-9_-]+)["']/g)].map(m => m[1]),
      ...[...text.matchAll(/docs\.google\.com\/spreadsheets\/d\/([A-Za-z0-9_-]+)/g)].map(m => m[1])
    ];
    return ids.some(id => id !== PUBLIC_SHEET_ID);
  });
  if (wrongSheetRefs.length) throw new Error(`A deployed function still points to a non-public control sheet:\n${wrongSheetRefs.join('\n')}`);
  for (const internal of INTERNAL_FUNCTIONS) {
    if (fs.existsSync(path.join(FUNCTIONS_OUT, internal))) throw new Error(`Internal diagnostic function leaked into production: ${internal}`);
  }

  const home = fs.readFileSync(path.join(OUT, 'index.html'), 'utf8');
  const requiredHomeStrings = [
    'BarbPH | Digital Assets, Coaching & Multidisciplinary Arts',
    'BarbPH | Digital Assets, Coaching Programs, Multidisciplinary Arts & Interactive Builds',
    'barbph-structured-data',
    '/.netlify/images?url='
  ];
  for (const s of requiredHomeStrings) if (!home.includes(s)) throw new Error(`Homepage preflight failed: missing ${s}`);

  for (const rel of ['products.html', 'programs.html', 'publications.html', 'partnership.html']) {
    const text = fs.readFileSync(path.join(OUT, rel), 'utf8');
    if (!/rel=["']canonical["']/i.test(text)) throw new Error(`${rel} missing canonical`);
    if (!/property=["']og:title["']/i.test(text)) throw new Error(`${rel} missing og:title`);
    if (!/name=["']description["']/i.test(text)) throw new Error(`${rel} missing description`);
  }

  console.log(`BARBPH preflight passed. ${publicFiles.length} public files, ${deployedFunctionFiles.length} function files.`);
}

runCatalogBuild();
resetDir(OUT);
copyPublicTree(ROOT, OUT);
rewriteFunctions();
processHtml();
writeControlFiles();
preflight();
