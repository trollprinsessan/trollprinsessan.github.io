"use client";

import "./chapters.css";
import type { Company } from "@/lib/types";
import { cohortsFor } from "@/lib/art-direction";
import CardGrid from "@/components/variants/parts/cards";
import { Badge } from "@/components/variants/badge/badge";
import { MoreSticker } from "@/components/variants/parts/category";

/* LISTAN-V5 — CHAPTERS. The list divided the way the edition divides it:
   the two campaigns first, each under a head with its badge at full size,
   then everyone else. The cards are listview-v2's, the campaign on them its
   logo stuck on the picture, as in listview-v4. The order inside each chapter
   is the list's own, so the filters, the search and the shake work
   unchanged; a chapter the filters empty is left out, and when only one is
   left there is no head at all - a list of one chapter is just the list. */

/* each chapter's key, for the category view's banner and sticker */
const KEY: Record<string, string> = { "Electro Union": "eu", "Prompt What Matters": "pwm", rest: "more" };

type Chapter = { key: string; title: string; lede?: string; badge?: string; list: Company[] };

const CAMPAIGNS: { name: string; lede: (n: number) => string }[] = [
  {
    name: "Electro Union",
    lede: (n) => `In here you'll find the ${n} builders, making Europe the Electro Union.`,
  },
  {
    name: "Prompt What Matters",
    lede: () => "The world does not need another sales agent. It needs bigger prompts.",
  },
];

export default function GridChapters({
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
  const taken = new Set<string>();
  const chapters: Chapter[] = CAMPAIGNS.map(({ name, lede }) => {
    const members = list.filter((c) => !taken.has(c.slug) && cohortsFor(c.slug).includes(name));
    members.forEach((c) => taken.add(c.slug));
    return { key: name, title: name, lede: lede(members.length), badge: name, list: members };
  });
  /* the photobook's own words for its chapters: the intros' last lines, and
     the third chapter's title */
  const rest = list.filter((c) => !taken.has(c.slug));
  chapters.push({ key: "rest", title: `${rest.length} more ways to fix the future`, list: rest });
  const shown = chapters.filter((ch) => ch.list.length);
  const heads = shown.length > 1;

  return (
    <div className="chapters">
      {shown.map((ch) => (
        <section
          key={ch.key}
          className={`chap chap--${KEY[ch.key]}${ch.badge ? " chap--campaign" : ""}`}
          data-cat={KEY[ch.key]}
          aria-label={ch.title}
        >
          {heads && (
            <header className="chap-head">
              {/* a campaign's head is its badge, at a head's size; the rest
                  are named in words, in the same size */}
              <h3 className="chap-title">{ch.badge ? <Badge name={ch.badge} size="l" /> : <MoreSticker />}</h3>
              <p className="chap-lede">
                <span className="chap-count">{ch.list.length}</span>
                {ch.lede && <span>{ch.lede}</span>}
              </p>
            </header>
          )}
          {/* the chapter names the campaign, so its cards carry no logos */}
          <CardGrid
            list={ch.list}
            onSelect={onSelect}
            cols={cols}
            phone={phone}
            shows={shows}
            open={open}
            noLogos
          />
        </section>
      ))}
    </div>
  );
}
