"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Company, Facets } from "@/lib/types";

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


type View = "index" | "grid" | "shuffle";

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
  /* everything the named rows do not already carry: secondary sectors, themes */
  const meta = [
    ...c.subsector.split(",").map((x) => x.trim()).filter(Boolean),
    ...(c.themes ?? []),
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
    const url = c.website ? c.website.replace(/^https?:\/\//, "").replace(/\/$/, "") : "";
    return (
      <>
        {head}
        {/* the verso: the name over the plate */}
        <div className="entry-verso">
          {name}
          {figure}
        </div>
        {/* the recto: the lead line and the body at the head; the record
            lower, as the book's does - the name, then the facts with no
            labels; the page number in the foot */}
        <div className="entry-recto">
          {statement}
          {prose}
          <div className="entry-record">
            <span className="entry-record-name">{c.name}</span>
            <div className="entry-record-values">
              <span>{c.countries.map(abbreviateCountry).join(", ")}</span>
              {c.sectorLabel && <span>{c.sectorLabel}</span>}
              {meta.length > 0 && <span>{meta.join(", ")}</span>}
              {url && (
                <a href={c.website} target="_blank" rel="noopener noreferrer">{url}</a>
              )}
            </div>
          </div>
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

function CompanyModal({ c, onClose }: { c: Company; onClose: () => void }) {
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
        className={`entry${out ? " entry--out" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <EntryLayout
          c={c}
          corner={
            <button className="entry-close" onClick={close} aria-label="Close">✕</button>
          }
        />
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
  const [seed, setSeed] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const spinTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [modal, setModal] = useState<Company | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  const rouletteCompany = view === "shuffle" && filtered.length > 0
    ? filtered[seed % filtered.length]
    : null;

  const doSpin = () => {
    if (filtered.length === 0) return;
    spinTimers.current.forEach(clearTimeout);
    spinTimers.current = [];
    setView("shuffle");
    setSpinning(true);
    const target = Math.floor(Math.random() * filtered.length);
    const gaps = [30, 40, 55, 80, 120, 175, 250];
    let elapsed = 0;
    gaps.forEach((gap, i) => {
      elapsed += gap;
      const isLast = i === gaps.length - 1;
      spinTimers.current.push(setTimeout(() => {
        setSeed(isLast ? target : Math.floor(Math.random() * filtered.length));
        if (isLast) setSpinning(false);
      }, elapsed));
    });
  };

  return (
    <>
      {modal && <CompanyModal c={modal} onClose={() => setModal(null)} />}

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
          {activeFilterCount > 0 && (
            <span className="filter-trigger-count">({activeFilterCount})</span>
          )}
        </button>

        {/* one control per row column: Filter over the name column, search
            over the statement, view radios over sector/geography */}
        <input
          className="search"
          placeholder="Search…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="views" role="radiogroup" aria-label="View">
          {([
            ["index", "Index"],
            ["grid", "Grid"],
            ["shuffle", "Shuffle"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              role="radio"
              aria-checked={view === key}
              onClick={() => (key === "shuffle" ? doSpin() : setView(key))}
              className={`views-opt${view === key ? " views-opt--on" : ""}`}
            >
              <span className="views-dot" aria-hidden="true" />
              {label}
            </button>
          ))}
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
      ) : view === "shuffle" && rouletteCompany ? (
        <Roulette
          company={rouletteCompany}
          spinning={spinning}
          onSpin={doSpin}
        />
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

function Roulette({ company: c, spinning, onSpin }: {
  company: Company;
  spinning: boolean;
  onSpin: () => void;
}) {
  /* The stage is one screen minus whatever the masthead and the control row
     actually take. Both are responsive - the masthead wordmark scales with
     the viewport - so the figure has to be measured rather than assumed, or
     the foot of the page is cropped by the difference. */
  useEffect(() => {
    const archive = document.getElementById("archive");
    if (!archive) return;
    const head = archive.querySelector(".archive-masthead");
    const controls = archive.querySelector(".controls");
    if (!head || !controls) return;
    const measure = () => {
      const h = head.getBoundingClientRect().height +
        controls.getBoundingClientRect().height;
      archive.style.setProperty("--shuffle-head", `${Math.ceil(h)}px`);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(head);
    ro.observe(controls);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  /* the same layout the modal uses, laid inline in the page instead of on a
     floating plate; the spin circle takes the corner the close mark holds.
     The wrapper is what folds: it grows from nothing to the stage's height
     while the entry inside is already laid out at full size, so the module
     unfolds under the controls rather than switching in like a tab. */
  return (
    <div className="entry-fold">
      <div
        className={`entry entry--inline entry--slot${slotFor(c.slug)}${
          spinning ? " entry--spinning" : ""
        }`}
        key={c.slug}
      >
        {/* the image is the spin control: clicking it draws another company */}
        <EntryLayout c={c} corner={null} onImageClick={onSpin} spread />
      </div>
    </div>
  );
}

/* TEMPORARY, for looking at this year's art direction only.
   Overrides the stock company photography for the first two grid rows with the
   images staged into /public/art-direction. Delete this map and the visualFor()
   calls to go back to the real photography. */
const ART_DIRECTION: Record<string, string> = {
  "aerleum": "/art-direction/hsdgs.png",
  "aerones": "/art-direction/improx2.png",
  "again-bio": "/art-direction/stellarator_spin.gif",
  "agricarbon": "/art-direction/jksdjksdj.png",
  "alcemy": "/art-direction/hksjdhsj.png",
  "amini": "/art-direction/jhsdgsh.png",
  "anthro-energy": "/art-direction/kssgdhjs.png",
  "arbonics": "/art-direction/hsjd.png",
  "arnergy": "/art-direction/djhdjdf.png",
  "arsenale-bioyards": "/art-direction/oneka-buoy.gif",
  "ataraxis": "/art-direction/original_ea8093b43ed5e95103870bc6002e343e.png",
  "avelios": "/art-direction/hsdgs.png",
};

function visualFor(c: Company) {
  return ART_DIRECTION[c.slug] ?? c.visual;
}

// atelier-amont.ch table: no thumbnails, pure text columns — name / statement /
// sector / geography, each one line, dense single-baseline rows.
function Index({ list }: { list: Company[] }) {
  // index rows disclose inline rather than opening the modal — one at a time,
  // like the nomination-partners control in the manifest
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className={`index${open ? " index--focused" : ""}`}>
      {list.map((c) => {
        const isOpen = open === c.slug;
        // Description dropped: Problem and Solution carry the row now,
        // same content policy as the company pages (EntryLayout).
        const blocks = sections(c).filter((b) => b.label !== "Description");
        // sector and geography already sit in the row's own columns, so the
        // detail tags carry what the row does not: theme, then subsector.
        // Subsector is a comma-joined string in the data, and only the 2025
        // cohort has one — fall back to the sector so the stack is never empty.
        const subs = c.subsector
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);
        const tags = [...(c.themes ?? []), ...(subs.length ? subs : [c.sectorLabel])];
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
            {isOpen && (
              <div className="row-detail">

                {/* the description leads across two columns; the remaining
                    categories sit beneath it, one column each */}
                {/* one grid item holding all the prose, so the image and the
                    circle beside it cannot inflate the text rows */}
                {/* the picture alone in the meta column now - the record
                    below carries what the tag pills and the circle used to */}
                <div className="row-detail-meta">
                  {visualFor(c) && (
                    <img src={visualFor(c)} alt="" className="row-detail-img" />
                  )}
                </div>

                <div className="row-detail-text">
                  {blocks.map((b) => (
                    <div key={b.label} className="row-detail-block">
                      <p>{b.body}</p>
                    </div>
                  ))}
                </div>

                {/* the same record the company pages use, in the column the
                    circle held - Meta carries what the tag pills used to */}
                <dl className="row-detail-spec">
                  <div className="row-detail-spec-cell">
                    <dt>Status</dt>
                    <dd>{c.returning ? "Returning" : "Newcomer"}</dd>
                  </div>
                  <div className="row-detail-spec-cell">
                    <dt>Founded</dt>
                    <dd>{c.yearFounded ?? "—"}</dd>
                  </div>
                  <div className="row-detail-spec-cell">
                    <dt>Meta</dt>
                    <dd>{tags.length ? tags.join(", ") : "—"}</dd>
                  </div>
                  <div className="row-detail-spec-cell">
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
              </div>
            )}
          </div>
        );
      })}
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
                <img className="card-thumb" src={visualFor(c)} alt={c.name} loading="lazy" />
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
              {c.statement && (
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
