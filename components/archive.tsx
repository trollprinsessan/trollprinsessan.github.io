"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Company, Facets } from "@/lib/types";
import { visualFor, cohortsFor, thumb, isLineArt, isClipart, isPhoto } from "@/lib/art-direction";
import {
  COMPANY_PARAM,
  OPEN_COMPANY_EVENT,
  companyFromUrl,
  writeCompanyUrl,
} from "@/lib/company-link";
import { iso3List } from "@/lib/countries";
import { composeOrder } from "@/lib/composition";

// client-only: reads image pixels + WebGL, must never run on the server

// THE FILTER IS A SHEET OFF THE DOCK.
// Every group's full option list is exposed at once, every group is
// multi-select, and it filters live: there is nothing to submit, so there is
// no "show results" - the list behind is already the result. An option is
// on when it is INVERTED, the way an open index row is; nothing else marks
// it. What is applied is carried in the Filter slot itself, so you can read
// the state of the list without opening anything.
function FilterGroup({ title, value, options, onChange, wide }: {
  title: string;
  value: Set<string>;
  options: string[];
  onChange: (v: Set<string>) => void;
  /* a long list (Geography's 41 countries) takes the search's four tracks
     and splits its own options across two columns rather than running
     800px down */
  wide?: boolean;
}) {
  const toggle = (o: string) => {
    const next = new Set(value);
    if (next.has(o)) next.delete(o);
    else next.add(o);
    onChange(next);
  };
  return (
    <div className={`filter-group${wide ? " filter-group--wide" : ""}`}>
      {/* the group's name, and its own Clear the moment anything in it is
          on - so a group is undone where it was done */}
      <div className="filter-group-head">
        <span className="filter-group-title">{title}</span>
        {value.size > 0 && (
          <button className="filter-group-clear" onClick={() => onChange(new Set())}>
            Clear
          </button>
        )}
      </div>
      <div className="filter-group-list" role="group" aria-label={title}>
        {options.map((o) => (
          <button
            key={o}
            role="checkbox"
            aria-checked={value.has(o)}
            className={`filter-opt${value.has(o) ? " filter-opt--on" : ""}`}
            onClick={() => toggle(o)}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}


type View = "index" | "grid";

/* THE DENSITY SLIDER
   One control between the two ways of reading the list: a contact sheet at
   one end, a catalogue at the other. The card gives up a line at each step in
   - plates alone, then the name, then the facts, then the statement - so the
   slider is really one decision about how much of each company you want at
   once. */
/* THE GRID'S SCALE: sixteen across down to six. It is the grid's own
   control and shows only while the grid is up; the index has no density. */
const DENSITIES = [
  /* `phone` is the same stop on a phone's width, should the grid ever be
     shown there */
  { cols: 16, phone: 4, shows: "plates" },
  { cols: 12, phone: 3, shows: "names" },
  { cols: 8, phone: 2, shows: "facts" },
  { cols: 6, phone: 2, shows: "full" },
];

/* Shuffle is parked for now - the control is hidden, the draw is kept. */
const SHUFFLE_ON = false;

/* The card's statement is parked while the tight grid is tried. Flip to bring
   it back. */
const CARD_STATEMENT_ON = true;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* the list's order: this edition first (composed, see lib/composition) */
const recent = (c: Company) => (c.years.length ? Math.max(...c.years) : 0);

/* SEARCH READS EVERYTHING THE EDITION WROTE.
   Not the name and the one-liner alone: the sector, the subsector, the
   countries (and the short forms the page sets them in), the website, the
   campaigns, and both of the long texts. Accents are folded away and every
   word has to be found, in any order - "kenya solar" finds a Kenyan solar
   company wherever the two words sit. */
const fold = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/* a key press meant for a field is not a step through the companies */
function typing(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null;
  return (
    !!t &&
    (t.tagName === "INPUT" ||
      t.tagName === "TEXTAREA" ||
      t.tagName === "SELECT" ||
      t.isContentEditable)
  );
}

function sections(c: Company) {
  // "Problem"/"Solution" renamed to the same phrasing the 2026 batch's own
  // fields use ("What they fix" / "What this means for the future") - the
  // two data shapes are mutually exclusive per company, so a given company's
  // block list never carries both a current.* and a legacy.* entry under the
  // same label.
  // A returning company carries both this edition's text and an older
  // year's: only the current one is shown, so the legacy blocks come in
  // only when there is no current text at all.
  const current = [
    { label: "What they fix", body: c.current.fix },
    { label: "What they outperform", body: c.current.outperform },
    { label: "What this means for the future", body: c.current.future },
  ].filter((s) => s.body && s.body.trim());
  if (current.length) return current;
  return [
    { label: "What they fix", body: c.legacy.problem },
    { label: "What this means for the future", body: c.legacy.solution },
    { label: "Description", body: c.legacy.description },
  ].filter((s) => s.body && s.body.trim());
}

/* PREVIOUS AND NEXT
   The companies in the order the list is showing them, so a company can be
   read after the one before it without going back to the list. The same two
   words the Latest section steps with. */
type Steps = {
  prev: Company | null;
  next: Company | null;
  onStep: (dir: -1 | 1) => void;
};

function EntrySteps({ steps, slug }: { steps: Steps; slug?: string }) {
  return (
    <nav className="entry-steps" aria-label="Companies">
      <button
        type="button"
        className="entry-step"
        onClick={() => steps.onStep(-1)}
        disabled={!steps.prev}
        aria-label={steps.prev ? `Previous: ${steps.prev.name}` : "Previous"}
      >
        Prev
      </button>
      <button
        type="button"
        className="entry-step"
        onClick={() => steps.onStep(1)}
        disabled={!steps.next}
        aria-label={steps.next ? `Next: ${steps.next.name}` : "Next"}
      >
        Next
      </button>
      {slug && <CopyLink slug={slug} />}
    </nav>
  );
}

/* A LINK TO THE COMPANY, COPIED.
   Every company already has an address (?company=slug); this puts it on the
   clipboard and says so for a moment, in the word itself. */
function CopyLink({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const copy = async () => {
    const url = new URL(window.location.pathname, window.location.origin);
    url.searchParams.set(COMPANY_PARAM, slug);
    try {
      await navigator.clipboard.writeText(url.toString());
    } catch {
      /* no clipboard permission (an embed, an older browser): the old way,
         through a field that is never seen */
      const field = document.createElement("textarea");
      field.value = url.toString();
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      const ok = document.execCommand("copy");
      field.remove();
      if (!ok) return;
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  };
  return (
    <button type="button" className="entry-step copy-link" onClick={copy} aria-live="polite">
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}

/* The entry layout, shared by the modal and the Shuffle view so the two are
   the same object rather than two designs that resemble each other. `corner`
   is whatever control belongs in the top right: the close mark in the modal,
   the spin circle in Shuffle. */
function EntryLayout({ c, corner, onImageClick, spread, steps, lead, rectoHead }: {
  c: Company;
  corner: React.ReactNode;
  /* the modal: the one-liner leads the copy, in bold, and the recto's head
     carries `rectoHead` instead. The index panel keeps its own order. */
  lead?: boolean;
  rectoHead?: React.ReactNode;
  onImageClick?: () => void;
  /* the index panel sets Prev and Next under the name rather than beside
     the close mark */
  steps?: Steps;
  /* Shuffle: two leaves with their own vertical rhythm - the name over the
     picture on the verso, the lead, the body and the record on the recto.
     One grid cannot give two columns independent rows, so the leaves are
     real wrappers. The modal keeps the flat order. */
  spread?: boolean;
}) {
  /* Description is dropped: it restates Problem and Solution, and the 2026
     batch carries two categories anyway */
  const blocks = sections(c).filter((s) => s.label !== "Description");
  /* everything the named rows do not already carry: secondary sectors, themes.
     The data joins some of these with an ampersand - "Clean Energy & Climate
     Tech" - which reads as one label; they are two tags, so the split takes
     the ampersand as well as the comma and the record commas them all. */
  const meta = [
    ...c.subsector.split(/\s*[,&]\s*/).map((x) => x.trim()).filter(Boolean),
    ...(c.themes ?? []).flatMap((t) =>
      t.split(/\s*&\s*/).map((x) => x.trim()).filter(Boolean)
    ),
  ];

  const head = <header className="entry-head">{corner}</header>;
  /* the dialog is named by it */
  const name = <h2 className="entry-name" id={`entry-name-${c.slug}`}>{c.name}</h2>;
  const statement = c.statement ? (
    <p className="entry-statement">{c.statement}</p>
  ) : null;
  const figure = (
    <figure
      /* the kind of picture rides on the frame, so each kind can be hung its
         own way on the plate */
      className={`entry-figure${onImageClick ? " entry-figure--action" : ""}${
        !visualFor(c)
          ? ""
          : visualFor(c).endsWith(".gif")
            ? " entry-figure--gif"
            : isLineArt(visualFor(c))
              ? " entry-figure--line"
              : isPhoto(visualFor(c))
                ? " entry-figure--photo"
                : " entry-figure--clip"
      }`}
      onClick={onImageClick}
      title={onImageClick ? "New random company" : undefined}
    >
      {visualFor(c) && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={visualFor(c)} alt={c.name} loading="lazy" decoding="async" />
      )}
    </figure>
  );
  /* no labels on the company pages: the two blocks sit in their own columns
     and the reading order carries them. The index detail keeps its labels,
     where the blocks stack. */
  const prose = (
    <div className="entry-blocks">
      {blocks.map((s) => (
        <div key={s.label} className="entry-block">
          <p className="entry-block-body">{s.body}</p>
        </div>
      ))}
    </div>
  );
  /* a sibling of the text block, not a child of it, so it can be placed
     against the picture's bottom edge in Shuffle */
  const record = (
    <dl className="entry-spec">
        <div className="entry-spec-cell">
          <dt>Status</dt>
          <dd>{c.returning ? "Returning" : "Newcomer"}</dd>
        </div>
        <div className="entry-spec-cell">
          <dt>Country</dt>
          <dd>{c.countries.map(abbreviateCountry).join(", ") || "—"}</dd>
        </div>
        <div className="entry-spec-cell">
          <dt>Sector</dt>
          <dd>{c.sectorLabel || "—"}</dd>
        </div>
        <div className="entry-spec-cell">
          <dt>Meta</dt>
          <dd>{meta.length ? meta.join(", ") : "—"}</dd>
        </div>
        <div className="entry-spec-cell">
          <dt>URL</dt>
          <dd>
          {c.website ? (
            <a href={c.website} target="_blank" rel="noopener noreferrer">
            {c.website.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "")}
            </a>
          ) : "—"}
          </dd>
        </div>
    </dl>
  );

  if (spread) {
    return (
      <>
        {head}
        {/* the verso carries the type, as the printed spread does: the name
            small at the head, the record high and indented under it, and the
            lead line and body hung from the foot of the page */}
        <div className="entry-verso">
          {name}
          {steps && <EntrySteps steps={steps} />}
          <div className="entry-record">
            <span className="entry-record-name">{c.name}</span>
            <div className="entry-record-values">
              <span>{c.countries.map(abbreviateCountry).join(", ")}</span>
              {c.sectorLabel && <span>{c.sectorLabel}</span>}
              {meta.length > 0 && <span>{meta.join(", ")}</span>}
              {c.website && (
                <a href={c.website} target="_blank" rel="noopener noreferrer">
                  {c.website.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "")}
                </a>
              )}
            </div>
          </div>
          <div className="entry-verso-foot">
            {/* in the modal the one-liner leads the copy, in bold */}
            {lead && statement}
            {prose}
          </div>
        </div>
        {/* the recto: the name again as a running head, a short caption on
            the record's own line, and the plate under them - the three things
            the reference spread puts on its picture page */}
        <div className="entry-recto">
          {lead ? (
            /* the head of the recto: Prev and Next, on the plate's column */
            <div className="entry-runhead entry-runhead--copy">{rectoHead}</div>
          ) : (
            <p className="entry-runhead">{c.statement}</p>
          )}
          <p className="entry-plate-caption">
            {[c.countries.map(abbreviateCountry).join(", "), c.sectorLabel]
              .filter(Boolean)
              .join(", ")}
          </p>
          {figure}
        </div>
      </>
    );
  }

  return (
    <>
      {head}
      {name}
      {statement}
      {figure}
      {prose}
      {record}
    </>
  );
}

function CompanyModal({ c, onClose, onShuffle, spinning, steps }: {
  c: Company;
  onClose: () => void;
  /* the draw lives in here now: pressing the picture, or the control at the
     foot, rolls another company into the same plate without closing it */
  onShuffle?: () => void;
  spinning?: boolean;
  steps: Steps;
}) {
  const [out, setOut] = useState(false);
  const articleRef = useRef<HTMLElement>(null);
  const closing = useRef(false);

  /* matches the exit animation, so the plate is gone before it unmounts */
  const close = () => {
    if (closing.current) return;
    closing.current = true;
    setOut(true);
    setTimeout(onClose, 540);
  };

  /* the keys are bound once, so they read the current company through this */
  const live = useRef({ close, steps });
  live.current = { close, steps };

  /* A DIALOG, FOR THE KEYBOARD TOO.
     The focus goes into the plate when it opens and stays inside it - Tab
     runs round its own controls - and it goes back to whatever opened it
     when it closes, so the reader is where they were in the list. The arrow
     keys step to the company before or after. */
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    articleRef.current?.focus({ preventScroll: true });
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { live.current.close(); return; }
      if (e.key === "Tab") {
        const root = articleRef.current;
        if (!root) return;
        const focusable = [
          ...root.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
        ];
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const at = document.activeElement;
        if (e.shiftKey && (at === first || at === root)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (at === last || !root.contains(at))) {
          e.preventDefault();
          first.focus();
        }
        return;
      }
      if (typing(e)) return;
      if (e.key === "ArrowLeft") { e.preventDefault(); live.current.steps.onStep(-1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); live.current.steps.onStep(1); }
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
      if (opener && opener !== document.body && document.contains(opener)) {
        opener.focus({ preventScroll: true });
      }
    };
  }, []);

  return (
    <div className={`entry-scrim${out ? " entry-scrim--out" : ""}`} onClick={close}>
      <article
        ref={articleRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`entry-name-${c.slug}`}
        tabIndex={-1}
        className={`entry entry--spread entry--slot${slotFor(c.slug)}${
          out ? " entry--out" : ""
        }${spinning ? " entry--spinning" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <EntryLayout
          c={c}
          spread
          lead
          rectoHead={<EntrySteps steps={steps} />}
          onImageClick={onShuffle}
          corner={
            <button className="entry-close" onClick={close} aria-label="Close">✕</button>
          }
        />
        {/* at the foot of the plate, on one line: Prev and Next at its left
            edge, Shuffle at its right. Prev and Next are at the head. */}
        <div className="entry-copy-foot">
          <CopyLink slug={c.slug} />
        </div>
        {onShuffle && (
          <button className="entry-spin" onClick={onShuffle}>Shuffle</button>
        )}
      </article>
    </div>
  );
}


export default function Archive({
  companies,
  facets,
}: {
  companies: Company[];
  facets: Facets;
}) {
  // multi-select: an empty set means "every option", same as the reference's
  // unchecked-by-default groups — Year keeps its one pre-checked box (this
  // edition) so the page opens exactly as narrow as it did before.
  const [sector, setSector] = useState<Set<string>>(new Set());
  const [country, setCountry] = useState<Set<string>>(new Set());
  const [theme, setTheme] = useState<Set<string>>(new Set());
  /* the edition the page opens on: the year the filter starts with, and the
     one Clear goes back to */
  const latestYear = useMemo(() => String(Math.max(...companies.map(recent))), [companies]);
  const [year, setYear] = useState<Set<string>>(() => new Set([latestYear]));
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  /* the dock rides the foot of the window, but only while the list it belongs
     to is on screen - an observer rather than a scroll listener, so it costs
     nothing while you read */
  const [dockOn, setDockOn] = useState(false);
  /* AND THE BAR ENDS WITH THE LIST: it stands at the foot of the window, so
     it goes the moment the list's last row has passed up off that foot - a
     second observer on a strip at the bottom of the screen. The panel beside
     the index keeps to dockOn alone, so it stays in place past the last row. */
  const [listAtFoot, setListAtFoot] = useState(false);
  const [listShort, setListShort] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setDockOn(e.isIntersecting),
      { rootMargin: "0px 0px -20% 0px" }
    );
    const foot = new IntersectionObserver(
      ([e]) => setListAtFoot(e.isIntersecting),
      { rootMargin: "-95% 0px 0px 0px" }
    );
    /* A LIST TOO SHORT TO REACH THE FOOT KEEPS ITS BAR. A search that leaves
       two rows ends above the foot the moment it is on screen, and the bar
       would leave with it - just when it is being reached for. So the ending
       applies only to a list at least a window tall. */
    const measure = () => setListShort(el.offsetHeight < window.innerHeight);
    const ro = new ResizeObserver(measure);
    measure();
    io.observe(el);
    foot.observe(el);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      io.disconnect();
      foot.disconnect();
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);
  /* six across, which is the grid the page has always opened on */
  const [density, setDensity] = useState(3);
  const [view, setView] = useState<View>("grid");
  /* THE LIST IS CUT AT THE MARK'S FOOT.
     The mark is stuck to the head of the window while the list runs up
     under it. Rather than give the mark a ground, the list itself is clipped
     to below the mark's foot - the grid, or the index's rows - so whatever
     enters the band is gone, type and pictures alike, and the letters stand
     on the page. Measured on every scroll, one frame at a time; the panel
     beside the index is a sibling of the rows, so it is not cut. */
  const [empty, setEmpty] = useState(false);
  useEffect(() => {
    const mast = document.querySelector<HTMLElement>(".archive-masthead");
    const list = listRef.current;
    if (!mast || !list) return;
    const cut = () => {
      const foot = mast.getBoundingClientRect().bottom;
      /* and the panel beside the index hangs from the mark's foot wherever
         that is - stuck at the head, or parked lower while the list is only
         just arriving - so it is never above the mark */
      document.documentElement.style.setProperty(
        "--index-panel-top",
        `${Math.max(0, Math.round(foot))}px`
      );
      list
        /* the grid only: the index's rows may run on behind the letters
           and show through them */
        .querySelectorAll<HTMLElement>(":scope > .grid, :scope > .empty")
        .forEach((el) => {
          const c = Math.max(0, Math.round(foot - el.getBoundingClientRect().top));
          el.style.clipPath = c > 0 ? `inset(${c}px 0 0 0)` : "";
        });
    };
    let raf = 0;
    const ask = () => {
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; cut(); });
    };
    cut();
    window.addEventListener("scroll", ask, { passive: true });
    window.addEventListener("resize", ask);
    return () => {
      window.removeEventListener("scroll", ask);
      window.removeEventListener("resize", ask);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [view, empty]);
  /* a phone opens on the index and stays there: the switch is not on the
     phone's bar, and each row carries a thumbnail the height of its line
     instead. Set after mount rather than read at render, so the static page
     and the first paint agree; the loader is still over the page when this
     runs. */
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 720px)");
    if (mq.matches) setView("index");
    /* and if the window becomes a phone's width later, the same */
    const onChange = (e: MediaQueryListEvent) => { if (e.matches) setView("index"); };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  const { cols, phone, shows } = DENSITIES[density];
  const [filtersOpen, setFiltersOpen] = useState(false);
  /* the sheet closes on Escape, and on a press anywhere off the dock: the
     list behind it is the result, and reaching for it means you are done */
  useEffect(() => {
    if (!filtersOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFiltersOpen(false); };
    const onPress = (e: PointerEvent) => {
      if (!(e.target as Element).closest(".dock")) setFiltersOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPress);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPress);
    };
  }, [filtersOpen]);
  const [spinning, setSpinning] = useState(false);
  const spinTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => spinTimers.current.forEach(clearTimeout), []);

  const haystacks = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of companies) {
      m.set(
        c.slug,
        fold(
          [
            c.name,
            c.statement,
            c.sectorLabel,
            c.subsector,
            ...c.countries,
            ...c.countries.map(abbreviateCountry),
            ...c.countries.map((x) => COUNTRY_NAMES[x] ?? ""),
            c.website,
            ...(c.themes ?? []),
            ...cohortsFor(c.slug),
            c.current.fix,
            c.current.outperform,
            c.current.future,
          ]
            .filter(Boolean)
            .join("\n")
        )
      );
    }
    return m;
  }, [companies]);

  /* SHAKE THE GRID: one press deals the hundred a new order, and they keep
     it through every filter and search until the next press. A key a
     company, drawn once a shake; the list sorts on the keys instead of the
     edition's order. */
  const [shaken, setShaken] = useState<Map<string, number> | null>(null);
  const shake = () => {
    const keys = new Map<string, number>();
    for (const c of companies) keys.set(c.slug, Math.random());
    setShaken(keys);
    setFiltersOpen(false);
  };

  /* THE OPENING ORDER: the latest edition hung as a composed wall (see
     lib/composition), earlier years after it alphabetically */
  const composed = useCallback(() => {
    const latest = Math.max(...companies.map(recent));
    const m = new Map<string, number>();
    composeOrder(companies.filter((c) => c.years.includes(latest))).forEach((s, i) => m.set(s, i));
    return (a: Company, b: Company) =>
      recent(b) - recent(a) ||
      (m.get(a.slug) ?? Infinity) - (m.get(b.slug) ?? Infinity) ||
      a.name.localeCompare(b.name);
  }, [companies]);
  const byComposition = useMemo(() => composed(), [composed]);

  const filtered = useMemo(() => {
    const terms = fold(query).split(/\s+/).filter(Boolean);
    let list = companies.filter((c) => {
      if (sector.size && !sector.has(c.sectorLabel)) return false;
      if (country.size && !c.countries.some((x) => country.has(x))) return false;
      if (theme.size && !(c.themes ?? []).some((x) => theme.has(x))) return false;
      if (year.size && !c.years.some((x) => year.has(String(x)))) return false;
      if (terms.length) {
        const hay = haystacks.get(c.slug) ?? "";
        if (!terms.every((t) => hay.includes(t))) return false;
      }
      return true;
    });
    list = shaken
      ? [...list].sort((a, b) => (shaken.get(a.slug) ?? 0) - (shaken.get(b.slug) ?? 0))
      : [...list].sort(byComposition);
    return list;
  }, [companies, sector, country, year, theme, query, haystacks, shaken, byComposition]);
  /* the clip above re-measures when the list swaps to its empty line */
  useEffect(() => setEmpty(filtered.length === 0), [filtered.length]);

  /* THE OPEN COMPANY
     One company is open at a time, in one of two places: the modal over the
     page, or the panel beside the index (a sheet on a phone). It is kept by
     its slug, and the slug is the page's address, so it can be linked to and
     the back button closes it. */
  const bySlug = useMemo(() => new Map(companies.map((c) => [c.slug, c])), [companies]);
  const sortedAll = useMemo(() => [...companies].sort(byComposition), [companies, byComposition]);
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [chosenSurface, setSurface] = useState<"modal" | "panel">("modal");
  /* A PHONE NEVER GETS THE SPREAD.
     The surface is chosen when a company opens, off the window's width at
     that moment - and a phone can report a desktop width in that moment (an
     in-app browser, a page still settling its viewport, a turn of the
     device). The spread laid out at a phone's width is a wreck, so the width
     is watched, and at 900 and under the index's sheet takes the company,
     whatever was chosen when it opened. */
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNarrow(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setNarrow(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  /* ...but only where the sheet can actually appear: beside the index. A
     tablet in the grid (721-900) keeps the modal, or a press on a card would
     open nothing at all. A phone is on the index either way (above). */
  const surface = narrow && view === "index" ? "panel" : chosenSurface;
  const openRef = useRef<string | null>(null);
  const surfaceRef = useRef(surface);
  surfaceRef.current = surface;
  /* whether this visit put the open company into the history: if it did,
     closing steps back out of it; a company that arrived in the address is
     closed by rewriting the address, so the back button still leaves */
  const pushed = useRef(false);
  /* the company came in the address - someone sent a link - rather than
     being opened from the list */
  const arrivedByLink = useRef(false);
  const viewRef = useRef(view);
  viewRef.current = view;
  const dockOnRef = useRef(dockOn);
  dockOnRef.current = dockOn;

  /* the modal, unless the index is up and the list is on screen to hold the
     panel - or it is a phone, where the panel is a sheet over anything */
  const surfaceFor = (): "modal" | "panel" => {
    const v = window.matchMedia("(max-width: 720px)").matches ? "index" : viewRef.current;
    if (v !== "index") return "modal";
    if (window.matchMedia("(max-width: 900px)").matches) return "panel";
    return dockOnRef.current ? "panel" : "modal";
  };

  const showCompany = useCallback((slug: string, as?: "modal" | "panel") => {
    if (!bySlug.has(slug)) return;
    if (openRef.current) {
      writeCompanyUrl(slug, "replace");
    } else {
      writeCompanyUrl(slug, "push");
      pushed.current = true;
    }
    openRef.current = slug;
    if (as) setSurface(as);
    setOpenSlug(slug);
  }, [bySlug]);

  const closeCompany = useCallback(() => {
    if (!openRef.current) return;
    openRef.current = null;
    setOpenSlug(null);
    if (pushed.current) {
      pushed.current = false;
      window.history.back();
    } else {
      writeCompanyUrl(null, "replace");
    }
  }, []);

  /* THE PANEL GOES WITH THE LIST: it is fixed to the window, so once the
     list has scrolled off the screen it would hang over The Latest and
     everything after. When the list leaves - not before it has arrived, so
     a company opened from the manifest with the list still below stays -
     the panel closes. */
  const wasOn = useRef(dockOn);
  useEffect(() => {
    if (wasOn.current && !dockOn && openRef.current && surfaceRef.current === "panel") {
      closeCompany();
    }
    wasOn.current = dockOn;
  }, [dockOn, closeCompany]);

  /* a panel whose row is filtered away goes with it */
  useEffect(() => {
    const slug = openRef.current;
    if (slug && surfaceRef.current === "panel" && !filtered.some((c) => c.slug === slug)) {
      closeCompany();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered]);

  /* the address, on arrival and on back and forward */
  useEffect(() => {
    const slug = companyFromUrl();
    if (slug && bySlug.has(slug)) {
      openRef.current = slug;
      pushed.current = false;
      arrivedByLink.current = true;
      setSurface(surfaceFor());
      setOpenSlug(slug);
    }
    const onPop = () => {
      const next = companyFromUrl();
      if (next && bySlug.has(next)) {
        if (!openRef.current) setSurface(surfaceFor());
        openRef.current = next;
        pushed.current = true;
        setOpenSlug(next);
      } else if (openRef.current) {
        openRef.current = null;
        pushed.current = false;
        setOpenSlug(null);
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bySlug]);

  /* anything else on the page that asks for a company - the manifest's plate */
  useEffect(() => {
    const onOpen = (e: Event) => {
      const slug = (e as CustomEvent<string>).detail;
      showCompany(slug, openRef.current ? undefined : surfaceFor());
    };
    window.addEventListener(OPEN_COMPANY_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_COMPANY_EVENT, onOpen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCompany]);

  /* THE LIST HAS AN ADDRESS TOO.
     How the list is being read - grid or index, how many a row, the filters
     and the search - is written into the page's address as it changes, so a
     refresh, the back button or a shared link comes back to the same list.
     Only what differs from the opening state is written, so a plain visit
     keeps a plain address; and it is rewritten in place, never pushed -
     turning a filter on is not a page to go back to. */
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const set = (k: string) =>
      new Set((p.get(k) ?? "").split(",").map((s) => s.trim()).filter(Boolean));
    /* eslint-disable react-hooks/set-state-in-effect */
    if (p.has("q")) setQuery(p.get("q") ?? "");
    if (p.has("sector")) setSector(set("sector"));
    if (p.has("country")) setCountry(set("country"));
    if (p.has("theme")) setTheme(set("theme"));
    if (p.has("year")) setYear(p.get("year") === "all" ? new Set() : set("year"));
    const d = DENSITIES.findIndex((x) => x.cols === Number(p.get("cols")));
    if (d >= 0) setDensity(d);
    if (p.get("view") === "index" && !window.matchMedia("(max-width: 720px)").matches) {
      setView("index");
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);
  const urlReady = useRef(false);
  useEffect(() => {
    /* the first pass would write the opening state over an address that has
       not been read yet */
    if (!urlReady.current) {
      urlReady.current = true;
      return;
    }
    const t = setTimeout(() => {
      const url = new URL(window.location.href);
      const put = (k: string, v: string | null) =>
        v ? url.searchParams.set(k, v) : url.searchParams.delete(k);
      const joined = (s: Set<string>) => (s.size ? [...s].join(",") : null);
      const phoneWidth = window.matchMedia("(max-width: 720px)").matches;
      put("view", !phoneWidth && view === "index" ? "index" : null);
      put("cols", view === "grid" && density !== 3 ? String(DENSITIES[density].cols) : null);
      put("q", query.trim() ? query : null);
      put("sector", joined(sector));
      put("country", joined(country));
      put("theme", joined(theme));
      put(
        "year",
        year.size === 1 && year.has(latestYear) ? null : year.size ? [...year].join(",") : "all"
      );
      const next = `${url.pathname}${url.search}${url.hash}`;
      const now = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (next !== now) {
        window.history.replaceState({ ...(window.history.state ?? {}) }, "", next);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [view, density, query, sector, country, theme, year, latestYear]);

  /* "/" GOES TO THE SEARCH from anywhere on the page, the way a catalogue's
     does. If the list is not on screen it is brought up first, so the field is
     in the bar at the foot when the caret lands in it. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || typing(e) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (openRef.current && surfaceRef.current === "modal") return;
      e.preventDefault();
      const list = listRef.current;
      if (list && !dockOnRef.current) {
        const mast = document.querySelector(".archive-masthead")?.getBoundingClientRect().height ?? 0;
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({
          top: list.getBoundingClientRect().top + window.scrollY - mast,
          behavior: reduce ? "auto" : "smooth",
        });
      }
      searchRef.current?.focus({ preventScroll: true });
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  /* what the search is taken out of: the list as the filters alone leave it */
  const beforeSearch = useMemo(
    () =>
      companies.filter(
        (c) =>
          (!sector.size || sector.has(c.sectorLabel)) &&
          (!country.size || c.countries.some((x) => country.has(x))) &&
          (!theme.size || (c.themes ?? []).some((x) => theme.has(x))) &&
          (!year.size || c.years.some((x) => year.has(String(x))))
      ).length,
    [companies, sector, country, theme, year]
  );

  const openCo = openSlug ? bySlug.get(openSlug) ?? null : null;
  /* the steps run through the list as it is showing; a company that is not
     in it (opened from the manifest past a search) steps through them all */
  const sequence =
    openSlug && filtered.some((c) => c.slug === openSlug) ? filtered : sortedAll;
  const at = openSlug ? sequence.findIndex((c) => c.slug === openSlug) : -1;
  const prevCo = at > 0 ? sequence[at - 1] : null;
  const nextCo = at >= 0 && at < sequence.length - 1 ? sequence[at + 1] : null;
  const steps: Steps = {
    prev: prevCo,
    next: nextCo,
    onStep: (dir) => {
      const to = dir < 0 ? prevCo : nextCo;
      if (to) showCompany(to.slug);
    },
  };

  /* A LINK'S COMPANY CLOSES ONTO THE LIST.
     Someone who arrived on a phone from a link has not seen the page; closing
     the sheet leaves them on the film at the top of it, with no sign of the
     hundred below. So the first close of a linked company brings the list up,
     under the mark, instead. */
  const closeSheet = () => {
    const fromLink = arrivedByLink.current;
    arrivedByLink.current = false;
    closeCompany();
    if (!fromLink || !window.matchMedia("(max-width: 900px)").matches) return;
    const list = listRef.current;
    if (!list) return;
    const mast = document.querySelector(".archive-masthead")?.getBoundingClientRect().height ?? 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    /* after the history step the close takes, or the restored position wins */
    setTimeout(() => {
      window.scrollTo({
        top: list.getBoundingClientRect().top + window.scrollY - mast,
        behavior: reduce ? "auto" : "smooth",
      });
    }, 60);
  };

  /* choosing a view or a stop puts the filter panel away: the panel is a
     detour off the row, and picking a view means you are done with it */
  const chooseView = (v: View) => {
    if (v !== "index" && openRef.current && surfaceRef.current === "panel") closeCompany();
    setView(v);
    setFiltersOpen(false);
  };
  const chooseDensity = (d: number) => {
    setDensity(d);
    setFiltersOpen(false);
  };

  /* THE OPENING YEAR IS NOT A FILTER YOU TURNED ON.
     The page opens on this edition, so the Filter slot names it rather than
     counting it; the count is only what the reader has added, and clearing
     goes back to the edition rather than to every year at once. */
  const yearIsOpening = year.size === 1 && year.has(latestYear);
  const addedFilterCount =
    sector.size + country.size + theme.size + (yearIsOpening ? 0 : year.size);
  const clearFilters = () => {
    setSector(new Set());
    setCountry(new Set());
    setTheme(new Set());
    setYear(new Set([latestYear]));
  };

  /* Shuffle is not a view: it draws one of the hundred straight into the
     modal, which now carries the spread. */
  /* the roulette: the plate flickers through the list on a decelerating
     cadence and lands on one, the way the old Shuffle view did */
  const doSpin = () => {
    if (filtered.length === 0) return;
    spinTimers.current.forEach(clearTimeout);
    spinTimers.current = [];
    const pick = (avoid?: string) => {
      if (filtered.length === 1) return filtered[0];
      let next = filtered[Math.floor(Math.random() * filtered.length)];
      while (avoid && next.slug === avoid) {
        next = filtered[Math.floor(Math.random() * filtered.length)];
      }
      return next;
    };
    setSpinning(true);
    const gaps = [30, 40, 55, 80, 120, 175, 250];
    let elapsed = 0;
    gaps.forEach((gap, i) => {
      elapsed += gap;
      const isLast = i === gaps.length - 1;
      spinTimers.current.push(setTimeout(() => {
        const landed = pick(isLast ? openRef.current ?? undefined : undefined);
        openRef.current = landed.slug;
        setOpenSlug(landed.slug);
        /* the address takes the company it lands on, not every one it passes */
        if (isLast) {
          setSpinning(false);
          writeCompanyUrl(landed.slug, "replace");
        }
      }, elapsed));
    });
  };

  return (
    <>
      {openCo && surface === "modal" && (
        <CompanyModal
          c={openCo}
          onClose={closeCompany}
          onShuffle={doSpin}
          spinning={spinning}
          steps={steps}
        />
      )}

      {/* THE DOCK.
          Bar and panel are one fixed thing at the foot of the window, and the
          panel is FIRST in it so it opens upward off the bar rather than off
          the screen. Shown only while the list is on screen - over the film
          and the manifest there is nothing for it to control, and the mark is
          using that edge. */}
      <div className={`dock${dockOn && (listAtFoot || listShort) ? " dock--on" : ""}${filtersOpen ? " dock--open" : ""}${openCo && surface === "panel" ? " dock--panel" : ""}`}>
      {filtersOpen && (
        <div className="filter-panel">
          <div className="filter-panel-groups">
            <FilterGroup title="Year" value={year} options={facets.years.map(String)} onChange={setYear} />
            <FilterGroup title="Sector" value={sector} options={facets.sectors} onChange={setSector} />
            <FilterGroup title="Geography" value={country} options={facets.countries} onChange={setCountry} wide />
            <FilterGroup title="Theme" value={theme} options={facets.themes} onChange={setTheme} />
          </div>
          {/* the live count and the one action: clearing. Nothing to show,
              because the list is already showing it. */}
          <div className="filter-panel-footer">
            <button
              className="filter-clear"
              onClick={clearFilters}
              disabled={addedFilterCount === 0}
            >
              Clear all
            </button>
            <span className="filter-count">
              {filtered.length} of {companies.length}
            </span>
          </div>
        </div>
      )}
      <div className="controls">
        {/* ONE INSTRUMENT IN THE MIDDLE OF THE PAGE, the way last year's
            bar was: the cells shoulder to shoulder on tracks 3 to 9, none
            of them stretched to a margin. Count, Filter, Search, and the
            view - with the grid's scale inside the view cell while the grid
            is up. */}
        <div className="controls-row">

        <div className="ctl ctl--filter">
          <button
            className="filter-trigger ctl-box"
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((v) => !v)}
          >
            <span>
              Filter
              {yearIsOpening ? ` · ${latestYear}` : year.size === 0 ? " · All years" : ""}
            </span>
            {/* how many the reader has added, and a way to undo them without
                opening the sheet: the count, then a cross that clears */}
            {addedFilterCount > 0 && (
              <span className="filter-trigger-count">
                {addedFilterCount}
                <span
                  role="button"
                  tabIndex={0}
                  aria-label="Clear all filters"
                  className="filter-trigger-clear"
                  onClick={(e) => { e.stopPropagation(); clearFilters(); }}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); clearFilters(); } }}
                >
                  ×
                </span>
              </span>
            )}
            {/* drawn, not set: Arial MT has no arrow glyph and the character
                fell through to a blank box. It turns when the panel is up. */}
            <svg
              className="filter-trigger-mark"
              viewBox="0 0 10 10"
              width="10"
              height="10"
              aria-hidden="true"
            >
              <path
                d="M5 0.5 V9 M1.2 5.4 L5 9.2 L8.8 5.4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </svg>
          </button>
        </div>

        <div className="ctl ctl--search">
          {/* the placeholder is drawn rather than native, so its three dots
              can blink in turn - the field reads as thinking while it waits */}
          <div className={`search-field ctl-box${query !== "" ? " search-field--counting" : ""}`}>
            <input
              ref={searchRef}
              className="search"
              aria-label="Search"
              placeholder=""
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              /* Escape empties the field; a second Escape lets go of it */
              onKeyDown={(e) => {
                if (e.key !== "Escape") return;
                e.stopPropagation();
                if (query) setQuery("");
                else e.currentTarget.blur();
              }}
            />
            {query === "" && (
              <span className="search-ghost" aria-hidden="true">
                Search<i /><i /><i />
              </span>
            )}
            {/* how many the search has left, out of what it was searching */}
            {query !== "" && (
              <span className="search-count" aria-live="polite">
                {filtered.length} of {beforeSearch}
              </span>
            )}
          </div>
        </div>

        {/* Shake and the view travel together after the search, shoulder to
            shoulder, so the search can hold its own tracks */}
        <div className="ctl-tail">
        {/* one press, a new order: the grid dealt again */}
        <div className="ctl ctl--shake">
          <button type="button" className="shake-trigger ctl-box" onClick={shake}>
            Shake the grid
          </button>
        </div>

        {/* only the grid has a density; the index is one row a company */}
        <div className="ctl ctl--views">
          {/* Grid or Index in one cell, the open one white. While the grid
              is up its scale sits between the two words: 16, 12, 8, 6 to a
              row, the open stop white, the rest receding. */}
          <div className="views ctl-box" role="radiogroup" aria-label="View">
            <button
              role="radio"
              aria-checked={view === "grid"}
              onClick={() => chooseView("grid")}
              className="views-opt"
            >
              Grid
            </button>
            {view === "grid" && (
              /* a slider: a line with a stop for each density and the knob
                 on the one that is set - o---O. A real range, so it drags
                 as well as clicks. */
              <input
                className="scale"
                type="range"
                min={0}
                max={DENSITIES.length - 1}
                step={1}
                value={density}
                onChange={(e) => chooseDensity(Number(e.target.value))}
                aria-label="How many a row"
                aria-valuetext={`${cols} a row`}
              />
            )}
            <button
              role="radio"
              aria-checked={view === "index"}
              onClick={() => chooseView("index")}
              className="views-opt"
            >
              Index
            </button>
          </div>
        </div>
        </div>
        </div>
      </div>
      </div>

      {/* the dock watches this: while any of the list is on screen the bar
          is at the foot of the window, and when it is gone so is the bar */}
      <div ref={listRef} className="archive-list">
        {filtered.length === 0 ? (
          <div className="empty">
            {query.trim()
              ? `No companies match “${query.trim()}”.`
              : "No companies match these filters."}
            {/* the way out, right where the list ran dry */}
            <button
              type="button"
              className="empty-clear"
              onClick={() => {
                setQuery("");
                clearFilters();
              }}
            >
              Clear search and filters
            </button>
          </div>
        ) : view === "grid" ? (
          <Grid
            list={filtered}
            onSelect={(c) => showCompany(c.slug, "modal")}
            cols={cols}
            phone={phone}
            shows={shows}
          />
        ) : (
          <Index
            list={filtered}
            open={surface === "panel" ? openCo : null}
            onOpen={(slug) => (slug ? showCompany(slug, "panel") : closeSheet())}
            steps={steps}
            undocked={!dockOn}
          />
        )}
      </div>
    </>
  );
}

/* Where the plate lands. Five positions across the band above the prose: the
   picture is somewhere different for every company, and the place is a
   property of the company rather than of the click, so it does not move
   under you while you read. */
const PLATE_SLOTS = 5;
function slotFor(slug: string) {
  // fnv-1a, then avalanche: a plain *31 hash mod 6 clustered badly because
  // 31 % 6 is 1, so the whole thing collapsed to a digit sum
  let h = 0x811c9dc5;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  h ^= h >>> 15;
  h = Math.imul(h, 0x2545f491) >>> 0;
  h = (h ^ (h >>> 13)) >>> 0;
  return h % PLATE_SLOTS;
}



// atelier-amont.ch table: no thumbnails, pure text columns — name / statement /
// sector / geography, each one line, dense single-baseline rows.
function Index({ list, open, onOpen, steps, undocked }: {
  list: Company[];
  open: Company | null;
  onOpen: (slug: string | null) => void;
  steps: Steps;
  /* opened from outside the list, with the dock down: the phone's sheet
     comes to the foot of the window instead of resting on the bar */
  undocked: boolean;
}) {
  /* A row opens a panel on the right rather than unfolding under itself: the
     list keeps its place and the company is read beside it. The panel sits
     under the control row, which is sticky at the top of the page. */
  const isOpen = !!open;
  const indexRef = useRef<HTMLDivElement>(null);

  /* the phone's sheet holds the page still behind it: the page under a sheet
     scrolling along with a thumb read as the sheet coming loose */
  useEffect(() => {
    if (!isOpen || !window.matchMedia("(max-width: 900px)").matches) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  /* NO PICTURE ON HOVER. The index carried a plate that came up as the
     pointer ran down the names - beside the cursor, then parked in one place
     - and either way it was one thing too many over a list this dense. The
     index is type, and a company's picture arrives when you open it. */

  /* A SHEET YOU CAN THROW.
     On a phone the sheet follows a finger down and closes past a threshold,
     and a sideways swipe steps to the company before or after - the arrow
     keys' job, for a thumb. A downward drag only takes the sheet when it is
     already scrolled to its top, so reading down the copy still scrolls. A
     company stepped to this way comes in without rising again. */
  const sheetRef = useRef<HTMLElement>(null);
  const [still, setStill] = useState<string | null>(null);
  const touch = useRef<{ x: number; y: number; top: boolean; axis: "x" | "y" | null } | null>(null);
  const onSheetTouchStart = (e: React.TouchEvent) => {
    if (!window.matchMedia("(max-width: 900px)").matches) return;
    const t = e.touches[0];
    touch.current = {
      x: t.clientX,
      y: t.clientY,
      top: (sheetRef.current?.scrollTop ?? 0) <= 0,
      axis: null,
    };
  };
  const onSheetTouchMove = (e: React.TouchEvent) => {
    const s = touch.current;
    const el = sheetRef.current;
    if (!s || !el) return;
    const t = e.touches[0];
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    if (!s.axis && Math.hypot(dx, dy) > 10) s.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    if (s.axis === "y" && s.top && dy > 0) {
      el.style.animation = "none";
      el.style.transition = "none";
      el.style.transform = `translateY(${dy}px)`;
    }
  };
  const onSheetTouchEnd = (e: React.TouchEvent) => {
    const s = touch.current;
    const el = sheetRef.current;
    touch.current = null;
    if (!s || !el) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    if (s.axis === "y" && s.top && dy > 0) {
      el.style.transition = "transform 200ms ease-out";
      if (dy > 110) {
        el.style.transform = "translateY(100%)";
        setTimeout(() => live.current.onOpen(null), 190);
      } else {
        el.style.transform = "";
      }
      return;
    }
    if (s.axis === "x" && Math.abs(dx) > 60) {
      const to = dx < 0 ? live.current.steps.next : live.current.steps.prev;
      if (to) {
        setStill(to.slug);
        live.current.steps.onStep(dx < 0 ? 1 : -1);
      }
    }
  };

  /* Escape closes; the arrow keys step to the company above or below */
  const live = useRef({ onOpen, steps });
  live.current = { onOpen, steps };
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { live.current.onOpen(null); return; }
      if (typing(e)) return;
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        live.current.steps.onStep(-1);
      } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        live.current.steps.onStep(1);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen]);

  /* a step keeps its row on screen: under the mark at the head, above the
     dock at the foot. Beside the list only - a phone's sheet covers it. */
  const openSlug = open?.slug;
  useEffect(() => {
    if (!openSlug || window.matchMedia("(max-width: 900px)").matches) return;
    const row = indexRef.current?.querySelector<HTMLElement>(
      `[data-slug="${CSS.escape(openSlug)}"]`
    );
    if (!row) return;
    const r = row.getBoundingClientRect();
    const head = document.querySelector(".archive-masthead")?.getBoundingClientRect().height ?? 0;
    const foot = document.querySelector(".dock")?.getBoundingClientRect().height ?? 0;
    if (r.top < head) window.scrollBy({ top: r.top - head - 8 });
    else if (r.bottom > window.innerHeight - foot) {
      window.scrollBy({ top: r.bottom - (window.innerHeight - foot) + 8 });
    }
  }, [openSlug]);

  /* THE PANEL'S HEIGHT IS THE SCREEN LESS THE DOCK.
     The controls used to run under the masthead, so the panel hung from
     their bottom edge; they are in the fixed dock at the foot now, so the
     panel runs from the top of the screen down to the dock. Measured rather
     than assumed: the dock is one row, but that row's height is the type's. */
  useEffect(() => {
    if (!isOpen) return;
    const dock = document.querySelector(".dock");
    if (!dock) return;
    const place = () => {
      const h = dock.getBoundingClientRect().height;
      document.documentElement.style.setProperty(
        "--index-dock-h",
        `${Math.round(h)}px`
      );
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [isOpen]);

  return (
    <div className={`index-view${open ? " index-view--open" : ""}`}>
      <div
        ref={indexRef}
        className={`index${open ? " index--focused" : ""}`}
      >
        {list.map((c) => {
          const rowOpen = open?.slug === c.slug;
          return (
            <div
              key={c.slug}
              data-slug={c.slug}
              className={`index-item${rowOpen ? " index-item--open" : ""}`}
            >
              <button
                className="row"
                aria-expanded={rowOpen}
                onClick={() => onOpen(rowOpen ? null : c.slug)}
              >
                <div className="row-name">
                  {/* the phone's picture: one line tall, before the name.
                      Held as an empty slot when there is none, so the names
                      stay on one edge. Hidden on desktop by the CSS. */}
                  {visualFor(c) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="row-thumb" src={thumb(visualFor(c))} alt="" loading="lazy" />
                  ) : (
                    <span className="row-thumb" aria-hidden="true" />
                  )}
                  {c.name}
                </div>
                <div className="row-statement">{c.statement}</div>
                <div className="row-sector">{c.sectorLabel}</div>
                {/* the index sets the place as codes, on its one track */}
                <div className="row-geo">{abbreviateCountry(c.countries[0])}</div>
              </button>
            </div>
          );
        })}
      </div>

      {/* the band of page above the phone's sheet: a tap there puts it away */}
      {open && (
        <div className="index-sheet-scrim" aria-hidden="true" onClick={() => onOpen(null)} />
      )}

      {open && (
        <aside
          ref={sheetRef}
          className={`index-panel${undocked ? " index-panel--undocked" : ""}${
            still === open.slug ? " index-panel--still" : ""
          }`}
          key={open.slug}
          aria-label={open.name}
          onTouchStart={onSheetTouchStart}
          onTouchMove={onSheetTouchMove}
          onTouchEnd={onSheetTouchEnd}
          onTouchCancel={onSheetTouchEnd}
        >
          <div className="entry entry--spread entry--panel">
            <EntryLayout
              c={open}
              spread
              corner={
                /* no Prev and Next here: the rows beside it are the way
                   through, and the arrow keys (or a swipe) still step. The
                   corner is the close mark's alone; Copy link stands under
                   the copy below. */
                <button
                  className="entry-close"
                  onClick={() => onOpen(null)}
                  aria-label="Close"
                >
                  ✕
                </button>
              }
            />
            <div className="panel-copy">
              <CopyLink slug={open.slug} />
            </div>
          </div>
          {/* on a phone, Prev and Next at the foot of the sheet: the rows are
              under it, so this is the way on to the next company */}
          <div className="sheet-steps">
            <EntrySteps steps={steps} />
            {/* on a phone the link to the company is here, at the right of the
                foot, not squeezed between the name and the close */}
            <CopyLink slug={open.slug} />
          </div>
        </aside>
      )}
    </div>
  );
}

const COUNTRY_ABBREVIATIONS: Record<string, string> = {
  "United Kingdom": "UK",
  "United States": "US",
};

/* and the other way round, for the search: this edition's data writes the
   two short forms, and a reader types the names */
const COUNTRY_NAMES: Record<string, string> = {
  UK: "United Kingdom Great Britain",
  US: "United States USA America",
};

/* The campaign a company belongs to. The data marks the ones in neither as
   "No category"; that is bookkeeping, not a label, so it is never shown. */
const NO_THEME = new Set(["no category", "none", "n/a", "-", ""]);
function themesOf(c: Company) {
  return (c.themes ?? [])
    .map((t) => t.trim())
    .filter((t) => t && !NO_THEME.has(t.toLowerCase()));
}

function abbreviateCountry(country?: string) {
  if (!country) return country;
  return COUNTRY_ABBREVIATIONS[country] ?? country;
}

function Grid({ list, onSelect, cols, phone, shows }: {
  list: Company[];
  onSelect: (c: Company) => void;
  cols: number;
  phone: number;
  shows: string;
}) {
  /* THE CARD: the picture, then the name and the place as a code, what
     they do, and the sector and the campaigns as boxed tags. */
  return (
    <div
      className={`grid grid--${shows}`}
      style={{
        ["--gridcols" as string]: cols,
        ["--gridcols-phone" as string]: phone,
      }}
    >
      {list.map((c) => {
        const code = iso3List(c.countries);
        // the tags: the sector, then the campaigns this company has been
        // drawn into, each in its own box
        const tags = [c.sectorLabel, ...cohortsFor(c.slug)].filter(Boolean);
        return (
          <button key={c.slug} className="card" onClick={() => onSelect(c)}>
            <div className="card-media">
              {visualFor(c) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className={`card-thumb${
                    isLineArt(visualFor(c))
                      ? " card-thumb--line"
                      : visualFor(c).endsWith(".gif")
                        ? " card-thumb--gif"
                        : isClipart(visualFor(c))
                          ? " card-thumb--clip"
                          : isPhoto(visualFor(c))
                            ? " card-thumb--photo"
                            : ""
                  }`}
                  src={visualFor(c)}
                  alt={c.name}
                  loading="lazy"
                />
              ) : (
                <div className="card-thumb--empty" />
              )}
            </div>
            <figcaption className="card-caption">
              <span className="card-head">
                {code ? `${c.name}, ${code}` : c.name}
              </span>
              {CARD_STATEMENT_ON && c.statement && (
                <span className="card-statement">{c.statement}</span>
              )}
              {tags.length > 0 && (
                <span className="card-tags">
                  {tags.map((t) => (
                    <span key={t} className="card-tag">{t}</span>
                  ))}
                </span>
              )}
            </figcaption>
          </button>
        );
      })}
    </div>
  );
}
