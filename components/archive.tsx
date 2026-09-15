"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Company, Facets } from "@/lib/types";
import { visualFor, cohortsFor, thumb, isLineArt, isClipart, isPhoto } from "@/lib/art-direction";
import {
  OPEN_COMPANY_EVENT,
  companyFromUrl,
  writeCompanyUrl,
} from "@/lib/company-link";
import { iso3List } from "@/lib/countries";

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

/* the list's order: this edition first, then alphabetical */
const recent = (c: Company) => (c.years.length ? Math.max(...c.years) : 0);
const byEdition = (a: Company, b: Company) =>
  recent(b) - recent(a) || a.name.localeCompare(b.name);

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
  return [
    { label: "What they fix", body: c.current.fix },
    { label: "What they outperform", body: c.current.outperform },
    { label: "What this means for the future", body: c.current.future },
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

function EntrySteps({ steps }: { steps: Steps }) {
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
    </nav>
  );
}

/* The entry layout, shared by the modal and the Shuffle view so the two are
   the same object rather than two designs that resemble each other. `corner`
   is whatever control belongs in the top right: the close mark in the modal,
   the spin circle in Shuffle. */
function EntryLayout({ c, corner, onImageClick, spread, steps }: {
  c: Company;
  corner: React.ReactNode;
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
      className={`entry-figure${onImageClick ? " entry-figure--action" : ""}`}
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
            {c.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
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
                  {c.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </a>
              )}
            </div>
          </div>
          <div className="entry-verso-foot">
            {/* the lead line is on the recto now, over the plate */}
            {prose}
          </div>
        </div>
        {/* the recto: the name again as a running head, a short caption on
            the record's own line, and the plate under them - the three things
            the reference spread puts on its picture page */}
        <div className="entry-recto">
          <p className="entry-runhead">{c.statement}</p>
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
          onImageClick={onShuffle}
          corner={
            <>
              <EntrySteps steps={steps} />
              <button className="entry-close" onClick={close} aria-label="Close">✕</button>
            </>
          }
        />
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
  const [year, setYear] = useState<Set<string>>(new Set(["2026"]));
  const [query, setQuery] = useState("");
  /* the dock rides the foot of the window, but only while the list it belongs
     to is on screen - an observer rather than a scroll listener, so it costs
     nothing while you read */
  const [dockOn, setDockOn] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setDockOn(e.isIntersecting),
      { rootMargin: "0px 0px -20% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  /* six across, which is the grid the page has always opened on */
  const [density, setDensity] = useState(3);
  const [view, setView] = useState<View>("grid");
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
    list = [...list].sort(byEdition);
    return list;
  }, [companies, sector, country, year, theme, query, haystacks]);

  /* THE OPEN COMPANY
     One company is open at a time, in one of two places: the modal over the
     page, or the panel beside the index (a sheet on a phone). It is kept by
     its slug, and the slug is the page's address, so it can be linked to and
     the back button closes it. */
  const bySlug = useMemo(() => new Map(companies.map((c) => [c.slug, c])), [companies]);
  const sortedAll = useMemo(() => [...companies].sort(byEdition), [companies]);
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [surface, setSurface] = useState<"modal" | "panel">("modal");
  const openRef = useRef<string | null>(null);
  const surfaceRef = useRef(surface);
  surfaceRef.current = surface;
  /* whether this visit put the open company into the history: if it did,
     closing steps back out of it; a company that arrived in the address is
     closed by rewriting the address, so the back button still leaves */
  const pushed = useRef(false);
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

  const activeFilterCount = sector.size + country.size + theme.size + year.size;
  const clearFilters = () => {
    setSector(new Set());
    setCountry(new Set());
    setTheme(new Set());
    setYear(new Set());
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
      <div className={`dock${dockOn ? " dock--on" : ""}${filtersOpen ? " dock--open" : ""}`}>
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
              disabled={activeFilterCount === 0}
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
            <span>Filter</span>
            {/* how many are on, and a way to undo them all without opening
                the sheet: the count, then a cross that clears */}
            {activeFilterCount > 0 && (
              <span className="filter-trigger-count">
                {activeFilterCount}
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
          <div className="search-field ctl-box">
            <input
              className="search"
              aria-label="Search"
              placeholder=""
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query === "" && (
              <span className="search-ghost" aria-hidden="true">
                Search<i /><i /><i />
              </span>
            )}
          </div>
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

      {/* the dock watches this: while any of the list is on screen the bar
          is at the foot of the window, and when it is gone so is the bar */}
      <div ref={listRef} className="archive-list">
        {filtered.length === 0 ? (
          <div className="empty">No companies match these filters.</div>
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
            onOpen={(slug) => (slug ? showCompany(slug, "panel") : closeCompany())}
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
      <div ref={indexRef} className={`index${open ? " index--focused" : ""}`}>
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

      {open && (
        <aside
          className={`index-panel${undocked ? " index-panel--undocked" : ""}`}
          key={open.slug}
          aria-label={open.name}
        >
          <div className="entry entry--spread entry--panel">
            <EntryLayout
              c={open}
              spread
              steps={steps}
              corner={
                <button
                  className="entry-close"
                  onClick={() => onOpen(null)}
                  aria-label="Close"
                >
                  ✕
                </button>
              }
            />
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
