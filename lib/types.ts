export interface Company {
  name: string;
  slug: string;
  countries: string[];
  sector: string;
  sectorLabel: string;
  subsector: string;
  yearFounded: number | null;
  years: number[];
  returning: boolean;
  statement: string;
  website: string;
  visual: string;
  // optional: no company carries themes yet, so a company without them is
  // simply never matched when a theme is selected
  themes?: string[];
  legacy: { solution: string; problem: string; description: string };
  current: { fix: string; outperform: string; future: string };
}

export interface Facets {
  sectors: string[];
  countries: string[];
  years: number[];
  themes: string[];
}
