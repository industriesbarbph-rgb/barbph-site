/**
 * barbph.com — Catalog auto-build script
 * ----------------------------------------
 * Reads the "Products" and "Programs" tabs of the Google Sheet
 * and updates their corresponding landing pages:
 *
 * Products -> products.html
 * Programs -> programs.html
 *
 * Only content between the BARBPH-AUTOGEN markers is replaced.
 */

const fs = require("fs");
const https = require("https");

// ---- CONFIG ----
const SHEET_ID = "1TSpt_DxEDhpsXE09lNx8S63b7cDomEXhVua--p99DGM";

const TARGETS = [
  {
    tab: "Products",
    file: "./products.html",
    startMarker: "<!-- BARBPH-AUTOGEN:PRODUCTS-START -->",
    endMarker: "<!-- BARBPH-AUTOGEN:PRODUCTS-END -->"
  },
  {
    tab: "Programs",
    file: "./programs.html",
    startMarker: "<!-- BARBPH-AUTOGEN:PROGRAMS-START -->",
    endMarker: "<!-- BARBPH-AUTOGEN:PROGRAMS-END -->"
  }
];

// ---- Handles Cloudinary / GitHub raw / Google Drive links interchangeably ----
function normalizeMediaUrl(url) {
  if (!url) return "";

  url = url.trim();

  // Google Drive share links -> direct-view format
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);

  if (driveMatch) {
    return `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`;
  }

  // Cloudinary, GitHub raw, Imgur, etc. are already direct links
  return url;
}

// ---- Very small CSV parser (handles quoted fields with commas) ----
function parseCSV(text) {
  const rows = [];

  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        row.push(field);
        field = "";
      } else if (c === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else if (c === "\r") {
        // skip
      } else {
        field += c;
      }
    }
  }

  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function escapeHtml(str) {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cardHTML(item) {
  const photo = normalizeMediaUrl(item.photo_url);

  const voiceOn =
    item.voice_enabled &&
    item.voice_enabled.toLowerCase() === "yes";

  const voice = voiceOn
    ? normalizeMediaUrl(item.voice_url)
    : "";

  const buttons = [];

  if (item.story_link) {
    buttons.push(
      `<a href="${escapeHtml(
        item.story_link
      )}" target="_blank" rel="noopener">Read the story</a>`
    );
  }

  if (item.try_link) {
    buttons.push(
      `<a href="${escapeHtml(
        item.try_link
      )}" target="_blank" rel="noopener">Try it</a>`
    );
  }

  if (item.buy_link) {
    buttons.push(
      `<a href="${escapeHtml(
        item.buy_link
      )}" target="_blank" rel="noopener" class="primary">Buy it</a>`
    );
  }

  const voiceMarkup = voice
    ? `<div class="sound-badge" data-sound-badge>
        <svg viewBox="0 0 24 24">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1-3.29-2.5-4.03v8.05c1.5-.73 2.5-2.25 2.5-4.02z"/>
        </svg>
      </div>
      <audio data-voice-audio preload="none">
        <source src="${escapeHtml(voice)}" type="audio/mpeg">
      </audio>`
    : "";

  return `    <article class="card"${voice ? " data-voice-card" : ""}>
      ${voiceMarkup}
      <div class="card-photo">
        <img src="${escapeHtml(photo)}" alt="${escapeHtml(
    item.name
  )}" loading="lazy">
      </div>

      <div class="card-body">
        <div class="card-name">${escapeHtml(item.name)}</div>

        <div class="card-desc">${escapeHtml(
          item.description
        )}</div>

        <div class="card-actions">
          ${buttons.join("\n          ")}
        </div>
      </div>
    </article>`;
}

function fetchCSV(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          return resolve(fetchCSV(res.headers.location));
        }

        if (res.statusCode !== 200) {
          return reject(
            new Error(
              `Google Sheet request failed with status ${res.statusCode}`
            )
          );
        }

        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
}

async function buildTarget({
  tab,
  file,
  startMarker,
  endMarker
}) {
  console.log(`Fetching "${tab}" tab...`);

  if (!fs.existsSync(file)) {
    throw new Error(`Could not find ${file}`);
  }

  let page = fs.readFileSync(file, "utf8");

  if (!page.includes(startMarker)) {
    throw new Error(
      `Could not find START marker for "${tab}" inside ${file}`
    );
  }

  if (!page.includes(endMarker)) {
    throw new Error(
      `Could not find END marker for "${tab}" inside ${file}`
    );
  }

  const csvUrl =
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}` +
    `/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`;

  const csvText = await fetchCSV(csvUrl);

  const rows = parseCSV(csvText);

  const headerIndex = rows.findIndex(
    (r) =>
      r[0] &&
      r[0].trim().toLowerCase() === "name"
  );

  if (headerIndex === -1) {
    throw new Error(
      `Could not find header row in "${tab}" tab.`
    );
  }

  const headers = rows[headerIndex].map((h) =>
    h.trim()
  );

  const dataRows = rows
    .slice(headerIndex + 1)
    .filter((r) =>
      r.some((cell) => cell && cell.trim())
    );

  const items = dataRows.map((r) => {
    const obj = {};

    headers.forEach((h, i) => {
      obj[h] = (r[i] || "").trim();
    });

    return obj;
  });

  const published = items.filter(
    (i) =>
      i.published &&
      i.published.toLowerCase() === "yes" &&
      i.name
  );

  console.log(
    `  ${tab}: ${items.length} rows, ${published.length} published.`
  );

  const html = published.length
    ? published.map(cardHTML).join("\n\n")
    : `    <div class="empty-note">Currently building — check back soon.</div>`;

  const startIndex = page.indexOf(startMarker);
  const endIndex = page.indexOf(endMarker);

  if (endIndex < startIndex) {
    throw new Error(
      `AUTOGEN markers are in the wrong order inside ${file}`
    );
  }

  page =
    page.slice(0, startIndex) +
    startMarker +
    "\n" +
    html +
    "\n    " +
    endMarker +
    page.slice(endIndex + endMarker.length);

  fs.writeFileSync(file, page);

  console.log(`${file} updated successfully.`);
}

async function build() {
  for (const target of TARGETS) {
    await buildTarget(target);
  }

  console.log("");
  console.log("BARBPH catalog build complete.");
  console.log("Products -> products.html");
  console.log("Programs -> programs.html");
}

build().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
