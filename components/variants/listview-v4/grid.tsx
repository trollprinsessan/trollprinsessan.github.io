"use client";

import type { Company } from "@/lib/types";
import { visualFor } from "@/lib/art-direction";
import { iso3List } from "@/lib/countries";
import GridV2, { motifStyle } from "@/components/variants/listview-v2/grid";
import { Stamps } from "@/components/variants/badge/badge";

/* LISTAN-V4 — THE EVEN GRID WITH THE STAMPS. listview-v2's grid as it is -
   every card the same size, the motif on the frame's foot, the name, the
   one-liner in italic, the sector and the country - with each campaign's
   logo stuck on the picture's head like a stamp (badge.tsx, Stamps). Every
   company gets the same room, as far as possible - no ranking, no larger
   cards, no special treatment - so the grid is even everywhere.

   The pieces below (Motif, Words, Sections) are also listview-v6's. */

export function Motif({ c }: { c: Company }) {
  const visual = visualFor(c);
  const motif = visual ? motifStyle(visual) : null;
  return (
    <span className="e4-media entry2-media--stamped">
      <Stamps slug={c.slug} />
      {visual && motif && (
        <span className="e4-motif" style={motif.box}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="e4-thumb" src={visual} alt={c.name} loading="lazy" style={motif.img} />
        </span>
      )}
    </span>
  );
}

export function Words({ c }: { c: Company }) {
  return (
    <span className="e4-text">
      <span className="e4-name">{c.name}</span>
      {c.statement && <span className="e4-gymbs">{c.statement}</span>}
    </span>
  );
}

/* the sector and the country - the campaign is the stamp on the picture */
export function Sections({ c }: { c: Company }) {
  const code = iso3List(c.countries);
  return (
    <span className="e4-sections">
      {c.sectorLabel && <span>{c.sectorLabel}</span>}
      {code && <span>{code}</span>}
    </span>
  );
}

export default function GridV4(props: {
  list: Company[];
  onSelect: (c: Company) => void;
  cols: number;
  phone: number;
  shows: string;
  open?: string | null;
}) {
  return <GridV2 {...props} campaign={() => null} stamp={(slug) => <Stamps slug={slug} />} />;
}
