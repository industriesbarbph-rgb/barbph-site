/**
 * barbph.com — Catalog auto-build script
 * ----------------------------------------
 * Reads the "Products" tab of the Google Sheet as CSV, generates
 * real HTML cards, and writes them into catalog.html between the
 * BARBPH-AUTOGEN markers. Designed to run on Netlify (via a Build
 * Hook) or on a schedule (e.g. GitHub Actions cron).
 *
 * WHAT YOU NEVER NEED TO TOUCH: catalog.html's design/layout.
 * WHAT CHANGES EVERY RUN: only the content between the AUTOGEN markers.
 */

const fs = require("fs");
const https = require("https");

// ---- CONFIG ----
const SHEET_ID = "1TSpt_DxEDhpsXE09lNx8S63b7cDomEXhVua--p99DGM";
const SHEET_TAB = "Products"; // change to "Programs" for the Programs build
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_TAB}`;
const CATALOG_FILE = "./catalog.html";
const START_MARKER = "<!-- BARBPH-AUTOGEN:PRODUCTS-START -->";
const END_MARKER = "<!-- BARBPH-AUTOGEN:PRODUCTS-END -->";

// ---- Handles Cloudinary / GitHub raw / Google Drive links interchangeably ----
function normalizeMediaUrl(url) {
  if (!url) return "";
  url = url.trim();
  // Google Drive share links -> direct-view format
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (driveMatch) {
    return `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`;
  }
  // Cloudinary, GitHub raw, Imgur, etc. are already direct links — pass through
  return url;
}

// ---- Very small CSV parser (handles quoted fields with commas) ----
function parseCSV(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { field += c; }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c === "\r") { /* skip */ }
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function escapeHtml(str) {
  return (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function cardHTML(item) {
  const photo = normalizeMediaUrl(item.photo_url);
  const buttons = [];
  if (item.story_link) buttons.push(`<a href="${escapeHtml(item.story_link)}" target="_blank" rel="noopener">Read the story</a>`);
  if (item.try_link) buttons.push(`<a href="${escapeHtml(item.try_link)}" target="_blank" rel="noopener">Try it</a>`);
  if (item.buy_link) buttons.push(`<a href="${escapeHtml(item.buy_link)}" target="_blank" rel="noopener" class="primary">Buy it</a>`);

  return `    <article class="card">
      <div class="card-photo">
        <img src="${escapeHtml(photo)}" alt="${escapeHtml(item.name)}" loading="lazy">
      </div>
      <div class="card-body">
        <div class="card-name">${escapeHtml(item.name)}</div>
        <div class="card-desc">${escapeHtml(item.description)}</div>
        <div class="card-actions">
          ${buttons.join("\n          ")}
        </div>
      </div>
    </article>`;
}

function fetchCSV(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchCSV(res.headers.location)); // follow redirect
      }
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

async function build() {
  console.log(`Fetching "${SHEET_TAB}" tab...`);
  const csvText = await fetchCSV(CSV_URL);
  const rows = parseCSV(csvText);

  // Find the header row (the row containing "name" — skips the note row if present)
  const headerIndex = rows.findIndex((r) => r[0] && r[0].trim().toLowerCase() === "name");
  if (headerIndex === -1) throw new Error('Could not find header row (expected a "name" column).');

  const headers = rows[headerIndex].map((h) => h.trim());
  const dataRows = rows.slice(headerIndex + 1).filter((r) => r.some((cell) => cell && cell.trim()));

  const items = dataRows.map((r) => {
    const obj = {};
    headers.forEach((h, i) => (obj[h] = (r[i] || "").trim()));
    return obj;
  });

  const published = items.filter((i) => i.published && i.published.toLowerCase() === "yes" && i.name);
  console.log(`Found ${items.length} rows, ${published.length} published.`);

  const html = published.length
    ? published.map(cardHTML).join("\n\n")
    : `    <div class="empty-note">Currently building — check back soon.</div>`;

  let catalog = fs.readFileSync(CATALOG_FILE, "utf8");
  const pattern = new RegExp(`${START_MARKER}[\\s\\S]*?${END_MARKER}`);
  catalog = catalog.replace(pattern, `${START_MARKER}\n${html}\n    ${END_MARKER}`);
  fs.writeFileSync(CATALOG_FILE, catalog);

  console.log("catalog.html updated successfully.");
}

build().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
