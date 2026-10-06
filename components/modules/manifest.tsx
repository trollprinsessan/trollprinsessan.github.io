"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { web } from "@/lib/art-direction";
import { NOMINATION_PARTNERS } from "./partners";
import ElectroMark from "./electro-mark";
import { iso3List } from "@/lib/countries";
import { openCompany } from "@/lib/company-link";
import { flyFrom } from "@/components/variants/parts/fly";
import { SHUFFLE_GAPS } from "@/components/variants/parts/shuffle";

// Structure after the foot of u-p.co: a small numbered index on the left, the
// panel's copy on the right, and a full-bleed horizontal image strip beneath.
// Their type is unica77 400 at 9.8/12.6/14px — deliberately tiny, so the
// pictures carry the section. Sizes here follow that.

// Copy follows the 2026 tone brief, which moves the section off the framing
// that was here. Three changes drive every line below:
//   - not "a list that gives hope" but 100 companies built to outperform the
//     systems they replace — impact as market advantage, not consolation.
//     Said plainly: the site's own register is short, warm and unabstracted
//     ("Glad you asked!", "Pretty cool, right?"), so no "resilience", no
//     "long-term value creation", no closing of loops
//   - solutions first, not startups or people; no awards or trophies language
//   - Norrsken humble about itself, never about the companies
// "100 ways to fix the future" is kept as the tagline.
// *asterisks* mark a true italic cut — the one emphasis device, as on Climax.
// Four panels, in the order the story wants to be read: what it is, how it is
// made, then the two ideas driving this edition. The old "Since 2022" panel is
// gone (history was the weakest beat) and the standalone metrics panel is
// folded into "How they're picked", where the numbers are actually the point.
const PANELS = [
  {
    key: "About",
    // the photobook's words, page 2 (the book is the reference for every text)
    body: [
      "The Norrsken100 highlights the hundred most promising early-stage companies solving hard problems at scale, by outperforming the legacy models that created them. They shape what comes next.",
      "They are 100 ways to fix the future.",
    ],
  },
  {
    key: "The Process",
    // stacked facts at body size, the way Climax lists edition, publisher,
    // price and dimensions, not a dashboard of oversized numbers. Figure in
    // roman, descriptor in italic: Climax's own split.
    // One funnel, one edition, read top to bottom: who nominates, how much
    // comes in, what comes out. The old set mixed per-edition figures (1,400
    // nominations, 78 partners) with all-time ones (352 companies, 41
    // countries) and marked neither, so the four numbers did not add up to
    // anything a reader could hold.
    body: [
      // the photobook's, page 4
      "Every edition starts with nominations. {{80+}} venture funds put companies forward. This year they sent us {{1400+}}. Our team works through every one and measures it against the criteria.",
      "So what are we looking at? Well, positive global impact to start with. Intrinsic to the business model and non-negotiable. Scalable technology aimed at a global problem. Have a product in the market, at least an MVP. Funding from seed or Series A, up to Series B. Measurable progress against the UN Sustainable Development Goals. That cuts the field. After that, our team selects the top {{100}}.",
      "Nothing here is ranked. The order is alphabetical.",
    ],
    partners: true,
  },
  // These two are the themes themselves, not Norrsken's activity around them:
  // why the theme matters, what it is, and how it gets done - rather than
  // what we did. The photobook's own chapter intros, whole.
  {
    key: "Electro Union",
    // this panel swaps the vortex for the campaign's own mark
    image: { file: "Electro-union-logo.svg", ground: "plain", alt: "" },
    /* the photobook's chapter intro, page 7, cut to three fifths: the two
       edges folded into one paragraph, the China comparison and the solar
       park gone. The count is the book's chapter, which is what the tab
       filters to. */
    body: [
      "Electro Union is the case for Europe as the world's first electro-continent: a majority of its economy running on clean electricity it makes itself. Around 90% of Europe's economy could run on electricity using technology that already exists. Less than a quarter of it does.",
      "That gap leaves Europe exposed, in its third energy price shock in four years, running on fuel it does not own, shipped through waters it does not control. And it costs: European industry pays roughly twice what American industry pays for electricity, so every factory, startup and data centre starts behind.",
      "Solar has fallen more than ninety percent in a decade. Unlike fuel, renewables get cheaper with every unit built. Fuel is paid for every month, forever, at a price set somewhere else. Grids, batteries and machines are bought once. After that, the energy is yours.",
      "The European Commission unveiled an Electrification Action Plan in July 2026, with the goal of making Europe the world's first electro-continent, doubling the current share from 23% to 46% by 2040.",
      "In here you'll find the 26 builders, making Europe the Electro Union.",
    ],
  },
  {
    key: "Prompt What Matters",
    // this panel turns the section pink; the others leave it white
    ground: "pink",
    // the photobook's chapter intro, page 9, whole
    body: [
      "Prompt What Matters starts from an uncomfortable observation. This generation has been handed something close to godlike power, and we are mostly using it to make slop and sales agents.",
      "In 2025, AI startups took more than two hundred billion dollars in venture funding, more than half of every venture dollar on earth. Almost all of it is chasing the same playbook: productivity, convenience, three more co-pilots. Meanwhile the hard things are suddenly solvable.",
      "AI can optimise an entire energy system. It can find a drug candidate and decode biology at a speed that was science fiction ten years ago. Imagine a hundred million virtual health workers arriving in systems that cannot hire fast enough.",
      "History says most of today's AI companies will not survive the decade. The ones that do will be the ones that solved something that matters. The world does not need another sales agent. It needs *bigger prompts.*",
    ],
  },
];

// One gif holds across every panel — it does not swap when tabs change.
const MANIFEST_GIF = {
  file: "100-ways-to-fix-the-future-vortex.gif",
  // Measured, not assumed: this file is 99.3% alpha:0. There is no ground to
  // dissolve, so it must not be blended (see --alpha in globals.css).
  ground: "alpha",
  alt: "", // decorative: the sentence it echoes is now set in type above
};

/* Counts up once, when the figure first comes into view — the same behaviour
   as the masthead numeral. Honours prefers-reduced-motion by landing on the
   final value immediately. */
function Count({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(to);
      return;
    }
    let raf = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min((now - start) / 1400, 1);
          setN(Math.round((1 - Math.pow(1 - t, 3)) * to));   // ease out
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.6 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to]);

  return (
    <span ref={ref} className="mod-manifest-num">
      {n.toLocaleString("en-GB")}
      {suffix}
    </span>
  );
}

type Panel = (typeof PANELS)[number];

/* One paragraph renderer for the essay and the notes: {{n}} counts up, [x](y)
   links, *x* is the italic cut, \n is a line turn inside the paragraph. */
/* THE PANELS' SIGNS (manifest-v2 and later): a question mark for About,
   a funnel for The Process - 1,400 in, 100 out - a croissant for Electro
   Union, a prompt for Prompt What Matters */
function TabIcon({ k }: { k: string }) {
  return <span className="nk-tabicon" aria-hidden="true">{"\u25CF"}</span>;
}

/* a paragraph's words as they read: the counts as their numbers, the
   links as their labels, the emphasis as plain words */
function plain(para: string) {
  return para
    .replace(/\{\{([\d,]+)(\D*)\}\}/g, (_, n: string, suffix: string) => `${Number(n.replace(/,/g, "")).toLocaleString("en-GB")}${suffix}`)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\n/g, " ");
}

function Body({
  panel,
  partnersOpen,
  onPartners,
}: {
  panel: Panel;
  partnersOpen: boolean;
  onPartners: () => void;
}) {
  return (
    <>
      {/* THE FOLD. While the roster is open the copy folds away above the
          label and the roster folds out under it - both are heights moving
          on one clock, so the label slides from under the copy to the head
          of the column and the names come out beneath it. Nothing fades. */}
      <div className={`mod-manifest-copy-fold${partnersOpen ? " mod-manifest-copy-fold--away" : ""}`}>
      <div className="mod-manifest-copy-clip">
      {panel.body.map((para, pi) => (
        <Fragment key={para}>
          <p>
            {para.split("\n").map((line, li) => (
              <span key={line}>
                {li > 0 && <br />}
                {line
                  .split(/(\{\{[^}]+\}\}|\[[^\]]+\]\([^)]+\)|\*[^*]+\*)/)
                  .map((bit, j) => {
                    const num = bit.match(/^\{\{([\d,]+)(\D*)\}\}$/);
                    if (num) {
                      return (
                        <Count
                          key={j}
                          to={Number(num[1].replace(/,/g, ""))}
                          suffix={num[2]}
                        />
                      );
                    }
                    const link = bit.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
                    if (link) {
                      return (
                        <a
                          key={j}
                          className="mod-manifest-inline-link"
                          href={link[2]}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {link[1]}
                        </a>
                      );
                    }
                    return bit.startsWith("*") && bit.endsWith("*") ? (
                      <em key={j}>{bit.slice(1, -1)}</em>
                    ) : (
                      bit
                    );
                  })}
              </span>
            ))}
          </p>
        </Fragment>
      ))}
      </div>
      </div>
      {/* last, under the copy it belongs to */}
      {"partners" in panel && panel.partners && (
        <div className={`mod-manifest-reveal${partnersOpen ? " mod-manifest-reveal--open" : ""}`}>
          <button
            type="button"
            className="mod-manifest-reveal-summary"
            aria-expanded={partnersOpen}
            aria-controls="nomination-partners"
            onClick={onPartners}
          >
            {/* the section's own title art, at the copy's line height -
                the words are the picture */}
            {/* manifest-v2 and later: the same words set in the page's
                bold, as wide as the title art */}
            <span className="nk-np">Nomination partners</span>
          </button>
          {/* the roster hangs from the label, across the section: it is
              placed off the section's tracks but takes its top from where
              it stands in the flow - directly under the button - so it
              follows the label as the copy folds */}
          <div className="mod-manifest-partners-fold" aria-hidden={!partnersOpen}>
            <div className="mod-manifest-partners-clip">
              <ul className="mod-manifest-partners" id="nomination-partners">
                {NOMINATION_PARTNERS.map((name, i) => (
                  /* dealt a ROW at a time, three names to a row, 30ms apart:
                     the roulette's flicker, run fast, with nothing fading */
                  <li key={name} style={{ ["--d" as string]: `${Math.floor(i / 3) * 30}ms` }}>
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      {"link" in panel && panel.link && (
        <p className="mod-manifest-link">
          <a
            href={(panel.link as { href: string; label: string }).href}
            target="_blank"
            rel="noreferrer"
          >
            {(panel.link as { href: string; label: string }).label}
          </a>
        </p>
      )}
    </>
  );
}

/* THE ROULETTE OPENS ON A PICKED HAND.
   The draw is random, but the first companies it shows are chosen: the
   plate the page opens on and the ten the first presses land on, in this
   order. After them the wheel is random again, as it was. Slugs, so a name
   can change without breaking the order; a slug that is not in the draw
   (another edition, a company gone) is skipped. */
const OPENING = [
  "isometric",
  "mialgae",
  "space-forge",
  "amatera",
  "sava-technology",
  "mazama",
  "planted",
  "netzeronitrogen",
  "fleetzero",
  "root",
  "bound4blue",
];

type Draw = {
  slug: string;
  name: string;
  statement: string;
  geo: string;
  sector: string;
  visual: string;
};

export default function Manifest({ draw = [] }: { draw?: Draw[] }) {
  /* manifest-v2: the Shuffle is exactly everything right of the
     copy on a desktop - from its right edge, a gutter on, whatever lies
     there, bar the drawn company's name, which opens it - and exactly the
     lower part on a phone,
     from the draw's top down. The rest is the copy's, with the ordinary
     pointer. v1 is the original: the whole section, bar the type and the
     links. */
  const inDraw = (e: React.MouseEvent) => {
    const t = e.target as Element | null;
    if (t?.closest?.(".mod-manifest-draw-open")) return false;
    /* and it ends just above the mark: where the norrsken100 rides the foot
       of the window over the section, the list's mark is not the draw */
    const mast = document.querySelector(".archive-masthead")?.getBoundingClientRect();
    if (mast && e.clientY >= mast.top) return false;
    const box = e.currentTarget as HTMLElement;
    const r = box.getBoundingClientRect();
    /* a desktop: from the copy's right edge, a gutter on - the plate often
       runs further left than the middle, and the draw is everything the
       copy is not */
    if (window.matchMedia("(hover: hover)").matches) {
      const copy = box.querySelector(".mod-manifest-body");
      const gutter = parseFloat(getComputedStyle(box).getPropertyValue("--gutter")) || 16;
      const from = copy ? copy.getBoundingClientRect().right + gutter : r.left + r.width / 2;
      return e.clientX >= from;
    }
    /* a phone stacks the section: the tabs, the copy, then the plate - the
       lower part starts where the plate does (or under the copy, if there
       is no plate up) */
    const plate = box.querySelector(".mod-manifest-draw-plate");
    const copy = box.querySelector(".mod-manifest-body");
    const from = plate
      ? plate.getBoundingClientRect().top
      : copy
        ? copy.getBoundingClientRect().bottom
        : r.top + r.height / 2;
    return e.clientY >= from;
  };
  const [active, setActive] = useState(0);
  const panel = PANELS[active];

  /* THE COMPRESSED SHUFFLE
     One company, in the three fields that carry it: name, statement, place.
     After architecturecuratingpractice.com, where the nouns inside the running
     sentence are the buttons - the content swaps in place, with no navigation
     and nothing moving around it. Drawn on the client only: a random index
     during render would not match the static export's HTML. */
  const [drawn, setDrawn] = useState(0);
  /* the mark follows the pointer instead of sitting in a circle: anywhere on
     the section that is not the contents or a link is a draw, and the word
     rides the cursor to say so */
  const [mark, setMark] = useState<{ x: number; y: number } | null>(null);
  /* manifest-v2: the word goes the moment the page moves. It is fixed to the
     window, and a wheel turned with the hand still carried the section away
     from under it without a leave - the word stayed, over the list and the
     company's x */
  useEffect(() => {
    if ((!mark)) return;
    const off = () => setMark(null);
    window.addEventListener("scroll", off, { passive: true, once: true });
    return () => window.removeEventListener("scroll", off);
  }, [mark]);
  /* where the picked hand has got to; past its end the wheel is random */
  const hand = useRef(0);
  const handStops = useMemo(
    () => OPENING.map((slug) => draw.findIndex((d) => d.slug === slug)).filter((i) => i >= 0),
    [draw],
  );
  useEffect(() => {
    if (!draw.length) return;
    if (handStops.length) {
      hand.current = 1;
      setDrawn(handStops[0]);
      return;
    }
    setDrawn(Math.floor(Math.random() * draw.length));
  }, [draw.length, handStops]);
  const one = draw[drawn];
  /* a roulette, not a cut: the plate runs through a handful of companies,
     each held a little longer than the last, before it lands. The same
     deceleration as the spread's spin. The stops are chosen up front so their
     pictures can be fetched before the wheel turns - a lazy image swapped in
     at 30ms would show as a hole. */
  const spinTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => spinTimers.current.forEach(clearTimeout), []);
  const [spinning, setSpinning] = useState(false);
  /* the nomination partners: one name a line, in columns, standing in for the
     plate while they are open. Closed again when the panel changes. */
  const [partnersOpen, setPartnersOpen] = useState(false);
  useEffect(() => setPartnersOpen(false), [active]);
  /* once the wheel has landed the caption is written in three beats: the
     name, then the comma, then the country. Nothing while it turns. The
     statement is off the plate; the label a screen reader hears carries it. */
  const [beat, setBeat] = useState(0);
  const line1 = one ? `${one.name}, ${one.geo}` : "";
  const line2 = one ? one.statement : "";
  useEffect(() => {
    setBeat(0);
    if (spinning || !one) return;
    setBeat(1);
    const a = setTimeout(() => setBeat(2), 220);
    const b = setTimeout(() => setBeat(3), 440);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [spinning, one?.slug]);
  const written = !one || spinning || beat === 0 ? "" : beat === 1 ? one.name : beat === 2 ? `${one.name},` : `${one.name}, ${one.geo}`;
  const another = () => {
    if (draw.length < 2) return;
    spinTimers.current.forEach(clearTimeout);
    spinTimers.current = [];
    setSpinning(true);
    /* the variants shuffle with the list's cadence, so the shuffle looks the
       same wherever it is pressed */
    const gaps = SHUFFLE_GAPS;
    const stops: number[] = [];
    let last = drawn;
    for (let i = 0; i < gaps.length; i++) {
      let n = last;
      while (n === last) n = Math.floor(Math.random() * draw.length);
      stops.push(n);
      last = n;
    }
    /* the wheel turns through whatever it likes; where it LANDS is the next
       company of the picked hand, while the hand lasts */
    const next = handStops[hand.current];
    if (next !== undefined && next !== drawn) {
      stops[stops.length - 1] = next;
      hand.current += 1;
    }
    stops.forEach((n) => {
      const src = draw[n]?.visual;
      if (src) new Image().src = web(src);
    });
    let elapsed = 0;
    gaps.forEach((gap, i) => {
      elapsed += gap;
      spinTimers.current.push(
        setTimeout(() => {
          setDrawn(stops[i]);
          if (i === gaps.length - 1) setSpinning(false);
        }, elapsed),
      );
    });
  };
  const anotherRef = useRef(another);
  anotherRef.current = another;

  const sectionRef = useRef<HTMLElement>(null);

  /* THE WHEEL TURNS BY ITSELF.
     Left alone, the draw takes another company every ten seconds, so the
     section is never still for long. Any press - a tab, the plate, the
     section itself - puts the clock back to the start, and it stops while
     the roster is open, while a spin is still running, and whenever the
     page is not the one being looked at. */
  useEffect(() => {
    if (partnersOpen || spinning || draw.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      anotherRef.current();
    }, 10000);
    return () => clearInterval(t);
  }, [partnersOpen, spinning, draw.length, drawn]);

  /* The ground belongs to the page, not to this section, so the class goes on
     <html>: it redefines --bg, and body plus every surface painted with it
     turn together. Cleared on unmount so the colour cannot outlive the tab. */
  // artwork is per panel, falling back to the vortex that holds everywhere else
  const art = panel.image ?? MANIFEST_GIF;
  /* the Electro Union panel carries its own artwork: the mark draws itself
     where the plate would be, and there is no wheel to spin */
  const marked = art.ground === "plain";
  /* MAKE EUROPE. A shower of croissants over the mark whenever the panel is
     opened - falls once and is gone, not a loop. The drops are fixed, not
     random, so the shower is the same every time and can be tuned by eye:
     x across the section, size in px, the delay before it enters, how long
     it takes to fall, and how far it turns on the way down. */
  const CROISSANTS = [
    { x: 6, delay: 0, fall: 3.0, spin: 220 },
    { x: 14, delay: 1.6, fall: 3.4, spin: -180 },
    { x: 21, delay: 0.42, fall: 3.6, spin: -160 },
    { x: 29, delay: 1.9, fall: 2.8, spin: 240 },
    { x: 36, delay: 0.14, fall: 2.6, spin: 300 },
    { x: 44, delay: 0.86, fall: 3.2, spin: -240 },
    { x: 50, delay: 2.4, fall: 3.7, spin: 160 },
    { x: 57, delay: 0.28, fall: 2.9, spin: 180 },
    { x: 64, delay: 1.15, fall: 3.9, spin: -120 },
    { x: 71, delay: 0.6, fall: 3.1, spin: 260 },
    { x: 78, delay: 2.1, fall: 3.3, spin: -260 },
    { x: 85, delay: 1.4, fall: 2.7, spin: -320 },
    { x: 91, delay: 0.2, fall: 3.5, spin: 140 },
    { x: 97, delay: 0.98, fall: 3.0, spin: -200 },
  ];
  const ground = panel.ground;
  useEffect(() => {
    const root = document.documentElement;
    /* the panel only asks for its ground; the runtime decides the page's
       (settings/runtime.tsx), since the list's choice outranks the panel's */
    if (ground) root.dataset.nkPanelGround = ground;
    else delete root.dataset.nkPanelGround;
    window.dispatchEvent(new Event("nk:ground"));
    return () => {
      delete root.dataset.nkPanelGround;
      window.dispatchEvent(new Event("nk:ground"));
    };
  }, [ground]);

  return (
    <section className="mod-manifest" ref={sectionRef}>
      {/* Print-distortion filter, lifted verbatim off cheap.urls.loan: a high
          frequency turbulence used as a displacement map, which roughs the
          edges the way a bad print or a photocopy does. Their values exactly,
          scale 2 on desktop and 1.5 on mobile. Applied to the Electro Union
          mark only, via .mod-manifest-gifline--plain. */}
      <svg className="mod-manifest-filters" aria-hidden="true" focusable="false">
        {/* the displacement was at the reference's own scale of 2, which on
            the mark's hairlines read as a bleed rather than as print grain */}
        <filter id="print-distort">
          <feTurbulence baseFrequency="1 1" numOctaves={1} />
          <feDisplacementMap in="SourceGraphic" scale="0.8" />
        </filter>
        <filter id="print-distort-mobile">
          <feTurbulence baseFrequency="1 1" numOctaves={1} />
          <feDisplacementMap in="SourceGraphic" scale="0.6" />
        </filter>
      </svg>

      {/* Stacked: the contents heading the type, the copy under them, and the
          plate below taking whatever they leave - the
          current one underlined, and the number again in the foot. */}
      <div
        className="mod-manifest-top"
        /* which panel is up, for the stylesheet: a phone drops the draw on
           The Process, and the class that marks the open roster is only
           there once it is open */
        data-panel={panel.key}
        onMouseMove={(e) => {
          const on = !marked && inDraw(e);
          setMark(on ? { x: e.clientX, y: e.clientY } : null);
          /* v2: the ordinary pointer off the draw (manifest-v2/manifest.css) */
          e.currentTarget.toggleAttribute("data-off-draw", !on);
        }}
        onMouseLeave={() => setMark(null)}
        onClick={(e) => {
          if (!marked && inDraw(e)) another();
        }}
      >
        {/* over the mark, under nothing: the shower is keyed on the panel so
            it falls again on every press of Electro Union */}
        {marked && (
          <div className="mod-manifest-rain" key={panel.key} aria-hidden="true">
            {CROISSANTS.map((c, i) => (
              <img
                key={i}
                src="/manifest-images/croissant.webp"
                alt=""
                style={{
                  left: `${c.x}%`,
                  /* manifest-v2 and later: the shower starts sooner */
                  animationDelay: `${c.delay * 0.35}s`,
                  animationDuration: `${c.fall}s`,
                  ["--spin" as string]: `${c.spin}deg`,
                }}
              />
            ))}
          </div>
        )}

        <div className="mod-manifest-verso">
          <figure
            key={art.file}
            className={`mod-manifest-gifline mod-manifest-gifline--${art.ground}`}
          >
            {art.file.endsWith(".svg") ? (
              <ElectroMark src={`/manifest-images/${art.file}`} />
            ) : (art === MANIFEST_GIF) ? null : (
              /* the vortex is parked (globals.css: its leaf is not drawn), so
                 past the original it is not fetched either */
              <img src={`/manifest-images/${art.file}`} alt={art.alt ?? ""} />
            )}
          </figure>
        </div>

        <div className="mod-manifest-recto">
          <blockquote
            className={`mod-manifest-body${partnersOpen ? " mod-manifest-body--partners" : ""}`}
            key={panel.key}
          >
            <Body
              panel={panel}
              partnersOpen={partnersOpen}
              onPartners={() => setPartnersOpen((o) => !o)}
            />
          </blockquote>

          {/* every panel's copy, set unseen in the copy's own place, so the
              layout (settings/runtime.tsx) can choose one type size that
              fits them all - the panels share it */}
          {PANELS.map((p) => (
              <div key={p.key} className="mod-manifest-body nk-measure" aria-hidden="true">
                <div className="mod-manifest-copy-clip">
                  {p.body.map((para) => (
                    <p key={para}>{plain(para)}</p>
                  ))}
                </div>
                {"partners" in p && p.partners && <p className="nk-measure-np">Nomination partners</p>}
              </div>
            ))}

          {/* the draw is cut while the roster is up: the names take its
              place, and a cut is the page's way of going from one to the
              other */}
          {/* the roster in the picture's place (switch partnersinplate): the copy
              stays, the names stand where the picture's caption stands */}
          {partnersOpen && (
            <div className="mod-manifest-draw nk-np-place">
              <div className="mod-manifest-draw-caption nk-np-list" id="nomination-partners-place">
                <ul>
                  {NOMINATION_PARTNERS.map((name, i) => (
                    <li key={name} style={{ ["--d" as string]: `${Math.floor(i / 2) * 20}ms` }}>
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {one && !partnersOpen && !marked && (
            <div className="mod-manifest-draw">
              {/* kept for the keyboard: the pointer has the word instead */}
              <button
                type="button"
                className="mod-manifest-draw-mark"
                onClick={another}
              >
                Shuffle
              </button>
              {mark && (
                <span
                  className="mod-manifest-draw-cursor"
                  aria-hidden="true"
                  style={{ left: mark.x, top: mark.y }}
                >
                  Shuffle
                </span>
              )}
              {/* the frame is drawn whether or not the company has a
                  picture, so a draw without one leaves a hole rather than
                  pulling the record up the page */}
              {/* THE DRAWN COMPANY OPENS. The plate and its caption are the
                  way in to it; anywhere else on the section still draws
                  another. The picture is for the pointer, the caption is the
                  button the keyboard reaches. */}
              <figure className="mod-manifest-draw-plate">
                {/* the picture is part of the wheel: a press on it draws
                    another, like anywhere else on the section. The caption
                    under it is the way in to the company. */}
                {one.visual && <img src={web(one.visual)} alt={one.name} />}
              </figure>
              {/* the caption's line is always there and only its words come
                  and go: cut in once the wheel lands, blank while it turns.
                  Mounting it only on landing took its height with it, and
                  everything under it - the mark, on a phone - jumped on
                  every spin. */}
              <p className="mod-manifest-draw-caption">
                <button
                  type="button"
                  className="mod-manifest-draw-who mod-manifest-draw-open"
                  onClick={(e) => {
                    /* with the cards that fly into the modal, the caption and
                       the picture fly into it too */
                    const caption = e.currentTarget;
                    {
                      const plate = caption.closest(".mod-manifest-draw")?.querySelector<HTMLElement>(".mod-manifest-draw-plate img") ?? null;
                      flyFrom(caption, () => openCompany(one.slug), [
                        ["name", caption, ".entry-name", 0, "letters"],
                        ["picture", plate, ".entry-figure img", 60, "img"],
                      ]);
                    }
                  }}
                  disabled={spinning || !written}
                  aria-label={spinning ? undefined : `${line1}. ${line2}`}
                >
                  {written}
                </button>
              </p>
              <div className="mod-manifest-draw-record">
                <p className="mod-manifest-draw-name">{one.name}</p>
                <p className="mod-manifest-draw-geo">{one.geo}</p>
                <p className="mod-manifest-draw-sector">{one.sector}</p>
              </div>
              <p className="mod-manifest-draw-statement">{one.statement}</p>
            </div>
          )}

          <nav className="mod-manifest-index" aria-label="Manifest sections">
            <ol>
              {PANELS.map((p, i) => (
                <li key={p.key}>
                  <button
                    className={`mod-manifest-tab${i === active ? " mod-manifest-tab--active" : ""}`}
                    onClick={() => {
                      /* switch tabshuffle: another panel draws another
                         company, as a press on Shuffle does */
                      if ((i !== active)) anotherRef.current();
                      setActive(i);
                    }}
                    aria-current={i === active}
                  >
                    <span className="mod-manifest-tab-num">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {/* manifest-v2 and later: the open panel wears its sign */}
                    {(i === active) && <TabIcon k={p.key} />}
                    <span className="mod-manifest-tab-label">{p.key}</span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </div>
    </section>
  );
}
