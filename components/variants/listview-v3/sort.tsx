"use client";

import "./sort.css";
import "./panel.css";
import type { Company } from "@/lib/types";
import { cohortsFor } from "@/lib/art-direction";

/* LISTAN-V3: THE INDEX SORTS BY ITS COLUMNS.
   Each column's head is a switch with three states, pressed in turn:
   A to Z, Z to A, and back to the list's own order - the composed edition
   first. Name, the one-liner, the campaign, the sector, the country. The
   campaign sorts as the edition sets them: Electro Union, then no campaign,
   then Prompt What Matters. */

export type SortKey = "name" | "gymbs" | "campaign" | "sector" | "country";
export type Sort = { key: SortKey; dir: 1 | -1 } | null;

const COLUMNS: { key: SortKey; label: string; cell: string }[] = [
  { key: "name", label: "Name", cell: "row-name" },
  { key: "gymbs", label: "One-liner", cell: "row-statement" },
  { key: "campaign", label: "Campaign", cell: "row-campaign" },
  { key: "sector", label: "Sector", cell: "row-sector" },
  { key: "country", label: "Country", cell: "row-geo" },
];

const collator = new Intl.Collator("en", { sensitivity: "base", numeric: true });

function campaignRank(c: Company) {
  const cs = cohortsFor(c.slug);
  if (cs.includes("Electro Union")) return 0;
  if (cs.includes("Prompt What Matters")) return 2;
  return 1;
}

function text(c: Company, key: SortKey) {
  if (key === "name") return c.name;
  if (key === "gymbs") return c.statement ?? "";
  if (key === "sector") return c.sectorLabel ?? "";
  return c.countries[0] ?? "";
}

/* the list in the chosen order; an empty field goes last either way, and
   equal ones keep the order they had */
export function sortCompanies(list: Company[], sort: Sort): Company[] {
  if (!sort) return list;
  const { key, dir } = sort;
  return [...list].sort((a, b) => {
    if (key === "campaign") return dir * (campaignRank(a) - campaignRank(b));
    const x = text(a, key);
    const y = text(b, key);
    if (!x && y) return 1;
    if (x && !y) return -1;
    return dir * collator.compare(x, y);
  });
}

/* A to Z, Z to A, back */
export function nextSort(sort: Sort, key: SortKey): Sort {
  if (!sort || sort.key !== key) return { key, dir: 1 };
  if (sort.dir === 1) return { key, dir: -1 };
  return null;
}

/* the fold-out mark the dock draws, turned: up for A to Z, down for Z to A */
function Mark({ dir }: { dir: 1 | -1 }) {
  return (
    <svg
      className={`sort-mark${dir === 1 ? " sort-mark--up" : ""}`}
      viewBox="0 0 10 10"
      width="10"
      height="10"
      aria-hidden="true"
    >
      <path d="M5 0.5 V9 M1.2 5.4 L5 9.2 L8.8 5.4" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

/* THE HEAD: one row over the index, on the rows' own tracks, each column's
   name a switch. The column sorting is black with its mark; the rest grey. */
export function SortHead({ sort, onSort }: { sort: Sort; onSort: (s: Sort) => void }) {
  return (
    <div className="index-item index-head">
      <div className="row row--head" role="group" aria-label="Sort the list">
        {COLUMNS.map((col) => {
          const on = sort?.key === col.key ? sort.dir : 0;
          return (
            <button
              key={col.key}
              type="button"
              className={`${col.cell} sort-btn${on ? " sort-btn--on" : ""}`}
              aria-pressed={!!on}
              aria-label={`Sort by ${col.label}${on === 1 ? ", A to Z" : on === -1 ? ", Z to A" : ""}`}
              onClick={() => onSort(nextSort(sort, col.key))}
            >
              <span>{col.label}</span>
              {on !== 0 && <Mark dir={on} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
