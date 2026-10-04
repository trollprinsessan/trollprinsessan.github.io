"use client";

/* the grids the cards ride on: listview-v2's and listview-v6's */
import "@/components/variants/listview-v2/grid.css";
import "@/components/variants/listview-v6/grid.css";
import "./cards.css";
import type { Company } from "@/lib/types";
import {
  visualFor,
  cohortsFor,
  isLineArt,
  isClipart,
  isPhoto,
  ELECTRO_UNION,
  PROMPT_WHAT_MATTERS,
  cardSrc,
} from "@/lib/art-direction";
import { countryName, iso3List } from "@/lib/countries";
import { useToggle, useVersion } from "@/components/settings/registry";
import { motifStyle } from "@/components/variants/listview-v2/grid";
import { Stamps } from "@/components/variants/badge/badge";
import { growFrom } from "./grow";
import { flyFrom } from "./fly";

/* THE CARD AND ITS TAGS, CHOSEN ON THEIR OWN. The list's version decides
   how the list is laid out and behaves; the card's look is cardstyle-v#, its
   tags tagstyle-v#, and the logos on it a switch - so any card goes in any
   list, with any tags, on any page:

     cardstyle-v1  the original card, its markup and its classes
     cardstyle-v2  the book's index entry (listview-v2's card)
     cardstyle-v3  a light grey ground, square corners, the name in bold
     cardstyle-v4  the tags in a row straight under the picture
     cardstyle-v5  lying down: the picture left, the words right
     cardstyle-v6  v3's name and line, the picture on no ground and no radius
     cardstyle-v7  the name over the line, the rest under the picture
     cardstyle-v8  white with a shadow; a press grows the card into the modal

     tagstyle-v1  the original boxed tags (sector and campaign)
     tagstyle-v2  black, white type
     tagstyle-v3  filled in the campaign's colour
     tagstyle-v4  hashtags in the campaign's colour
     tagstyle-v5  black, white type, fully round
     tagstyle-v6  round, each kind its own: sector, campaign, country

   Two tags a card: the sector, and the campaign - Electro Union or Prompt
   What Matters. The rest of this year's list, the photobook's third chapter
   ("56 more ways"), is not a category and gets no campaign tag. The
   original tags (tagstyle-v1) keep the original rule: the sector, and a
   campaign only where there is one. */

/* this year's companies in neither campaign: the photobook's third chapter */
const MORE = 100 - ELECTRO_UNION.length - PROMPT_WHAT_MATTERS.length;
type Camp = { key: "eu" | "pwm" | "more"; label: string; hash: string };
function campaignOf(c: Company): Camp | null {
  const cs = cohortsFor(c.slug);
  if (cs.includes("Electro Union")) return { key: "eu", label: "Electro Union", hash: "#electrounion" };
  if (cs.includes("Prompt What Matters")) return { key: "pwm", label: "Prompt What Matters", hash: "#pwm" };
  if (c.years.includes(2026)) return { key: "more", label: `${MORE} more ways`, hash: `#${MORE}moreways` };
  return null;
}

export function Tags({ c }: { c: Company }) {
  const v = useVersion("tagstyle");
  const geo = useToggle("countrytag");
  if (v === "v1") {
    /* the original: its classes, its two kinds of tag */
    const tags = [c.sectorLabel, ...cohortsFor(c.slug)].filter(Boolean);
    return tags.length ? (
      <span className="card-tags">
        {tags.map((t) => (
          <span key={t} className="card-tag">
            {t}
          </span>
        ))}
      </span>
    ) : null;
  }
  /* "56 more ways" is not a category: no tag for it */
  const camp = campaignOf(c);
  const tag = camp && camp.key !== "more" ? camp : null;
  return (
    <span className={`nkt nkt--${v}`}>
      {c.sectorLabel && <span className="nkt-tag nkt-tag--sector">{c.sectorLabel}</span>}
      {tag && <span className={`nkt-tag nkt-tag--${tag.key}`}>{v === "v4" ? tag.hash : tag.label}</span>}
      {/* the country a tag too (switch countrytag) */}
      {geo && c.countries.length > 0 && (
        <span className="nkt-tag nkt-tag--geo">{v === "v4" ? `#${c.countries[0].replace(/\s+/g, "").toLowerCase()}` : c.countries.join(", ")}</span>
      )}
    </span>
  );
}

/* the picture, cut to its motif as listview-v2 cuts it (photographs fill) */
function Motif({ c, cls }: { c: Company; cls: string }) {
  const visual = visualFor(c);
  const m = visual ? motifStyle(visual) : null;
  if (!visual || !m) return null;
  return (
    <span className={`${cls}-motif`} style={m.box}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={`${cls}-thumb`} src={cardSrc(visual)} alt={c.name} loading="lazy" style={m.img} />
    </span>
  );
}

/* v1: the original card, as the original Grid draws it */
function OriginalCard({ c, logos, onSelect }: { c: Company; logos: boolean; onSelect: () => void }) {
  const v = visualFor(c);
  const code = iso3List(c.countries);
  const kind = !v
    ? ""
    : isLineArt(v)
      ? " card-thumb--line"
      : v.endsWith(".gif")
        ? " card-thumb--gif"
        : isClipart(v)
          ? " card-thumb--clip"
          : isPhoto(v)
            ? " card-thumb--photo"
            : "";
  return (
    <button className="card nkc" data-camp={campaignOf(c)?.key} data-slug={c.slug} onClick={onSelect}>
      <div className="card-media nkc-media">
        {logos && <Stamps slug={c.slug} />}
        {v ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={`card-thumb${kind}`} src={v} alt={c.name} loading="lazy" />
        ) : (
          <div className="card-thumb--empty" />
        )}
      </div>
      <figcaption className="card-caption">
        <span className="card-head">{code ? `${c.name}, ${code}` : c.name}</span>
        {c.statement && <span className="card-statement">{c.statement}</span>}
        <Tags c={c} />
      </figcaption>
    </button>
  );
}

/* v2-v4: the book's entry and its two variations, on listview-v2's grid */
function EntryCard({
  c,
  logos,
  open,
  onSelect,
  coded = false,
  footed = false,
}: {
  c: Company;
  logos: boolean;
  open: boolean;
  onSelect: (el: HTMLElement) => void;
  /* cardstyle-v3b: the country's code after the name, over the picture */
  coded?: boolean;
  /* cardstyle-v10: two fixed rows at the foot - the sector, then the campaign
     with the country's two-letter code at the right */
  footed?: boolean;
}) {
  const code = iso3List(c.countries);
  return (
    <button
      type="button"
      className={`entry2 nkc${open ? " entry2--open" : ""}`}
      data-camp={campaignOf(c)?.key} data-slug={c.slug}
      aria-current={open ? "true" : undefined}
      onClick={(e) => onSelect(e.currentTarget)}
    >
      <span className="entry2-media entry2-media--stamped">
        {logos && <Stamps slug={c.slug} />}
        <Motif c={c} cls="entry2" />
      </span>
      <span className="entry2-text">
        <span className="entry2-name">
          <span className="entry2-nametext">{c.name}</span>
          {coded && code && <span className="entry2-code">, {code}</span>}
        </span>
        {c.statement && <span className="entry2-gymbs">{c.statement}</span>}
      </span>
      {footed ? (
        <Foot c={c} />
      ) : (
        <span className="entry2-sections">
          <Tags c={c} />
          {code && <span className="nkc-country">{code}</span>}
        </span>
      )}
    </button>
  );
}

/* cardstyle-v10's foot: two rows - the sector over, the country's code and the
   campaign under - each tag in the chosen tag style (tagstyle-v#) */
function Foot({ c }: { c: Company }) {
  const v = useVersion("tagstyle");
  const camp = cohortsFor(c.slug)[0];
  const campKey = camp === "Electro Union" ? "eu" : camp === "Prompt What Matters" ? "pwm" : "";
  /* the original tags (v1) keep the original class; the others the set's */
  const cls = (kind: string) =>
    v === "v1" ? `card-tag nkc-foot-tag nkc-foot-tag--${kind}` : `nkt-tag nkt-tag--${kind} nkc-foot-tag nkc-foot-tag--${kind}`;
  const word = (text: string, kind: string) =>
    v === "v4" ? `#${text.replace(/\s+/g, "").replace(/&/g, "and").toLowerCase()}` : text;
  return (
    <span className={`entry2-sections nkc-foot${v === "v1" ? "" : ` nkt nkt--${v}`}`}>
      <span className="nkc-foot-row">
        {c.sectorLabel && <span className={cls("sector")}>{word(c.sectorLabel, "sector")}</span>}
      </span>
      <span className="nkc-foot-row">
        <span className={cls("geo")}>{word(c.countries.map(countryName).join(", "), "geo")}</span>
        {camp && <span className={`${cls(campKey || "camp")} nkc-foot-tag--camp`}>{word(camp, campKey)}</span>}
      </span>
    </span>
  );
}

/* v5: lying down, listview-v6's card */
function LyingCard({
  c,
  logos,
  open,
  onSelect,
}: {
  c: Company;
  logos: boolean;
  open: boolean;
  onSelect: () => void;
}) {
  const code = iso3List(c.countries);
  return (
    <button
      type="button"
      className={`e4 e6 nkc${open ? " e4--open" : ""}`}
      data-camp={campaignOf(c)?.key} data-slug={c.slug}
      aria-current={open ? "true" : undefined}
      onClick={onSelect}
    >
      <span className="e4-media entry2-media--stamped">
        {logos && <Stamps slug={c.slug} />}
        <Motif c={c} cls="e4" />
      </span>
      <span className="e6-words">
        <span className="e4-text">
          <span className="e4-name">{c.name}</span>
          {c.statement && <span className="e4-gymbs">{c.statement}</span>}
        </span>
        <span className="e4-sections">
          <Tags c={c} />
          {code && <span className="nkc-country">{code}</span>}
        </span>
      </span>
    </button>
  );
}

const PER_ROW: Record<number, number> = { 16: 6, 12: 5, 8: 4, 6: 3 };

export default function CardGrid({
  list,
  onSelect,
  cols,
  phone,
  shows,
  open = null,
  noLogos = false,
}: {
  list: Company[];
  onSelect: (c: Company) => void;
  cols: number;
  phone: number;
  shows: string;
  open?: string | null;
  /* the category view: the chapter says the campaign, so the cards do not */
  noLogos?: boolean;
}) {
  const cardstyle = useVersion("cardstyle");
  const fly = useToggle("flyin");
  const logos = useToggle("cardlogos") && !noLogos;
  const tags = useVersion("tagstyle");

  if (cardstyle === "v1") {
    return (
      <div
        className={`grid grid--${shows} nkc-grid nkc-grid--v1 nkc-tags--${tags}`}
        style={{ ["--gridcols" as string]: cols, ["--gridcols-phone" as string]: phone }}
      >
        {list.map((c) => (
          <OriginalCard key={c.slug} c={c} logos={logos} onSelect={() => onSelect(c)} />
        ))}
      </div>
    );
  }
  if (cardstyle === "v5") {
    return (
      <div
        className={`grid grid--v6 grid--v6-${shows}${open ? " grid--v6-open" : ""} nkc-grid nkc-grid--v5`}
        style={{
          ["--gridcols" as string]: PER_ROW[cols] ?? 3,
          ["--gridcols-phone" as string]: phone > 3 ? 2 : 1,
        }}
      >
        {list.map((c) => (
          <LyingCard key={c.slug} c={c} logos={logos} open={open === c.slug} onSelect={() => onSelect(c)} />
        ))}
      </div>
    );
  }
  return (
    <div
      className={`grid grid--v2 grid--v2-${shows}${open ? " grid--side" : ""} nkc-grid nkc-grid--${
        cardstyle === "v3b" ? "v3 nkc-grid--v3b" : cardstyle === "v9" || cardstyle === "v10" ? `poster nkc-grid--${cardstyle}` : cardstyle === "v11" ? "poster nkc-grid--v10 nkc-grid--v11" : cardstyle
      }`}
      style={{ ["--gridcols" as string]: cols, ["--gridcols-phone" as string]: phone }}
    >
      {list.map((c) => (
        <EntryCard
          key={c.slug}
          c={c}
          logos={logos}
          open={open === c.slug}
          coded={cardstyle === "v3b"}
          footed={cardstyle === "v10"}
          /* cardstyle-v8: the card grows into the modal; cardstyle-v3 and -v3b: its
             parts fly to their places in it */
          onSelect={(el) =>
            cardstyle === "v8"
              ? growFrom(el, () => onSelect(c))
              : fly && (cardstyle === "v3" || cardstyle === "v3b" || cardstyle === "v9" || cardstyle === "v10" || cardstyle === "v11")
                ? flyFrom(el, () => onSelect(c))
                : onSelect(c)
          }
        />
      ))}
    </div>
  );
}
