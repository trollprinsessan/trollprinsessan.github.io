import data from "./companies.json";
import type { Company, Facets } from "./types";

export const companies = data as Company[];

export function getCompany(slug: string): Company | undefined {
  return companies.find((c) => c.slug === slug);
}

// The curated themes. These are editorial groupings rather than anything
// derived from the data — no company record carries a `themes` value yet, so
// selecting one currently returns nothing until the companies are tagged.
export const THEMES = ["Electro Union", "Prompt What Matters"];

export function getFacets(list: Company[] = companies): Facets {
  const sectors = [...new Set(list.map((c) => c.sectorLabel).filter(Boolean))].sort();
  const countries = [...new Set(list.flatMap((c) => c.countries))].sort();
  const years = [...new Set(list.flatMap((c) => c.years))].sort((a, b) => b - a);
  // prefer themes present in the data; fall back to the curated list
  const found = [...new Set(list.flatMap((c) => c.themes ?? []))].sort();
  const themes = found.length ? found : THEMES;
  return { sectors, countries, years, themes };
}
