"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./company-side.css";
import type { Company } from "@/lib/types";
import { visualFor, cohortsFor, isLineArt, isPhoto, web } from "@/lib/art-direction";
import { Badges } from "@/components/variants/badge/badge";
import { useDecode } from "@/components/variants/parts/decode";

/* PAGE-V4: THE COMPANY BESIDE THE LIST. The modal's own pieces - its design,
   its type, its data - taken out of the spread and stacked down one column
   in the window's last third, from grid and index alike. Each piece is its
   own component with its own class
   (company-side.css), so they can be moved, spaced, hidden or given another
   version one at a time:

     Title      the name, as the modal sets it
     Tools      Shuffle and the close, words at the name's first line
     Info       the record: country, sector, the rest, a line, the website
     Caption    the campaign, the modal's caption over the plate
     Picture    the plate, the column's full width, whole
     Gymbs      the one-liner, in bold, leading the copy
     Text       the copy
     Nav        Prev, Next and Copy link, under the copy

   THE COLUMN NEVER SCROLLS (sideview-v7 excepted). It is the window's height
   and all of it shows: the plate gives way - it shrinks until the rest fits -
   and when it would be too small to see, it goes up beside the record, the
   copy under both; only a copy longer than that is set a size down. Every
   control is a word in the modal's step (the original .entry-step): no
   boxes, no lines.

   The data is read the way the original modal reads it (EntryLayout in
   archive.tsx), so what one shows the other shows. */

type SideSteps = {
  prev: Company | null;
  next: Company | null;
  onStep: (dir: -1 | 1) => void;
};

const ABBR: Record<string, string> = { "United Kingdom": "UK", "United States": "US" };
const abbr = (c: string) => ABBR[c] ?? c;
const domain = (url: string) =>
  url.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");

/* the copy blocks, as the modal picks them: this edition's, else the old */
function blocksOf(c: Company) {
  const current = [c.current.fix, c.current.outperform, c.current.future].filter((b) => b && b.trim());
  if (current.length) return current;
  return [c.legacy.problem, c.legacy.solution].filter((b) => b && b.trim());
}

/* secondary sectors and themes, split on the ampersand as the modal does */
function metaOf(c: Company) {
  return [
    ...c.subsector.split(/\s*[,&]\s*/).map((x) => x.trim()).filter(Boolean),
    ...(c.themes ?? []).flatMap((t) => t.split(/\s*&\s*/).map((x) => x.trim()).filter(Boolean)),
  ];
}

/* THE NAME ON ONE LINE, ALWAYS.
   At 42 the longer names turned and the plate under them moved down with
   the second line. The name is held on one line and set to whatever size
   that takes - 42 where it fits, down to 24 for the longest of the hundred
   - so the head is one line deep for every company. Measured after layout
   against the head's own width, and again when the window changes. */
function Title({ c, name }: { c: Company; name?: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const text = name ?? c.name;
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.fontSize = "";
      const room = el.clientWidth;
      if (!room) return;
      for (let fs = 42; fs >= 24; fs -= 1) {
        el.style.fontSize = `${fs}px`;
        el.style.lineHeight = `${Math.round(fs * 1.14)}px`;
        if (el.scrollWidth <= room) return;
      }
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [text]);
  return (
    <h2 className="cside-title" ref={ref} id={`cside-name-${c.slug}`} aria-label={c.name}>
      {text}
    </h2>
  );
}

/* TOOLS: the close - an x, just the letter. Shuffle is on the picture. */
function Tools({ onClose, onShuffle, copy }: { onClose: () => void; onShuffle?: () => void; copy?: string }) {
  return (
    <div className="cside-tools">
      {/* sideview-v7: Copy link up by the x */}
      {copy && <CopyLink slug={copy} />}
      <button type="button" className="cside-step cside-close" onClick={onClose} aria-label="Close">
        x
      </button>
    </div>
  );
}

/* ARROWS AT THE MIDDLE (sideview-v4, modal-v3): Prev and Next as
   two arrows at the left and right of the view, half way down - words still,
   no boxes, no lines */
export function Arrows({ steps, className = "" }: { steps: SideSteps; className?: string }) {
  return (
    <>
      <button
        type="button"
        className={`nk-arrow nk-arrow--prev ${className}`}
        onClick={() => steps.onStep(-1)}
        disabled={!steps.prev}
        aria-label={steps.prev ? `Previous: ${steps.prev.name}` : "Previous"}
      >
        ←
      </button>
      <button
        type="button"
        className={`nk-arrow nk-arrow--next ${className}`}
        onClick={() => steps.onStep(1)}
        disabled={!steps.next}
        aria-label={steps.next ? `Next: ${steps.next.name}` : "Next"}
      >
        →
      </button>
    </>
  );
}

function Nav({ steps, slug }: { steps: SideSteps; slug: string }) {
  return (
    <nav className="cside-nav" aria-label="Companies">
      <button
        type="button"
        className="cside-step"
        onClick={() => steps.onStep(-1)}
        disabled={!steps.prev}
        aria-label={steps.prev ? `Previous: ${steps.prev.name}` : "Previous"}
      >
        Prev
      </button>
      <button
        type="button"
        className="cside-step"
        onClick={() => steps.onStep(1)}
        disabled={!steps.next}
        aria-label={steps.next ? `Next: ${steps.next.name}` : "Next"}
      >
        Next
      </button>
      <CopyLink slug={slug} />
    </nav>
  );
}

function Info({ c, campaign = false }: { c: Company; campaign?: boolean }) {
  const meta = metaOf(c);
  return (
    <div className="cside-info">
      <span>{c.countries.map(abbr).join(", ")}</span>
      {/* the sector, and the campaign on the same line after it: "Clean
          Energy, Electro Union" - one fact about the company, one about the
          edition, but they read as the pair they are */}
      {c.sectorLabel && (
        <span>{[c.sectorLabel, ...cohortsFor(c.slug)].join(", ")}</span>
      )}
      {meta.length > 0 && <span>{meta.join(", ")}</span>}
      {/* sideview-v11: the campaign a line of the record, before the website */}
      {campaign && cohortsFor(c.slug).length > 0 && <span className="cside-info-campaign">{cohortsFor(c.slug).join(", ")}</span>}
      {c.website && (
        <a className="cside-site" href={c.website} target="_blank" rel="noopener noreferrer">
          {domain(c.website)}
        </a>
      )}
    </div>
  );
}

function Caption({ c, badges = false }: { c: Company; badges?: boolean }) {
  const campaigns = cohortsFor(c.slug);
  /* the line is held when there is none, so the plate stands on the same
     line for every company; page-v5 sets the campaign as its badge */
  if (badges)
    return (
      <p className="cside-caption cside-caption--badge">
        <Badges slug={c.slug} size="m" />
      </p>
    );
  return <p className="cside-caption">{campaigns.join(", ")}</p>;
}

/* THE PICTURE IS THE SHUFFLE: pressing it draws another company, and over
   it the cursor is the manifest's - the dot with "Shuffle" beside it,
   following the pointer (the original .mod-manifest-draw-cursor). Gone the
   moment the pointer leaves or the page moves. */
function Picture({ c, onClick }: { c: Company; onClick?: () => void }) {
  const src = visualFor(c);
  const kind = !src ? "none" : src.endsWith(".gif") ? "gif" : isLineArt(src) ? "line" : isPhoto(src) ? "photo" : "clip";
  const [mark, setMark] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => {
    if (!mark) return;
    const off = () => setMark(null);
    window.addEventListener("scroll", off, { passive: true, once: true });
    return () => window.removeEventListener("scroll", off);
  }, [mark]);
  return (
    <figure
      className={`cside-picture cside-picture--${kind}${onClick ? " cside-picture--draw" : ""}`}
      onClick={onClick}
      onMouseMove={onClick ? (e) => setMark({ x: e.clientX, y: e.clientY }) : undefined}
      onMouseLeave={() => setMark(null)}
    >
      {/* in the page's body: the column slides in on a transform, and a
          fixed pointer inside it would be placed off the column, away from
          the hand */}
      {mark &&
        createPortal(
          <span className="mod-manifest-draw-cursor cside-draw-cursor" aria-hidden="true" style={{ left: mark.x, top: mark.y }}>
            Shuffle
          </span>,
          document.body
        )}
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={web(src)} alt={c.name} loading="lazy" decoding="async" />
      )}
    </figure>
  );
}

function CopyLink({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (t.current) clearTimeout(t.current); }, []);
  const copy = async () => {
    const url = new URL(window.location.pathname, window.location.origin);
    url.searchParams.set("company", slug);
    try {
      await navigator.clipboard.writeText(url.toString());
    } catch {
      return;
    }
    setCopied(true);
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => setCopied(false), 1600);
  };
  return (
    <button type="button" className="cside-step cside-copy" onClick={copy} aria-live="polite">
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}

function Gymbs({ c }: { c: Company }) {
  return c.statement ? <p className="cside-gymbs">{c.statement}</p> : null;
}

function Text({ c }: { c: Company }) {
  return (
    <div className="cside-text">
      {blocksOf(c).map((b, i) => (
        <p key={i}>{b}</p>
      ))}
    </div>
  );
}

/* whether the list holds the middle of the window */
function useAtList() {
  const [at, setAt] = useState(false);
  useEffect(() => {
    const check = () => {
      const a = document.getElementById("archive");
      if (!a) return;
      const r = a.getBoundingClientRect();
      const mid = window.innerHeight / 2;
      setAt(r.top < mid && r.bottom > mid);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);
  return at;
}
function useWide() {
  const [wide, setWide] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 901px)");
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return wide;
}

export default function CompanySide({
  c,
  steps,
  onClose,
  onShuffle,
  spinning,
  badges = false,
}: {
  c: Company | null;
  steps: SideSteps;
  onClose: () => void;
  onShuffle?: () => void;
  spinning?: boolean;
  /* page-v5: the campaign as its badge */
  badges?: boolean;
}) {
  const wide = useWide();
  const atList = useAtList();
  const want = c;
  const [shown, setShown] = useState<Company | null>(null);
  const [leaving, setLeaving] = useState(false);
  const ref = useRef<HTMLElement>(null);
  /* the roulette's last step comes as it stops: still a step of it */
  const wasSpinning = useRef(false);
  /* FROM ONE COMPANY TO ANOTHER: no fold out and in - the column
     stays, the name decodes in its place and the rest waits white until it
     has landed. Shuffle does not decode: it rolls and lands. */
  const { shown: name, busy } = useDecode(shown?.name ?? "", !!spinning || wasSpinning.current);

  /* EVERYTHING IN THE WINDOW. Laid out afresh for each company and each
     size of window, before it is painted: first as it is, the plate giving
     way to the rest; if the plate is down to less than two fifths of its
     height, it goes up beside the record; and if the copy still runs past
     the foot, it is set a size down, and down, to 11. */
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.removeAttribute("data-tight");
      el.style.removeProperty("--cside-fs");
      /* sideview-v13: the picture keeps one size while the column grows and
         shrinks under the moving mark - laid out at the column's shortest
         (the mark whole over it) and held there; the room the column gains
         as the mark goes is left between the copy and the foot */
      const pic13 = el.querySelector<HTMLElement>(".cside-picture");
      const short13 = !!pic13 && window.matchMedia("(min-width: 901px)").matches;
      /* THE PLATE IS NOT WHAT GIVES WAY (v13, desktop).
         Fitting the whole company into one screen meant the plate was
         squeezed by however long that company's copy ran - small, and a
         different size for every company. It keeps a third of the window
         instead, the same for all of them, and the column scrolls when the
         copy runs past the foot. Nothing is measured, so nothing is set a
         size down either. */
      if (short13 && pic13) {
        el.removeAttribute("data-tight");
        el.style.removeProperty("--cside-fs");
        document.documentElement.classList.add("nk-cside");
        pic13.style.setProperty("height", `${Math.round(window.innerHeight * 0.34)}px`);
        pic13.style.setProperty("flex", "none");
        return;
      }
      if (pic13) {
        pic13.style.removeProperty("height");
        pic13.style.removeProperty("flex");
      }
      /* measured in the column's own place beside the list: the page
         learns of the open company (html.nk-cside) only after this */
      if (short13) document.documentElement.classList.add("nk-cside");
      if (short13) el.style.setProperty("height", "calc(100dvh - var(--masthead-h, 194px))", "important");
      try {
        fitAt();
      } finally {
        if (pic13) {
          const h = pic13.getBoundingClientRect().height;
          if (short13) el.style.removeProperty("height");
          pic13.style.setProperty("height", `${Math.round(h)}px`);
          pic13.style.setProperty("flex", "none");
        }
      }
    };
    const fitAt = () => {
      const pic = el.querySelector<HTMLElement>(".cside-picture");
      const over = () => el.scrollHeight > el.clientHeight + 1;
      if (pic) {
        const whole = pic.getBoundingClientRect().width / 1.5;
        if (pic.getBoundingClientRect().height >= whole * 0.4 && !over()) return;
      } else if (!over()) return;
      /* an attribute, not a class: React owns the class and would drop it */
      el.setAttribute("data-tight", "");
      for (const fs of [15, 14, 13, 12, 11]) {
        el.style.setProperty("--cside-fs", `${fs}px`);
        if (!over()) return;
      }
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [shown]);

  useEffect(() => {
    if (want) {
      /* in on the first company; every company after it in place */
      setShown(want);
      setLeaving(false);
      return;
    }
    if (!shown) return;
    setLeaving(true);
    const t = setTimeout(() => {
      setShown(null);
      setLeaving(false);
    }, 220);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [want]);
  useEffect(() => {
    /* the landing reaches the column a render after the roulette stops
       (the shown company follows the open one), so the mark is held a
       moment past the stop: the landing does not decode as a second run */
    if (spinning) {
      wasSpinning.current = true;
      return;
    }
    const t = setTimeout(() => {
      wasSpinning.current = false;
    }, 300);
    return () => clearTimeout(t);
  }, [spinning]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("nk-cside", !!shown);
    return () => root.classList.remove("nk-cside");
  }, [shown]);

  useEffect(() => {
    ref.current?.scrollTo({ top: 0 });
  }, [shown?.slug]);

  /* A PHONE: the view covers the screen and scrolls on its own; the list
     under it stays where it was */
  useEffect(() => {
    if (!shown || !window.matchMedia("(max-width: 900px)").matches) return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = prev;
    };
  }, [!!shown]);

  if (!shown) return null;
  return (
    <aside
      ref={ref}
      className={`cside cside--v13${leaving ? " cside--out" : ""}${busy ? " cside--decoding" : ""}${spinning ? " cside--spinning" : ""}`}
      aria-labelledby={`cside-name-${shown.slug}`}
    >
      <div className="cside-head">
        {/* the decoded name only while it decodes: on the frame the view
            opens the hook still holds the last name (none), and the
            letters flying in from the card must find the whole name to
            land on */}
        <Title c={shown} name={busy ? name : undefined} />
        <Tools onClose={onClose} onShuffle={onShuffle} copy={undefined} />
      </div>
      <div className="cside-top">
        <div className="cside-facts">
          <Info c={shown} campaign={false} />
          <Caption c={shown} badges={badges} />
        </div>
        <Picture c={shown} onClick={onShuffle} />
      </div>
      <Gymbs c={shown} />
      <Text c={shown} />
      <Nav steps={steps} slug={shown.slug} />
      {/* sideview-v4: the steps are arrows at the column's middle */}

    </aside>
  );
}
