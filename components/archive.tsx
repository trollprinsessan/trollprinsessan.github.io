"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Company, Facets } from "@/lib/types";

// client-only: reads image pixels + WebGL, must never run on the server

// Full-panel filter takeover (radioraheem.it/music "discover" pattern): every
// facet's full option list as a wheel-picker column — a fixed-height scroll-
// snap viewport with a static center line. Drag/scroll or click both select;
// whichever option settles nearest the line wins, same as the reference.
/* climaxbooks.com/filter: ONE panel holding every filter group side by side,
   each a heading over a radio list — rather than three separate dropdowns.
   Their grid is auto-width columns with a ~38px gutter, headings and options
   at the same size, and a 12px circle filled black for the active option. */
function FilterGroup({ title, value, options, onChange }: {
  title: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="filter-group" role="radiogroup" aria-label={title}>
      <span className="filter-group-title">{title}</span>
      <div className="filter-group-list">
        <button
          role="radio"
          aria-checked={value === ""}
          className={`filter-opt${value === "" ? " filter-opt--on" : ""}`}
          onClick={() => onChange("")}
        >
          <span className="filter-dot" aria-hidden="true" />
          All {title.toLowerCase()}
        </button>
        {options.map((o) => (
          <button
            key={o}
            role="radio"
            aria-checked={value === o}
            className={`filter-opt${value === o ? " filter-opt--on" : ""}`}
            onClick={() => onChange(o)}
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
  return [
    { label: "What they fix", body: c.current.fix },
    { label: "What they outperform", body: c.current.outperform },
    { label: "What this means for the future", body: c.current.future },
    { label: "Problem", body: c.legacy.problem },
    { label: "Solution", body: c.legacy.solution },
    { label: "Description", body: c.legacy.description },
  ].filter((s) => s.body && s.body.trim());
}

function CompanyModal({ c, onClose }: { c: Company; onClose: () => void }) {
  const [out, setOut] = useState(false);

  const close = () => { setOut(true); setTimeout(onClose, 140); };

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

  const blocks = sections(c);
  const tags = [c.sectorLabel, abbreviateCountry(c.countries[0])].filter(Boolean);

  return (
    <div className={`modal-backdrop${out ? " modal-backdrop--out" : ""}`} onClick={close}>
      <div className={`modal${out ? " modal--out" : ""}`} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={close} aria-label="Close">✕</button>

        {/* Stacked, not columned: name, statement, image, then the blocks.
            Reads top to bottom like a page rather than across three tracks. */}
        <div className="modal-meta">
          <h2 className="modal-name">{c.name}</h2>
          {tags.length > 0 && (
            <div className="card-tags">
              {tags.map((tag) => (
                <span key={tag} className="card-tag">{tag}</span>
              ))}
            </div>
          )}
        </div>

        {c.statement && <p className="modal-statement">{c.statement}</p>}

        <div className="modal-image">
          {visualFor(c) && <img src={visualFor(c)} alt={c.name} />}
          <span className="modal-image-caption">
            {c.name}{c.yearFounded ? `, ${c.yearFounded}` : c.years[0] ? `, ${c.years[0]}` : ''}
          </span>
        </div>

        {blocks.length > 0 && (
          <div className="modal-blocks">
            {blocks.map((s) => (
              <div key={s.label} className="modal-block">
                <span className="modal-block-label">{s.label}</span>
                <p className="modal-block-body">{s.body}</p>
              </div>
            ))}
          </div>
        )}

        {c.website && (
          <a href={c.website} target="_blank" rel="noopener noreferrer" className="modal-website">
            Visit website
          </a>
        )}
      </div>
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
  const [sector, setSector] = useState("");
  const [country, setCountry] = useState("");
  const [theme, setTheme] = useState("");
  const [year, setYear] = useState("2025");
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
      if (sector && c.sectorLabel !== sector) return false;
      if (country && !c.countries.includes(country)) return false;
      if (theme && !(c.themes ?? []).includes(theme)) return false;
      if (year && !c.years.includes(Number(year))) return false;
      if (q && !(`${c.name} ${c.statement}`.toLowerCase().includes(q))) return false;
      return true;
    });
    const recent = (c: Company) => (c.years.length ? Math.max(...c.years) : 0);
    list = [...list].sort((a, b) => recent(b) - recent(a) || a.name.localeCompare(b.name));
    return list;
  }, [companies, sector, country, year, theme, query]);

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
        {/* a single Filter trigger; every group lives in one panel below */}
        <button
          className="filter-trigger"
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen((v) => !v)}
        >
          Filter
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
          <FilterGroup title="Year" value={year} options={facets.years.map(String)} onChange={setYear} />
          <FilterGroup title="Sector" value={sector} options={facets.sectors} onChange={setSector} />
          <FilterGroup title="Geography" value={country} options={facets.countries} onChange={setCountry} />
          <FilterGroup title="Theme" value={theme} options={facets.themes} onChange={setTheme} />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty">No companies match these filters.</div>
      ) : view === "shuffle" && rouletteCompany ? (
        <Roulette
          company={rouletteCompany}
          spinning={spinning}
          onSpin={doSpin}
          onOpen={() => setModal(rouletteCompany)}
        />
      ) : view === "grid" ? (
        <Grid list={filtered} onSelect={setModal} />
      ) : (
        <Index list={filtered} />
      )}
    </>
  );
}

function Roulette({ company: c, spinning, onSpin, onOpen }: {
  company: Company;
  spinning: boolean;
  onSpin: () => void;
  onOpen: () => void;
}) {
  const tags = [c.sectorLabel, abbreviateCountry(c.countries[0])].filter(Boolean);
  const blocks = sections(c);

  return (
    <div className={`roulette${spinning ? " roulette--spinning" : ""}`}>
      <div className="roulette-image" onClick={onSpin}>
        {visualFor(c)
          ? <img key={c.slug} src={visualFor(c)} alt={c.name} />
          : <div key={c.slug} className="roulette-image-empty" />}
      </div>
      <div className="roulette-body">
        <div className="roulette-card-flash">
          <h2 className="roulette-name">{c.name}</h2>
          {tags.length > 0 && (
            <div className="card-tags">
              {tags.map((tag) => (
                <span key={tag} className="card-tag">{tag}</span>
              ))}
            </div>
          )}
        </div>
        <div className={`roulette-content${spinning ? " roulette-content--hidden" : ""}`}>
          {c.statement && <p className="roulette-statement">{c.statement}</p>}
          {blocks.length > 0 && (
            <div className="roulette-blocks">
              {blocks.map((s) => (
                <div key={s.label} className="roulette-block">
                  <span className="roulette-block-label">{s.label}</span>
                  <p className="roulette-block-body">{s.body}</p>
                </div>
              ))}
            </div>
          )}
          <div className="roulette-actions">
            {c.website && (
              <a href={c.website} target="_blank" rel="noopener noreferrer" className="roulette-link">
                Visit website
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* TEMPORARY, for looking at this year's art direction only.
   Overrides the stock company photography for the first two grid rows with the
   images from "Images to play with" (staged into /public/art-direction). There
   are 11 images and 12 slots, so the last one repeats. Delete this map and the
   visualFor() calls to go back to the real photography. */
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
        const blocks = sections(c);
        // description leads if there is one, otherwise the first block does
        const lead = blocks.find((b) => b.label === "Description") ?? blocks[0];
        const under = blocks.filter((b) => b !== lead);
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
              <div className="row-geo">{c.countries[0]}</div>
            </button>
            {isOpen && (
              <div className="row-detail">

                {/* the description leads across two columns; the remaining
                    categories sit beneath it, one column each */}
                {/* one grid item holding all the prose, so the image and the
                    circle beside it cannot inflate the text rows */}
                {/* left column is the spec stack — theme and subsector tags
                    over the CTA — so the circle no longer floats alone and
                    the column carries information rather than air */}
                <div className="row-detail-meta">
                  {tags.length > 0 && (
                    <div className="card-tags">
                      {tags.map((t) => (
                        <span key={t} className="card-tag">{t}</span>
                      ))}
                    </div>
                  )}
                  {c.website && (
                    <a
                      className="row-detail-cta"
                      href={c.website}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Go to website
                    </a>
                  )}
                </div>

                <div className="row-detail-text">
                  {lead && (
                    <div className="row-detail-block">
                      {/* the lead runs unlabelled — naming it "Description"
                          only restates what the paragraph plainly is */}
                      <p>{lead.body}</p>
                    </div>
                  )}
                  {under.map((b) => (
                    <div key={b.label} className="row-detail-block">
                      <span className="row-detail-label">{b.label}</span>
                      <p>{b.body}</p>
                    </div>
                  ))}
                </div>

                {visualFor(c) && (
                  <img src={visualFor(c)} alt="" className="row-detail-img" />
                )}
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

function abbreviateCountry(country?: string) {
  if (!country) return country;
  return COUNTRY_ABBREVIATIONS[country] ?? country;
}

function Grid({ list, onSelect }: {
  list: Company[];
  onSelect: (c: Company) => void;
}) {
  return (
    <div className="grid">
      {list.map((c) => {
        const tags = [c.sectorLabel, abbreviateCountry(c.countries[0])].filter(Boolean);
        return (
          <button key={c.slug} className="card" onClick={() => onSelect(c)}>
            <span className="card-name">{c.name}</span>
            <div className="card-media">
              {visualFor(c) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="card-thumb" src={visualFor(c)} alt={c.name} loading="lazy" />
              ) : (
                <div className="card-thumb--empty" />
              )}
            </div>
            {c.statement && <p className="card-statement">{c.statement}</p>}
            {tags.length > 0 && (
              <div className="card-tags">
                {tags.map((tag) => (
                  <span key={tag} className="card-tag">{tag}</span>
                ))}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
