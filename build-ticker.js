/**
 * BarbPH ticker data build.
 * Reads Products, Programs and the sanitized Ticker Testimonials feed from the
 * safe public control sheet. Only published=yes rows are admitted. The public
 * testimonial feed contains no private contact_details field.
 */

import fs from "node:fs";
import https from "node:https";

const SHEET_ID = "1NA3jrA3gdctbpfhXtz2TAiRGRFWsyWRTT6EvoJNIfUw";
const TARGET = "./ticker.html";
const START = "<!-- BARBPH-TICKER-DATA-START -->";
const END = "<!-- BARBPH-TICKER-DATA-END -->";

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchText(res.headers.location));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Google Sheet request failed with status ${res.statusCode}`));
      }
      let data = "";
      res.setEncoding("utf8");
      res.on("data", chunk => { data += chunk; });
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

function parseCSV(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ""; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== '\r') field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

async function readPublished(tab) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`;
  const rows = parseCSV(await fetchText(url));
  const headerIndex = rows.findIndex(row => clean(row[0]).toLowerCase() === "name");
  if (headerIndex < 0) throw new Error(`Could not find header row in ${tab}.`);

  const headers = rows[headerIndex].map(clean);
  const objects = rows.slice(headerIndex + 1)
    .filter(row => row.some(cell => clean(cell)))
    .map(row => Object.fromEntries(headers.map((header, index) => [header, clean(row[index])])));

  return objects.filter(item =>
    clean(item.published).toLowerCase() === "yes" && clean(item.name)
  );
}

function safeJson(value) {
  return JSON.stringify(value).replace(/<\//g, "<\\/");
}

async function build() {
  if (!fs.existsSync(TARGET)) throw new Error(`Missing ${TARGET}`);

  const [productsRaw, programsRaw, testimonialsRaw] = await Promise.all([
    readPublished("Products"),
    readPublished("Programs"),
    readPublished("Ticker Testimonials")
  ]);

  const payload = {
    products: productsRaw.map(item => ({
      name: clean(item.name),
      description: clean(item.description),
      category: clean(item.category)
    })),
    programs: programsRaw.map(item => ({
      name: clean(item.name),
      description: clean(item.description)
    })),
    testimonials: testimonialsRaw.map(item => ({
      name: clean(item.name),
      quote: clean(item.quote),
      rating: clean(item.rating),
      related_to: clean(item.related_to)
    })).filter(item => item.quote)
  };

  let html = fs.readFileSync(TARGET, "utf8");
  const start = html.indexOf(START);
  const end = html.indexOf(END);
  if (start < 0 || end < start) throw new Error("Ticker data markers are missing or out of order.");

  const block = `${START}\n<script id="barbph-ticker-data" type="application/json">${safeJson(payload)}</script>\n${END}`;
  html = html.slice(0, start) + block + html.slice(end + END.length);
  fs.writeFileSync(TARGET, html);

  console.log(`Ticker updated: ${payload.products.length} products, ${payload.programs.length} programs, ${payload.testimonials.length} testimonials.`);
}

build().catch(error => {
  console.error("Ticker build failed:", error);
  process.exit(1);
});
