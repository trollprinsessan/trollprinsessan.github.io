"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Company, Facets } from "@/lib/types";
import { visualFor, isPhoto } from "@/lib/art-direction";

// client-only: reads image pixels + WebGL, must never run on the server

// norrsken.org/100's own filter, rebuilt in this system: every group's full
// option list is exposed at once — no inner scroll, pills wrap onto as many
// lines as they need — and every group is multi-select (checkboxes, not
// radios), so "ClimateTech" and "FinTech" can both be on at the same time.
// The reference inverts a pill to white-on-black the instant it's checked and
// updates a live "N/352" count before you ever hit its "Show results"; both
// carried over here in the site's own black-on-white idiom.
function FilterGroup({ title, value, options, onChange, wide }: {
  title: string;
  value: Set<string>;
  options: string[];
  onChange: (v: Set<string>) => void;
  /* a long list (Geography's 41 countries) takes two page tracks and splits
     its own options across two columns rather than running 800px down */
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
      <span className="filter-group-title">{title}</span>
      <div className="filter-group-list" role="group" aria-label={title}>
        {options.map((o) => (
          <button
            key={o}
            role="checkbox"
            aria-checked={value.has(o)}
            className={`filter-opt${value.has(o) ? " filter-opt--on" : ""}`}
            onClick={() => toggle(o)}
          >
            <span className="filter-dot" aria-hidden="true" />
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}


type View = "index" | "grid";

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

/* The entry layout, shared by the modal and the Shuffle view so the two are
   the same object rather than two designs that resemble each other. `corner`
   is whatever control belongs in the top right: the close mark in the modal,
   the spin circle in Shuffle. */
function EntryLayout({ c, corner, onImageClick, spread }: {
  c: Company;
  corner: React.ReactNode;
  onImageClick?: () => void;
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
  const name = <h2 className="entry-name">{c.name}</h2>;
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

function CompanyModal({ c, onClose, onShuffle, spinning }: {
  c: Company;
  onClose: () => void;
  /* the draw lives in here now: pressing the picture, or the control at the
     foot, rolls another company into the same plate without closing it */
  onShuffle?: () => void;
  spinning?: boolean;
}) {
  const [out, setOut] = useState(false);

  /* matches the exit animation, so the plate is gone before it unmounts */
  const close = () => { setOut(true); setTimeout(onClose, 540); };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`entry-scrim${out ? " entry-scrim--out" : ""}`} onClick={close}>
      <article
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
            <button className="entry-close" onClick={close} aria-label="Close">✕</button>
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
  const [year, setYear] = useState<Set<string>>(new Set(["2025"]));
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>("grid");
  const [modal, setModal] = useState<Company | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const spinTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => spinTimers.current.forEach(clearTimeout), []);

  /* choosing a view puts the filter panel away: the panel is a detour off the
     row, and picking a view means you are done with it */
  const chooseView = (v: View) => {
    setView(v);
    setFiltersOpen(false);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = companies.filter((c) => {
      if (sector.size && !sector.has(c.sectorLabel)) return false;
      if (country.size && !c.countries.some((x) => country.has(x))) return false;
      if (theme.size && !(c.themes ?? []).some((x) => theme.has(x))) return false;
      if (year.size && !c.years.some((x) => year.has(String(x)))) return false;
      if (q && !(`${c.name} ${c.statement}`.toLowerCase().includes(q))) return false;
      return true;
    });
    const recent = (c: Company) => (c.years.length ? Math.max(...c.years) : 0);
    list = [...list].sort((a, b) => recent(b) - recent(a) || a.name.localeCompare(b.name));
    return list;
  }, [companies, sector, country, year, theme, query]);

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
        setModal((current) => pick(isLast ? current?.slug : undefined));
        if (isLast) setSpinning(false);
      }, elapsed));
    });
  };

  return (
    <>
      {modal && (
        <CompanyModal
          c={modal}
          onClose={() => setModal(null)}
          onShuffle={doSpin}
          spinning={spinning}
        />
      )}

      <div className="controls">
        {/* a single Filter trigger; every group lives in one panel below.
            The count badge is the same "how many are on" signal the
            reference gives on its pills, surfaced here too so it reads even
            with the panel closed. */}
        {/* a single Filter trigger; every group lives in one panel below.
            The count badge is the same "how many are on" signal the
            reference gives on its pills, surfaced here too so it reads even
            with the panel closed. */}
        <button
          className="filter-trigger"
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen((v) => !v)}
        >
          Filter
          {activeFilterCount > 0 ? (
            <span className="filter-trigger-count">({activeFilterCount})</span>
          ) : (
            /* nothing is on, so the count has nothing to say: the mark tells
               you the panel folds out instead, and turns when it is open.
               Drawn, not set: Arial MT has no arrow glyph and the character
               fell through to a blank box. */
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
          )}
        </button>

        {/* one control per row column: Filter over the name column, search
            over the statement, view radios over sector/geography */}
        {/* the placeholder is drawn rather than native, so its three dots can
            blink in turn - the field reads as thinking while it waits */}
        <div className="search-field">
          <input
            className="search"
            aria-label="Search"
            placeholder="Search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query === "" && (
            <span className="search-ghost" aria-hidden="true">
              Search<i /><i /><i />
            </span>
          )}
        </div>

        <div className="views">
          {/* one mark between the two words, not one each: the dot sits on
              the side of whichever view is open */}
          <div
            className={`views-toggle views-toggle--${view}`}
            role="radiogroup"
            aria-label="View"
          >
            <button
              role="radio"
              aria-checked={view === "grid"}
              onClick={() => chooseView("grid")}
              className="views-opt"
            >
              Grid
            </button>
            {/* the switch itself is a control: flicking it swaps the view */}
            <button
              type="button"
              className="views-dot"
              aria-label={view === "grid" ? "Switch to Index" : "Switch to Grid"}
              onClick={() => chooseView(view === "grid" ? "index" : "grid")}
            />
            <button
              role="radio"
              aria-checked={view === "index"}
              onClick={() => chooseView("index")}
              className="views-opt"
            >
              Index
            </button>
          </div>
          {/* Parked, not deleted: Shuffle draws one of the hundred into the
              modal. Flip SHUFFLE_ON to bring it back. */}
          {SHUFFLE_ON && (
            <button className="views-draw" onClick={doSpin}>Shuffle</button>
          )}
        </div>
      </div>

      {filtersOpen && (
        <div className="filter-panel">
          <div className="filter-panel-groups">
            <FilterGroup title="Year" value={year} options={facets.years.map(String)} onChange={setYear} />
            <FilterGroup title="Sector" value={sector} options={facets.sectors} onChange={setSector} />
            <FilterGroup title="Geography" value={country} options={facets.countries} onChange={setCountry} wide />
            <FilterGroup title="Theme" value={theme} options={facets.themes} onChange={setTheme} />
          </div>
          {/* live count, updating on every pill click before "Show results"
              is ever pressed - the reference's own N/352 read live too */}
          <div className="filter-panel-footer">
            <button
              className="filter-clear"
              onClick={clearFilters}
              disabled={activeFilterCount === 0}
            >
              Clear filters
            </button>
            <span className="filter-count">
              {filtered.length} of {companies.length} companies
            </span>
            <button className="filter-apply" onClick={() => setFiltersOpen(false)}>
              Show results
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty">No companies match these filters.</div>
      ) : view === "grid" ? (
        <Grid list={filtered} onSelect={setModal} />
      ) : (
        <Index list={filtered} />
      )}
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
function Index({ list }: { list: Company[] }) {
  /* A row opens a panel on the right rather than unfolding under itself: the
     list keeps its place and the company is read beside it. The panel sits
     under the control row, which is sticky at the top of the page. */
  const [open, setOpen] = useState<string | null>(null);
  const shown = list.find((c) => c.slug === open) ?? null;

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  /* a row that is filtered away must not leave its panel behind */
  useEffect(() => {
    if (open && !list.some((c) => c.slug === open)) setOpen(null);
  }, [list, open]);

  /* the panel starts under the control row wherever that row currently is:
     it is sticky, so its bottom sits at 52 once the page has scrolled past
     the masthead and lower than that before. Measured rather than assumed. */
  useEffect(() => {
    if (!open) return;
    const controls = document.querySelector(".controls");
    if (!controls) return;
    const place = () => {
      const bottom = controls.getBoundingClientRect().bottom;
      document.documentElement.style.setProperty(
        "--index-panel-top",
        `${Math.max(0, Math.round(bottom))}px`
      );
    };
    place();
    window.addEventListener("scroll", place, { passive: true });
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place);
      window.removeEventListener("resize", place);
    };
  }, [open]);

  return (
    <div className={`index-view${open ? " index-view--open" : ""}`}>
      <div className={`index${open ? " index--focused" : ""}`}>
        {list.map((c) => {
          const isOpen = open === c.slug;
          return (
            <div key={c.slug} className={`index-item${isOpen ? " index-item--open" : ""}`}>
              <button
                className="row"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : c.slug)}
              >
                <div className="row-name">{c.name}</div>
                <div className="row-statement">{c.statement}</div>
                <div className="row-sector">{c.sectorLabel}</div>
                <div className="row-geo">{abbreviateCountry(c.countries[0])}</div>
              </button>
            </div>
          );
        })}
      </div>

      {shown && (
        <aside className="index-panel" key={shown.slug}>
          <div className="entry entry--spread entry--panel">
            <EntryLayout
              c={shown}
              spread
              corner={
                <button
                  className="entry-close"
                  onClick={() => setOpen(null)}
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

function Grid({ list, onSelect }: {
  list: Company[];
  onSelect: (c: Company) => void;
}) {
  /* Plates, after the Yoko Ono catalogue: the picture sits on the page with
     air around it and the caption runs centred beneath it in the small
     regular size - a plate number, the name in italic, then the facts, in
     the book's own order and punctuation. Nothing is bold and nothing is
     boxed; the pill tags are folded into the caption line. */
  return (
    <div className="grid">
      {list.map((c) => {
        const facts = [c.sectorLabel, abbreviateCountry(c.countries[0])]
          .filter(Boolean)
          .join(", ");
        // the campaign tags. "No category" is the data's way of saying a
        // company belongs to neither, so it is never printed.
        const tags = themesOf(c);
        return (
          <button key={c.slug} className="card" onClick={() => onSelect(c)}>
            <div className="card-media">
              {visualFor(c) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className={`card-thumb${isPhoto(visualFor(c)) ? " card-thumb--photo" : ""}`}
                  src={visualFor(c)}
                  alt={c.name}
                  loading="lazy"
                />
              ) : (
                <div className="card-thumb--empty" />
              )}
            </div>
            <figcaption className="card-caption">
              {/* the Latest card's own system: one size and one weight, with
                  the hierarchy carried by case, spacing and a single grey.
                  Name, then what and where, then what they do, then the
                  campaign - the title / category / body / date pattern. */}
              <span className="card-name">{c.name}</span>
              {facts && <span className="card-facts">{facts}</span>}
              {CARD_STATEMENT_ON && c.statement && (
                <span className="card-statement">{c.statement}</span>
              )}
              {tags.length > 0 && (
                <span className="card-themes">{tags.join(", ")}</span>
              )}
            </figcaption>
          </button>
        );
      })}
    </div>
  );
}
