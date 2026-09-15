import type { Company } from "@/lib/types";
import { visualFor, cohortsFor, isPhoto, isLineArt } from "@/lib/art-direction";

/* THE GRID IS COMPOSED, NOT SORTED.
   The edition's grid opens the way a gallery wall is hung rather than the
   way a directory is filed: two rows chosen by hand, then everyone else dealt
   so that no card stands beside, above or diagonally from one of its own kind -
   the same campaign, the same sort of picture (photograph, cutout, line
   drawing, animation) or the same sector. The groups that are plentiful are
   pulled forward in proportion, so none is left over to clump at the foot. */

/* the first two rows at six across, in this order */
export const OPENING = [
  "blykalla",
  "mialgae",
  "turn2x",
  "space-forge",
  "gridware",
  "intramotev",
  "isometric",
  "assetcool",
  "flox-intelligence",
  "oneka-technologies",
  "amatera",
  "metafuels",
];

/* composed for the grid's opening density */
const COLS = 6;

function kindOf(c: Company) {
  const v = visualFor(c);
  if (!v) return "none";
  if (v.endsWith(".gif")) return "gif";
  if (isLineArt(v)) return "line";
  if (isPhoto(v)) return "photo";
  return "cutout";
}

const cohortOf = (c: Company) => cohortsFor(c.slug)[0] ?? "none";

export function composeOrder(list: Company[]): string[] {
  const bySlug = new Map(list.map((c) => [c.slug, c]));
  const placed = OPENING.map((s) => bySlug.get(s)).filter(
    (c): c is Company => !!c
  );
  const rest = list
    .filter((c) => !OPENING.includes(c.slug))
    .sort((a, b) => a.name.localeCompare(b.name));

  /* how much of each group is still to be hung */
  const tally = (key: (c: Company) => string) => {
    const m = new Map<string, number>();
    for (const c of rest) m.set(key(c), (m.get(key(c)) ?? 0) + 1);
    return m;
  };
  const kinds = tally(kindOf);
  const sectors = tally((c) => c.sectorLabel);
  const cohorts = tally(cohortOf);

  while (rest.length) {
    const p = placed.length;
    const col = p % COLS;
    /* the neighbours already hung: left, above, and the two upper diagonals */
    const neighbours: [Company | undefined, number][] = [
      [col > 0 ? placed[p - 1] : undefined, 1],
      [placed[p - COLS], 1],
      [col > 0 ? placed[p - COLS - 1] : undefined, 0.5],
      [col < COLS - 1 ? placed[p - COLS + 1] : undefined, 0.5],
    ];
    let best = 0;
    let bestScore = Infinity;
    rest.forEach((c, i) => {
      let score = 0;
      for (const [n, w] of neighbours) {
        if (!n) continue;
        const cohort = cohortOf(c);
        if (cohortOf(n) === cohort) score += (cohort === "none" ? 1 : 10) * w;
        if (kindOf(n) === kindOf(c)) score += 6 * w;
        if (n.sectorLabel === c.sectorLabel) score += 4 * w;
      }
      /* pull the plentiful groups forward */
      score -= 3 * ((kinds.get(kindOf(c)) ?? 0) / rest.length);
      score -= 3 * ((sectors.get(c.sectorLabel) ?? 0) / rest.length);
      score -= 3 * ((cohorts.get(cohortOf(c)) ?? 0) / rest.length);
      if (score < bestScore) {
        bestScore = score;
        best = i;
      }
    });
    const [next] = rest.splice(best, 1);
    kinds.set(kindOf(next), (kinds.get(kindOf(next)) ?? 1) - 1);
    sectors.set(next.sectorLabel, (sectors.get(next.sectorLabel) ?? 1) - 1);
    cohorts.set(cohortOf(next), (cohorts.get(cohortOf(next)) ?? 1) - 1);
    placed.push(next);
  }
  return placed.map((c) => c.slug);
}
