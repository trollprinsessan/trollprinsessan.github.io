"use client";

import "./grid.css";
import type { Company } from "@/lib/types";
import { visualFor, cohortsFor, isPhoto } from "@/lib/art-direction";
import { iso3List } from "@/lib/countries";
/* where the motif sits in each file, measured by motif-boxes.py:
   [x0, y0, x1, y1] as fractions of the file, then the motif's width/height */
import MOTIFS from "./motif-boxes.json";

const BOXES = MOTIFS as Record<string, number[]>;

/* THE MOTIF, CUT FROM ITS FILE: a box in the motif's own proportion, and the
   file inside it moved and scaled so only the motif shows - the cutouts'
   transparent canvas, the gifs' ground and the drawings' white edge fall
   outside it. A file that was never measured is shown whole, as 3:2. */
export function motifStyle(src: string) {
  /* a photograph fills the frame: as wide as the card's type, as high as
     every other picture - cropped top and bottom when it is squarer than
     3:2, never narrower */
  if (isPhoto(src)) {
    return {
      box: { ["--r" as string]: 1.5 },
      img: { width: "100%", height: "100%", left: 0, top: 0, objectFit: "cover" as const },
    };
  }
  const b = BOXES[src];
  if (!b) return { box: { ["--r" as string]: 1.5 }, img: { width: "100%", height: "100%", left: 0, top: 0 } };
  const [x0, y0, x1, y1, r] = b;
  return {
    box: { ["--r" as string]: r },
    /* the height too, so the picture has its size before it has loaded - a
       lazy picture with no height is never seen, and never loads */
    img: {
      width: `${(100 / (x1 - x0)).toFixed(3)}%`,
      height: `${(100 / (y1 - y0)).toFixed(3)}%`,
      left: `${((-x0 / (x1 - x0)) * 100).toFixed(3)}%`,
      top: `${((-y0 / (y1 - y0)) * 100).toFixed(3)}%`,
    },
  };
}

/* LISTAN-V2 — THE CARD AS THE BOOK'S INDEX ENTRY.
   The photobook's index sets each company as a small entry: the picture in
   a square, whole, at its own proportion, with the name and the page it is on
   (the book's index entry, 61 x 95). The card here is that entry with two
   changes: every word goes under the picture, and where the book gives the
   page number the site gives the one-liner, in italic - on a screen
   there is no page to turn to, and the one-liner is the reason to open it.
   Name and one-liner in one size, as the book sets name and page. Then the
   sections the company sits in: sector, campaigns, country, one to a line,
   plain.

   EVERY MOTIF STANDS ON ONE LINE: one height for all of them,
   and the same distance from the foot of each motif to its name. The frame
   is 3:2, the photographs' own shape; a motif nearer square reaches the
   frame's height and gets air at its sides, a wide one reaches its sides and
   stands lower, and all of them stand on the frame's foot.

   Same props, same stops and same tracks as listview-v1's Grid, so the density
   control, the filters and the modal work on it unchanged. */
export default function GridV2({
  list,
  onSelect,
  cols,
  phone,
  shows,
  open = null,
  campaign,
  stamp,
}: {
  list: Company[];
  onSelect: (c: Company) => void;
  cols: number;
  phone: number;
  shows: string;
  /* listview-v3: the company open in the panel beside the grid, if any */
  open?: string | null;
  /* listview-v5: the campaign as a badge rather than in words */
  campaign?: (slug: string) => React.ReactNode;
  /* listview-v4 and on: the campaigns stuck on the picture */
  stamp?: (slug: string) => React.ReactNode;
}) {
  return (
    <div
      className={`grid grid--v2 grid--v2-${shows}${open ? " grid--side" : ""}`}
      style={{
        ["--gridcols" as string]: cols,
        ["--gridcols-phone" as string]: phone,
      }}
    >
      {list.map((c) => {
        const visual = visualFor(c);
        const motif = visual ? motifStyle(visual) : null;
        const code = iso3List(c.countries);
        const sections: React.ReactNode[] = [
          c.sectorLabel,
          ...(campaign ? (cohortsFor(c.slug).length ? [campaign(c.slug)] : []) : cohortsFor(c.slug)),
          code,
        ].filter(Boolean);
        return (
          <button
            key={c.slug}
            type="button"
            className={`entry2${open === c.slug ? " entry2--open" : ""}`}
            aria-current={open === c.slug ? "true" : undefined}
            onClick={() => onSelect(c)}
          >
            <span className={`entry2-media${stamp ? " entry2-media--stamped" : ""}`}>
              {stamp?.(c.slug)}
              {visual && motif && (
                <span className="entry2-motif" style={motif.box}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="entry2-thumb" src={visual} alt={c.name} loading="lazy" style={motif.img} />
                </span>
              )}
            </span>
            <span className="entry2-text">
              <span className="entry2-name">{c.name}</span>
              {c.statement && <span className="entry2-gymbs">{c.statement}</span>}
            </span>
            {sections.length > 0 && (
              <span className="entry2-sections">
                {sections.map((s, i) => (
                  <span key={i}>{s}</span>
                ))}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
