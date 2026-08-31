// Transforms the Webflow CSV export of the Impact/100 list into clean JSON.
// Usage: node scripts/transform-csv.mjs "/path/to/export.csv"
// Default source path can be overridden by the first CLI arg.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC =
  process.argv[2] ||
  "/Users/ninawenstrom/Downloads/Norrsken - Impact_100 Lists - 68c9c7b2c671cc38f7f43f4b.csv";
const OUT = resolve(__dirname, "../lib/companies.json");

// --- minimal RFC-4180 CSV parser (handles quotes, commas, newlines) ---
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c === "\r") { /* ignore */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// --- normalization maps ---
const COUNTRY_FIX = { US: "United States", UK: "United Kingdom" };
const SECTOR_MERGE = { climate: "climatetech" };
const SECTOR_LABELS = {
  climatetech: "ClimateTech",
  healthtech: "HealthTech",
  foodtech: "FoodTech",
  fintech: "FinTech",
  femtech: "FemTech",
  biotech: "BioTech",
  cleantech: "CleanTech",
  insurtech: "InsurTech",
  "hr-tech": "HR Tech",
  "e-commerce": "E-commerce",
  "internet-and-connectivity": "Internet & Connectivity",
};
const sectorLabel = (s) =>
  SECTOR_LABELS[s] || s.replace(/\b\w/g, (m) => m.toUpperCase());

function normCountries(raw) {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((c) => COUNTRY_FIX[c] || c);
}
function normYears(raw) {
  const ys = [...new Set(
    raw.split(";").map((s) => s.trim()).filter(Boolean).map(Number).filter((n) => !Number.isNaN(n))
  )];
  return ys.sort((a, b) => a - b);
}

// --- run ---
const text = readFileSync(SRC, "utf-8");
const [header, ...dataRows] = parseCSV(text);
const idx = Object.fromEntries(header.map((h, i) => [h.trim(), i]));
const get = (r, name) => (r[idx[name]] ?? "").trim();

const issues = { blankSector: [], blankYear: [], noVisual: 0 };
const companies = [];

for (const r of dataRows) {
  if (!r.length || !get(r, "Name")) continue;
  const name = get(r, "Name");
  const rawSector = get(r, "Sectors").toLowerCase();
  const sector = SECTOR_MERGE[rawSector] || rawSector;
  const years = normYears(get(r, "Year(s) Added to the List"));
  if (!sector) issues.blankSector.push(name);
  if (!years.length) issues.blankYear.push(name);
  if (!get(r, "Company Visual")) issues.noVisual++;

  companies.push({
    name,
    slug: get(r, "Slug") || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    countries: normCountries(get(r, "Geography")),
    sector,
    sectorLabel: sector ? sectorLabel(sector) : "",
    subsector: get(r, "Subsector(s)"),
    yearFounded: get(r, "Year Founded") ? Number(get(r, "Year Founded")) : null,
    years,
    returning: years.length > 1,
    statement: get(r, "Get you mind blown statement"),
    website: get(r, "Website"),
    visual: get(r, "Company Visual"),
    legacy: {
      solution: get(r, "Solution"),
      problem: get(r, "Problem"),
      description: get(r, "Description"),
    },
    // New 2026+ fields — not present in this export yet; reserved in the schema.
    current: { fix: "", outperform: "", future: "" },
  });
}

companies.sort((a, b) => a.name.localeCompare(b.name));
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(companies, null, 2));

console.log(`✓ wrote ${companies.length} companies → ${OUT}`);
console.log(`  blank sector: ${issues.blankSector.length} ${issues.blankSector.join(", ")}`);
console.log(`  blank year:   ${issues.blankYear.length} ${issues.blankYear.join(", ")}`);
console.log(`  no logo:      ${issues.noVisual}`);
const sectors = [...new Set(companies.map((c) => c.sectorLabel).filter(Boolean))].sort();
const countries = [...new Set(companies.flatMap((c) => c.countries))].sort();
console.log(`  sectors (${sectors.length}): ${sectors.join(", ")}`);
console.log(`  countries (${countries.length})`);
