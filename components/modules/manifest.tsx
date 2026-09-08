"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { NOMINATION_PARTNERS } from "./partners";
import ElectroMark from "./electro-mark";

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
    key: "What this is",
    body: [
      "The norrsken100 highlights the most promising early-stage startups solving global challenges at scale by outperforming the legacy models that created them.",
      "Scroll down to find 100 founders of the next economy. The first trillion-euro companies will be built by people solving problems this size.",
      "They shape what comes next.\nThey are *100 ways to fix the future.*",
    ],
  },
  {
    key: "How they're picked",
    // stacked facts at body size, the way Climax lists edition, publisher,
    // price and dimensions, not a dashboard of oversized numbers. Figure in
    // roman, descriptor in italic: Climax's own split.
    // One funnel, one edition, read top to bottom: who nominates, how much
    // comes in, what comes out. The old set mixed per-edition figures (1,400
    // nominations, 78 partners) with all-time ones (352 companies, 41
    // countries) and marked neither, so the four numbers did not add up to
    // anything a reader could hold.
    body: [
      "Every edition starts with nominations. We ask a hand-picked group of {{78}} venture funds, foundations, accelerators and prizes to put companies forward. This edition they sent {{1400+}}. Our team works through every one, measures each company against the criteria, and cuts the field to {{100}}.",
      "What we look for: positive global impact as an *intrinsic and non-negotiable* part of the business model. Scalable technology aimed at a global problem. A product in market, at least an MVP. Funding from seed or Series A, up to Series B. Measurable progress against the UN Sustainable Development Goals. Nothing here is ranked. The order is alphabetical.",
    ],
    partners: true,
  },
  // These two are the themes themselves, not Norrsken's activity around them.
  // The lines are the open letters' own; they already say it better than a
  // paraphrase would.
  {
    key: "Electro Union",
    // this panel swaps the vortex for the campaign's own mark
    image: { file: "Electro-union-logo.svg", ground: "plain", alt: "" },
    // The campaign and its outcome, not the problem statement. The two dates
    // are stated in sequence and left there: the Commission's plan is not
    // claimed as ours, and the 50/46 gap is shown rather than smoothed over.
    body: [
      "In April 2026, Norrsken published [an open letter](https://www.norrsken.org/goodnews/make-europe-the-electro-union) asking the EU to commit to running more than half its economy on clean, domestic electricity by 2040. More than 100 organisations signed it: companies, funds and industry bodies.",
      "In July the European Commission published its Electrification Action Plan, setting an indicative target of 46% by 2040. Electricity is about 23% of final energy use today.",
      // "electro-continent" is the letter's own spelling, and it now lands once,
      // at the end, as the payoff. It was closing the paragraph above too.
      "Scroll down and you'll find *27 builders* of the Electro Union. Shaping the grid, storage, domestic generation, electrified industry and transport, and the materials all of it runs on. All to make Europe the first electro-continent.",
    ],
  },
  {
    key: "Prompt What Matters",
    // this panel turns the section pink; the others leave it white
    ground: "pink",
    // Same shape as Electro Union: what we did, the numbers, then why these
    // companies are on the list. It closes on the letter's own last line,
    // which names the campaign, the way "electro-continent" closes the panel
    // above.
    body: [
      "In June 2025 we pledged \u20ac300m from Norrsken VC, Norrsken Launcher and Norrsken Accelerator to startups using AI on climate, health, food, education and society.",
      "In 2024 AI startups raised over $110bn, about a third of all venture funding worldwide. Most of it went to productivity and convenience. If this wave runs like the ones before it, 80% of those companies disappear. The biggest returns come from fixing the biggest problems.",
      "Scroll down and you'll find *25 companies* where AI is an integral part of the product, pointed at global problems at scale. This is a historic moment for innovation. Let's make sure we *prompt what actually matters.*",
    ],
    link: {
      href: "https://www.norrsken.org/goodnews/prompt-what-matters",
      label: "Read the open letter",
    },
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
function Body({ panel }: { panel: Panel }) {
  return (
    <>
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
          {/* sits under the sentence it belongs to, not at the foot */}
          {"partners" in panel && panel.partners && pi === 0 && (
            <details className="mod-manifest-reveal">
              <summary>Nomination partners</summary>
              <p>{NOMINATION_PARTNERS.join(", ")}</p>
            </details>
          )}
        </Fragment>
      ))}
      {"link" in panel && panel.link && (
        <p className="mod-manifest-link">
          <a href={panel.link.href} target="_blank" rel="noreferrer">
            {panel.link.label}
          </a>
        </p>
      )}
    </>
  );
}

export default function Manifest() {
  const [active, setActive] = useState(0);
  const panel = PANELS[active];

  /* The ground belongs to the page, not to this section, so the class goes on
     <html>: it redefines --bg, and body plus every surface painted with it
     turn together. Cleared on unmount so the colour cannot outlive the tab. */
  // artwork is per panel, falling back to the vortex that holds everywhere else
  const art = panel.image ?? MANIFEST_GIF;
  const ground = panel.ground;
  useEffect(() => {
    const root = document.documentElement;
    if (ground) root.classList.add(`ground-${ground}`);
    return () => {
      if (ground) root.classList.remove(`ground-${ground}`);
    };
  }, [ground]);

  return (
    <section className="mod-manifest">
      {/* Print-distortion filter, lifted verbatim off cheap.urls.loan: a high
          frequency turbulence used as a displacement map, which roughs the
          edges the way a bad print or a photocopy does. Their values exactly,
          scale 2 on desktop and 1.5 on mobile. Applied to the Electro Union
          mark only, via .mod-manifest-gifline--plain. */}
      <svg className="mod-manifest-filters" aria-hidden="true" focusable="false">
        <filter id="print-distort">
          <feTurbulence baseFrequency="1 1" numOctaves={1} />
          <feDisplacementMap in="SourceGraphic" scale="2" />
        </filter>
        <filter id="print-distort-mobile">
          <feTurbulence baseFrequency="1 1" numOctaves={1} />
          <feDisplacementMap in="SourceGraphic" scale="1.5" />
        </filter>
      </svg>

      {/* The same spread the company pages are, after the book: the plate
          inset on the verso with the panel's number and title in the foot;
          on the recto the copy - first paragraph bold as the lead line,
          justified - then the contents standing lower as the record, the
          current one underlined, and the number again in the foot. */}
      <div className="mod-manifest-top">
        <div className="mod-manifest-verso">
          <figure
            key={art.file}
            className={`mod-manifest-gifline mod-manifest-gifline--${art.ground}`}
          >
            {art.file.endsWith(".svg") ? (
              <ElectroMark src={`/manifest-images/${art.file}`} />
            ) : (
              <img src={`/manifest-images/${art.file}`} alt={art.alt ?? ""} />
            )}
          </figure>
          <footer className="entry-foot">
            <span className="entry-foot-num">{String(active + 1).padStart(2, "0")}</span>
            <span className="entry-foot-name">{panel.key}</span>
            <span aria-hidden="true" />
          </footer>
        </div>

        <div className="mod-manifest-recto">
          <blockquote className="mod-manifest-body" key={panel.key}>
            <Body panel={panel} />
          </blockquote>

          <nav className="mod-manifest-index" aria-label="Manifest sections">
            <ol>
              {PANELS.map((p, i) => (
                <li key={p.key}>
                  <button
                    className={`mod-manifest-tab${i === active ? " mod-manifest-tab--active" : ""}`}
                    onClick={() => setActive(i)}
                    aria-current={i === active}
                  >
                    <span className="mod-manifest-tab-num">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="mod-manifest-tab-label">{p.key}</span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>

          <footer className="entry-foot entry-foot--recto">
            <span className="entry-foot-num">{String(active + 1).padStart(2, "0")}</span>
          </footer>
        </div>
      </div>
    </section>
  );
}
