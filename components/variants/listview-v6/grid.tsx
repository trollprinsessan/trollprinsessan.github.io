"use client";

import "./grid.css";
import type { Company } from "@/lib/types";
import { Motif, Words, Sections } from "@/components/variants/listview-v4/grid";

/* LISTAN-V6 — THE CARD LYING DOWN. The same pieces as listview-v2 and v4 -
   the motif on its foot, the name, the one-liner in italic, the sections
   with the campaign's badge - turned on their side: the picture at the
   left, the words at its right, the way a contents page sets a line with
   its picture. More of the one-liner is read at a glance, the list reads
   down as much as across, and the pictures still share one foot in a row.

   The density control keeps its meaning: sixteen across is six in a row,
   twelve five, eight four, six three; a phone one (two at the tightest). */
const PER_ROW: Record<number, number> = { 16: 6, 12: 5, 8: 4, 6: 3 };

export default function GridV6({
  list,
  onSelect,
  cols,
  phone,
  shows,
  open = null,
}: {
  list: Company[];
  onSelect: (c: Company) => void;
  cols: number;
  phone: number;
  shows: string;
  open?: string | null;
}) {
  return (
    <div
      className={`grid grid--v6 grid--v6-${shows}${open ? " grid--v6-open" : ""}`}
      style={{
        ["--gridcols" as string]: PER_ROW[cols] ?? 3,
        ["--gridcols-phone" as string]: phone > 3 ? 2 : 1,
      }}
    >
      {list.map((c) => (
        <button
          key={c.slug}
          type="button"
          className={`e4 e6${open === c.slug ? " e4--open" : ""}`}
          aria-current={open === c.slug ? "true" : undefined}
          onClick={() => onSelect(c)}
        >
          <Motif c={c} />
          <span className="e6-words">
            <Words c={c} />
            <Sections c={c} />
          </span>
        </button>
      ))}
    </div>
  );
}
