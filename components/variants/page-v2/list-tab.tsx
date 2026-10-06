"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./list-tab.css";
import "./compact.css";
import Archive, { type ListControls, type ListHost } from "@/components/archive";
import type { Company, Facets } from "@/lib/types";
import { ELECTRO_UNION, PROMPT_WHAT_MATTERS } from "@/lib/art-direction";
import { NO_CAMPAIGN } from "@/components/variants/badge/badge";

/* PAGE-V2: THE LIST IN A TAB OFF THE FOOT OF THE WINDOW.
   The list is not in the page. It is always there instead, in a tab that
   stands at the foot of the window: one row of the dock's black slots - the
   list and its count, the filters as drop-downs, the search, and the views -
   and pressing any of them folds the tab up over the page with the list
   under the row. Filter and list are one thing. The views are listview-v#'s,
   whichever is chosen, and the company opens as it does in the page.

   The tab comes after the intro, like everything else on the page. */

/* the dock's own fold-out mark, drawn - Arial MT has no arrow glyph */
function Mark() {
  return (
    <svg className="p2-mark" viewBox="0 0 10 10" width="10" height="10" aria-hidden="true">
      <path d="M5 0.5 V9 M1.2 5.4 L5 9.2 L8.8 5.4" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

/* A GROUP, AS IN THE ORIGINAL FILTER SHEET: every option a word, on when
   inverted, the group's own Clear the moment anything in it is on. */
function Group({
  title,
  value,
  options,
  onChange,
  single = false,
  noAll = false,
  labelOf,
  fold,
  open: openGroup,
  onFold,
}: {
  title: string;
  value: Set<string>;
  options: string[];
  onChange: (v: Set<string>) => void;
  /* one choice at a time, with "All" first (the categories) */
  single?: boolean;
  /* one choice always: no "All", and the choice is not undone (the year) */
  noAll?: boolean;
  labelOf?: (o: string) => string;
  /* a phone folds the four groups: the head is the handle, and what is
     chosen stands on it so a folded group still says where it is */
  fold?: boolean;
  open?: boolean;
  onFold?: () => void;
}) {
  const toggle = (o: string) => {
    if (single) {
      onChange(value.has(o) ? (noAll ? value : new Set()) : new Set([o]));
      return;
    }
    const next = new Set(value);
    if (next.has(o)) next.delete(o);
    else next.add(o);
    onChange(next);
  };
  const chosen = value.size
    ? [...value].map((v) => (labelOf ? labelOf(v) : v)).join(", ")
    : "All";
  if (fold) {
    return (
      <div className={`filter-group filter-group--fold${openGroup ? " is-open" : ""}`}>
        <button
          type="button"
          className="filter-group-head filter-group-handle"
          aria-expanded={!!openGroup}
          onClick={onFold}
        >
          <span className="filter-group-title">{title}</span>
          <span className="filter-group-chosen">{chosen}</span>
        </button>
        {openGroup && (
          <div className="filter-group-list" role="group" aria-label={title}>
            {single && !noAll && (
              <button
                type="button"
                role="checkbox"
                aria-checked={value.size === 0}
                className={`filter-opt${value.size === 0 ? " filter-opt--on" : ""}`}
                onClick={() => onChange(new Set())}
              >
                All
              </button>
            )}
            {options.map((o) => (
              <button
                key={o}
                type="button"
                role="checkbox"
                aria-checked={value.has(o)}
                className={`filter-opt${value.has(o) ? " filter-opt--on" : ""}`}
                onClick={() => toggle(o)}
              >
                {labelOf ? labelOf(o) : o}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="filter-group">
      <div className="filter-group-head">
        <span className="filter-group-title">{title}</span>
        {value.size > 0 && !single && (
          <button type="button" className="filter-group-clear" onClick={() => onChange(new Set())}>
            Clear
          </button>
        )}
      </div>
      <div className="filter-group-list" role="group" aria-label={title}>
        {single && !noAll && (
          <button
            type="button"
            role="checkbox"
            aria-checked={value.size === 0}
            className={`filter-opt${value.size === 0 ? " filter-opt--on" : ""}`}
            onClick={() => onChange(new Set())}
          >
            All
          </button>
        )}
        {options.map((o) => (
          <button
            key={o}
            type="button"
            role="checkbox"
            aria-checked={value.has(o)}
            className={`filter-opt${value.has(o) ? " filter-opt--on" : ""}`}
            onClick={() => toggle(o)}
          >
            {labelOf ? labelOf(o) : o}
          </button>
        ))}
      </div>
    </div>
  );
}

/* the companies in neither campaign: the photobook's third chapter, a
   category only here, in the dock's choice */
const MORE_LABEL = `${100 - ELECTRO_UNION.length - PROMPT_WHAT_MATTERS.length} more ways to fix the future`;
const themeLabel = (o: string) => (o === NO_CAMPAIGN ? MORE_LABEL : o);

type Drop = "year" | "sector" | "country" | "theme" | "all" | null;

/* the row, shared with page-v4's bar at the foot */
/* THE SLIDER'S STOPS: sixteen, twelve and six a row - eight is
   left out - then the categories, then the index. A number is the grid's
   density stop. */
const STOPS: (number | "cat" | "index")[] = [0, 1, 3, "cat", "index"];
function stopOf(c: ListControls) {
  if (c.view === "index") return STOPS.indexOf("index");
  if (c.cat) return STOPS.indexOf("cat");
  const i = STOPS.indexOf(c.density);
  return i >= 0 ? i : 2;
}

export function Controls({
  c,
  open,
  setOpen,
  searchRef,
  drawer = false,
}: {
  c: ListControls;
  open: boolean;
  setOpen: (v: boolean) => void;
  searchRef: React.RefObject<HTMLInputElement | null>;
  /* the drawer (page-v2, -v3): its title folds it; elsewhere only the count */
  drawer?: boolean;
}) {
  const [drop, setDrop] = useState<Drop>(null);
  /* and on a phone, which of the four groups inside the Filter sheet is
     unfolded - one at a time, so the sheet stays the height of a hand */
  const [fold, setFold] = useState<string | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  /* a drop-down closes on Escape and on a press anywhere off it */
  useEffect(() => {
    if (!drop) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setDrop(null);
      }
    };
    const onPress = (e: PointerEvent) => {
      if (!(e.target as Element | null)?.closest?.(".p2-drop")) setDrop(null);
    };
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("pointerdown", onPress);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("pointerdown", onPress);
    };
  }, [drop]);
  /* folding the tab away puts any drop-down away with it */
  useEffect(() => {
    if (!open) setDrop(null);
  }, [open]);
  useEffect(() => {
    if (drop !== "all") setFold(null);
  }, [drop]);

  /* anything reached for in the row brings the list up */
  const reach = () => {
    if (!open) setOpen(true);
  };
  const toggleDrop = (d: Drop) => {
    reach();
    setDrop((x) => (x === d ? null : d));
  };

  const yearIsOpening = c.year.size === 1 && c.year.has(c.latestYear);
  const groups: {
    key: Exclude<Drop, "all" | null>;
    title: string;
    value: Set<string>;
    options: string[];
    onChange: (v: Set<string>) => void;
    wide?: boolean;
    single?: boolean;
    noAll?: boolean;
    labelOf?: (o: string) => string;
  }[] = [
    /* each edition is a list of its own, a hundred companies: one year at a
       time, never all of them together */
    {
      key: "year",
      title: "Year",
      value: c.year.size ? c.year : new Set([c.latestYear]),
      options: c.facets.years.map(String),
      onChange: (v: Set<string>) => c.setYear(v.size ? v : new Set([c.latestYear])),
      single: true,
      noAll: true,
    },
    { key: "sector", title: "Sector", value: c.sector, options: c.facets.sectors, onChange: c.setSector },
    { key: "country", title: "Geography", value: c.country, options: c.facets.countries, onChange: c.setCountry, wide: true },
    {
      key: "theme",
      title: "Theme",
      value: c.theme,
      /* the third chapter only with the switch more56 on: it is no category */
      options: [...c.facets.themes.filter((t) => t !== NO_CAMPAIGN), ...([])],
      onChange: c.setTheme,
      single: true,
      labelOf: themeLabel,
    },
  ];
  const { cols } = c.densities[c.density];

  return (
    <div className="p2-row" ref={rowRef}>
      {/* THE VIEWS FIRST, at the left, and ONE SLIDER THROUGH THEM: the
          grid's stops, then the categories, then the index (STOPS). The last
          stop is the same as pressing Index. The slider is always there; the
          word not chosen is grey. */}
      <div className="views ctl-box p2-views p2-desk" role="radiogroup" aria-label="View">
        <button
          type="button"
          role="radio"
          aria-checked={c.view === "grid"}
          className="views-opt"
          onClick={() => {
            reach();
            c.setCat(false);
            c.chooseView("grid");
          }}
        >
          Grid
        </button>
        <input
          className="scale"
          type="range"
          min={0}
          max={STOPS.length - 1}
          step={1}
          value={stopOf(c)}
          onChange={(e) => {
            reach();
            const s = STOPS[Number(e.target.value)];
            if (s === "index") {
              c.setCat(false);
              c.setCompact(false);
              c.chooseView("index");
              return;
            }
            c.setCompact(false);
            if (s === "cat") {
              c.setCat(true);
              if (c.view === "index") c.chooseView("grid");
              return;
            }
            c.setCat(false);
            if (c.view === "index") c.chooseView("grid");
            c.chooseDensity(s);
          }}
          aria-label="Grid, how many a row, the categories, or the index"
          aria-valuetext={c.view === "index" ? "Index" : c.cat ? "Categories" : `${cols} a row`}
        />
        <button
          type="button"
          role="radio"
          aria-checked={c.view === "index"}
          className="views-opt"
          onClick={() => {
            reach();
            c.setCompact(false);
            c.setCat(false);
            c.chooseView("index");
          }}
        >
          Index
        </button>
      </div>

      {/* A PHONE: three words for the three views - the grid (one size),
          the categories and the index, which it opens on */}
      <div className="views ctl-box p2-views p2-phone p2-phoneviews" role="radiogroup" aria-label="View">
        {(
          [
            ["grid", "Grid"],
            ["cat", "Categories"],
            ["index", "Index"],
          ] as const
        ).map(([k, label]) => {
          const on = k === "index" ? c.view === "index" : k === "cat" ? c.view === "grid" && c.cat : c.view === "grid" && !c.cat;
          return (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={on}
              className="views-opt"
              onClick={() => {
                c.setCompact(false);
                c.setCat(k === "cat");
                c.chooseView(k === "index" ? "index" : "grid");
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* the filters, each its own drop-down on a desktop */}
      {groups.map((g) => {
        const on = g.key === "year" ? (yearIsOpening ? 0 : g.value.size) : g.value.size;
        return (
          <div key={g.key} className="p2-drop p2-desk">
            <button
              type="button"
              className="ctl-box p2-slot"
              aria-expanded={drop === g.key}
              aria-haspopup="true"
              onClick={() => toggleDrop(g.key)}
            >
              <span>
                {g.title}
                {/* the edition shown, always: it is one choice, never a count */}
                {g.key === "year" ? ` · ${c.year.size ? [...c.year][0] : c.latestYear}` : ""}
              </span>
              {on > 0 && g.key !== "year" && <span className="p2-count">{on}</span>}
              <Mark />
            </button>
            {drop === g.key && (
              <div className={`p2-drop-panel${g.wide ? " p2-drop-panel--wide" : ""}`}>
                <Group title={g.title} value={g.value} options={g.options} onChange={g.onChange} single={g.single} noAll={g.noAll} labelOf={g.labelOf} />
              </div>
            )}
          </div>
        );
      })}

      {/* a phone has one Filter, the four groups stacked in it */}
      <div className="p2-drop p2-phone">
        <button
          type="button"
          className="ctl-box p2-slot"
          aria-expanded={drop === "all"}
          aria-haspopup="true"
          onClick={() => toggleDrop("all")}
        >
          <span>Filter</span>
          {c.addedFilterCount > 0 && <span className="p2-count">{c.addedFilterCount}</span>}
          <Mark />
        </button>
        {drop === "all" && (
          <div className="p2-drop-panel p2-drop-panel--all">
            {groups.map((g) => (
              <Group
                key={g.key}
                title={g.title}
                value={g.value}
                options={g.options}
                onChange={g.onChange}
                single={g.single}
                noAll={g.noAll}
                labelOf={g.labelOf}
                fold
                open={fold === g.key}
                onFold={() => setFold((x) => (x === g.key ? null : g.key))}
              />
            ))}
          </div>
        )}
      </div>

      {/* the search, as in the dock: the placeholder drawn so its dots blink */}
      <div className="p2-search">
        <div className={`search-field ctl-box${c.query !== "" ? " search-field--counting" : ""}`}>
          <input
            ref={searchRef}
            className="search"
            aria-label="Search"
            placeholder=""
            value={c.query}
            onFocus={reach}
            onChange={(e) => c.setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Escape") return;
              e.stopPropagation();
              if (c.query) c.setQuery("");
              else e.currentTarget.blur();
            }}
          />
          {c.query === "" && (
            <span className="search-ghost" aria-hidden="true">
              Search<i /><i /><i />
            </span>
          )}
          {c.query !== "" && (
            <span className="search-count" aria-live="polite">
              {c.count} of {c.beforeSearch}
            </span>
          )}
        </div>
      </div>

      {c.addedFilterCount > 0 && (
        <button type="button" className="ctl-box p2-slot p2-desk" onClick={c.clearFilters}>
          Clear
        </button>
      )}

      {/* the random ones: the grid dealt again, and one company drawn */}
      <button
        type="button"
        className="ctl-box p2-slot p2-desk p2-shake"
        onClick={() => {
          reach();
          c.shake();
        }}
      >
        Shake the grid
      </button>
      <button type="button" className="ctl-box p2-slot" onClick={c.spin}>
        Shuffle
      </button>

      {/* THE LIST, in the right corner: its name and how many are showing -
          the edition's hundred, or what the filters and the search
          leave - and its mark, up while the tab is down, down while it is up.
          Pressing it folds the tab up, or back down the way it came. */}
      {drawer ? (
        <button
          type="button"
          className="ctl-box p2-slot p2-title"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span>The List</span>
          {/* how many are showing - the edition, or what the filters leave */}
          <span className="p2-count">{c.count}</span>
          <Mark />
        </button>
      ) : (
        /* not a drawer: only the number, as the filters and the search
           leave it - pressed, the page goes to the list's head */
        <button
          type="button"
          className="ctl-box p2-slot p2-title p2-title--count"
          aria-label={`${c.count} companies - to the top of the list`}
          onClick={() => setOpen(!open)}
        >
          <span className="p2-count">{c.count}</span>
        </button>
      )}
    </div>
  );
}

/* PAGE-V3: THE TAB RIDES THE MARK. `mode="scroll"` ties the
   tab to the page's scroll instead of to a press:
     - while the mark rides the foot of the window - the film, the manifest -
       there is no tab at all;
     - as the mark rises, the tab comes up hung from its foot, drawing the
       list up with it; with the mark at the head the list is up under it;
     - the list scrolls on its own under the pointer, and when it runs out
       the page takes the scroll on: the tab folds down as The Latest comes
       up, and is down just as The Latest reaches the head;
     - scrolling back up, the list comes back and follows the mark down.
   Pressing it shut folds the tab straight down where the page stands: the
   mark stays at the head with The Latest under it, and nothing scrolls. It
   stays down until the mark leaves the head; then it hangs from the mark
   again. Pressing it open brings the page to where the list is up. */
export default function ListTab({
  companies,
  facets,
  mode = "tab",
}: {
  companies: Company[];
  facets: Facets;
  mode?: "tab" | "scroll";
}) {
  const scrollMode = mode === "scroll";
  const [open, setOpenState] = useState(false);
  const openRef = useRef(false);
  /* where the page stands when the list is up under the mark, where the mark
     stands when it is at the head, and where the tab rests when it is down */
  const geo = useRef({ zoneStart: 0, stuck: 0, rest: 0 });
  /* pressed shut: down where the page stands, until the mark leaves the head */
  const folded = useRef(false);
  const glide = useRef<() => void>(() => {});
  const replace = useRef<() => void>(() => {});
  const setOpen = (v: boolean) => {
    if (scrollMode) {
      if (v) {
        folded.current = false;
        glide.current();
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: geo.current.zoneStart, behavior: reduce ? "auto" : "smooth" });
      } else {
        folded.current = true;
        glide.current();
      }
      replace.current();
      return;
    }
    openRef.current = v;
    setOpenState(v);
  };
  const spacerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  /* nothing before the intro has run */
  const [intro, setIntro] = useState(true);
  const tabRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setReady(true);
    const check = () => setIntro(!!document.querySelector(".loader"));
    check();
    const t = setInterval(check, 250);
    return () => clearInterval(t);
  }, []);

  /* THE ROW'S HEIGHT, measured: the tab stands that far up off the foot when
     it is folded, and the panel beside the index hangs from under it when it
     is up */
  useEffect(() => {
    const tab = tabRef.current;
    const head = headRef.current;
    if (!tab || !head) return;
    const place = () => {
      const h = Math.ceil(head.getBoundingClientRect().height);
      tab.style.setProperty("--p2-head", `${h}px`);
      if (!scrollMode) {
        const top = openRef.current ? tab.getBoundingClientRect().top : window.innerHeight;
        document.documentElement.style.setProperty("--index-panel-top", `${Math.round(top + h)}px`);
      }
      document.documentElement.style.setProperty("--index-dock-h", "0px");
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(head);
    window.addEventListener("resize", place);
    /* the top moves while the tab folds; measure again once it has landed */
    const t = setTimeout(place, 300);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", place);
      clearTimeout(t);
    };
  }, [ready, intro, open]);

  /* NOT BEFORE THE MARK MOVES, as the original dock keeps off the film:
     while the mark rides the foot of the window the folded tab waits below
     it, and slides up on the dock's clock once the mark starts to rise. Kept
     in a data attribute - React owns the className. (page-v3 hangs the tab
     from the mark instead, so it has this already.) */
  useEffect(() => {
    if (scrollMode) return;
    const tab = tabRef.current;
    const mast = document.querySelector<HTMLElement>(".archive-masthead");
    if (!tab || !mast) return;
    const check = () => {
      const riding = mast.getBoundingClientRect().bottom >= window.innerHeight - 2;
      if (riding) tab.dataset.away = "";
      else delete tab.dataset.away;
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [scrollMode, ready, intro]);

  /* A PRESS OFF THE TAB puts it away, the same way Close does - but not a
     press on what stands over it: the open company, the Menu */
  useEffect(() => {
    if (!open || scrollMode) return;
    const onPress = (e: PointerEvent) => {
      const t = e.target as Element | null;
      if (!t?.closest) return;
      if (t.closest(".p2tab, .entry-scrim, .mod-hero-menu, .nkd")) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onPress);
    return () => document.removeEventListener("pointerdown", onPress);
  }, [open, scrollMode]);

  /* up, the page behind holds still: the list is what scrolls */
  useEffect(() => {
    if (!open || scrollMode) return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = prev;
    };
  }, [open, scrollMode]);

  /* PAGE-V3: the tab's place, read off the mark's */
  useEffect(() => {
    if (!scrollMode) return;
    const tab = tabRef.current;
    const head = headRef.current;
    const spacer = spacerRef.current;
    const mast = document.querySelector<HTMLElement>(".archive-masthead");
    if (!tab || !head || !spacer || !mast) return;

    /* a jump - pressed shut, or hung from the mark again - glides on the
       tab's own clock; following the scroll it does not */
    let glideT: ReturnType<typeof setTimeout> | null = null;
    glide.current = () => {
      /* data attributes, not classes: React owns the tab's className and
         rewrites it whenever the tab opens or shuts */
      tab.dataset.glide = "";
      if (glideT) clearTimeout(glideT);
      glideT = setTimeout(() => delete tab.dataset.glide, 340);
    };

    const measure = () => {
      const headH = head.getBoundingClientRect().height;
      const stuck = mast.offsetHeight + (parseFloat(getComputedStyle(mast).top) || 0);
      const rest = window.innerHeight - headH;
      const zoneStart = spacer.getBoundingClientRect().top + window.scrollY - stuck;
      geo.current = { zoneStart, stuck, rest };
      tab.style.height = `${Math.round(window.innerHeight - stuck)}px`;
    };
    const place = () => {
      const { zoneStart, stuck, rest } = geo.current;
      const y = window.scrollY;
      /* the mark has left the head, back up the page: hung from it again */
      if (folded.current && y < zoneStart - 2) {
        folded.current = false;
        glide.current();
      }
      let top: number;
      if (folded.current) {
        top = rest;
      } else if (y <= zoneStart) {
        /* hung from the mark's foot - below the window while the mark rides
           its foot, so there is no tab over the film */
        top = mast.getBoundingClientRect().bottom;
      } else {
        /* the list has run out and the page goes on: down to rest over the
           stretch The Latest takes to reach the head */
        const k = stuck > 0 ? (rest - stuck) / stuck : 1;
        top = Math.min(rest, stuck + k * (y - zoneStart));
      }
      tab.style.top = `${Math.round(top)}px`;
      const up = top < rest - 1;
      tab.dataset.rest = top > rest + 1 ? "away" : up ? "up" : "docked";
      if (up !== openRef.current) {
        openRef.current = up;
        setOpenState(up);
      }
      document.documentElement.style.setProperty(
        "--index-panel-top",
        `${Math.round(top + head.getBoundingClientRect().height)}px`
      );
    };
    replace.current = place;
    let raf = 0;
    let late: ReturnType<typeof setTimeout> | null = null;
    const run = () => {
      cancelAnimationFrame(raf);
      if (late) clearTimeout(late);
      raf = 0;
      late = null;
      place();
    };
    const ask = () => {
      if (raf || late) return;
      raf = requestAnimationFrame(run);
      late = setTimeout(run, 100);
    };
    const remeasure = () => {
      measure();
      ask();
    };
    remeasure();
    const ro = new ResizeObserver(remeasure);
    ro.observe(head);
    ro.observe(document.body);
    window.addEventListener("scroll", ask, { passive: true });
    window.addEventListener("resize", remeasure);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", ask);
      window.removeEventListener("resize", remeasure);
      cancelAnimationFrame(raf);
      if (late) clearTimeout(late);
      if (glideT) clearTimeout(glideT);
    };
  }, [scrollMode, ready, intro]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement | null)?.closest?.("input, textarea, select, [contenteditable]");
      /* "/" goes to the search, the way the dock's does, and brings the list up */
      if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (document.querySelector(".entry-scrim")) return;
        e.preventDefault();
        setOpen(true);
        searchRef.current?.focus({ preventScroll: true });
        return;
      }
      /* Escape folds it away - unless a company is open over it: that closes first */
      if (e.key === "Escape" && openRef.current && !typing) {
        if (document.querySelector(".entry-scrim, .index-panel")) return;
        setOpen(false);
      }
    };
    /* the Menu's "The List" opens the tab where the page stands: the list is
       not in the page, so there is nowhere for the Menu to glide to. The
       Menu is folded away the way its own Escape does it. */
    const onClick = (e: MouseEvent) => {
      if (!(e.target as Element | null)?.closest?.('.mod-hero-menu a[href="#archive"]')) return;
      e.preventDefault();
      e.stopPropagation();
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      setOpen(true);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  /* THE HANDLE: a small square bump standing up off the tab's top
     edge, exactly in its middle, open or shut, with two chevrons that point
     where the tab will go - up while it is down, down while it is up. A press
     toggles it; a drag of the handle up opens the tab, down shuts it. */
  const drag = useRef<{ y: number; moved: boolean } | null>(null);
  const handle = (
    <button
      type="button"
      className="p2-handle"
      aria-label={open ? "Close the list" : "Open the list"}
      aria-expanded={open}
      onPointerDown={(e) => {
        drag.current = { y: e.clientY, moved: false };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d || d.moved) return;
        const dy = e.clientY - d.y;
        if (dy < -24) {
          d.moved = true;
          setOpen(true);
        } else if (dy > 24) {
          d.moved = true;
          setOpen(false);
        }
      }}
      onPointerUp={() => {
        const d = drag.current;
        drag.current = null;
        if (d && !d.moved) setOpen(!openRef.current);
      }}
      onPointerCancel={() => {
        drag.current = null;
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setOpen(!openRef.current);
        }
      }}
    >
      <svg viewBox="0 0 12 10" width="12" height="10" aria-hidden="true">
        <path d="M1 5 L6 1 L11 5 M1 9 L6 5 L11 9" fill="none" stroke="currentColor" strokeWidth="1" />
      </svg>
    </button>
  );

  const host: ListHost = {
    scroller,
    frame: ({ list, controls }) => (
      <div
        ref={tabRef}
        className={`p2tab${open ? " is-open" : ""}${scrollMode ? " p2tab--scroll" : ""} p2tab--dock-bottom`}
        hidden={intro}
        role="region"
        aria-label="The List"
      >
        {handle}
        <div className="p2tab-head" ref={headRef}>
          <Controls c={controls} open={open} setOpen={setOpen} searchRef={searchRef} drawer />
        </div>
        <div className="p2tab-body" ref={scroller}>
          {list}
        </div>
      </div>
    ),
  };

  if (!ready) return null;
  /* in the body, not in the page: a fixed tab must not sit inside anything
     that moves or clips */
  const tabEl = createPortal(<Archive companies={companies} facets={facets} host={host} />, document.body);
  if (!scrollMode) return tabEl;
  /* page-v3: a spacer in the list's place in the page, to know where the
     mark reaches the head */
  return (
    <>
      <div ref={spacerRef} className="p3-stretch" aria-hidden="true" />
      {tabEl}
    </>
  );
}
