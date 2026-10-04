"use client";

import "./list-lead.css";
import type { Company } from "@/lib/types";
import { cohortsFor } from "@/lib/art-direction";
import { Badge, NO_CAMPAIGN } from "@/components/variants/badge/badge";

/* PAGE-V5: THE LIST'S HEAD. One line over the first row, from the page's
   left margin:

     Show all   [Electro Union] 26   [Prompt What Matters] 18   56 more ways to fix the future

   the edition's two campaigns by their badges with the number in each, and
   the companies in neither as a line of words - the photobook's own name for
   its third chapter (the book is the reference for every text on the site,
   and it says "more ways to fix"). Each is a way in: a press shows only
   those (the Theme filter, the same one the dock's drop-down sets; the last
   one is its NO_CAMPAIGN value), Show all shows everyone again. The counts
   are the edition's, whatever else is filtered, so they do not fall to
   nothing under a search. */
const CAMPAIGNS = ["Electro Union", "Prompt What Matters"];

export default function ListLead({
  companies,
  year,
  theme,
  setTheme,
}: {
  companies: Company[];
  list: Company[];
  year: Set<string>;
  theme: Set<string>;
  setTheme: (v: Set<string>) => void;
}) {
  const edition = year.size ? companies.filter((c) => c.years.some((y) => year.has(String(y)))) : companies;
  const keys = CAMPAIGNS.map((name) => ({
    name,
    count: edition.filter((c) => cohortsFor(c.slug).includes(name)).length,
  })).filter((k) => k.count > 0);
  const others = edition.filter((c) => cohortsFor(c.slug).length === 0).length;
  if (!keys.length) return null;

  const only = (name: string) => setTheme(theme.size === 1 && theme.has(name) ? new Set() : new Set([name]));

  return (
    <div className={`p5lead${theme.size ? " p5lead--on" : ""}`}>
      <button
        type="button"
        className={`p5key p5key--all${theme.size ? "" : " is-on"}`}
        aria-pressed={!theme.size}
        onClick={() => setTheme(new Set())}
      >
        Show all
      </button>
      {keys.map((k) => {
        const on = theme.has(k.name);
        return (
          <button
            key={k.name}
            type="button"
            className={`p5key${on ? " is-on" : ""}`}
            aria-pressed={on}
            title={on ? "Show every company" : `Show only ${k.name}`}
            onClick={() => only(k.name)}
          >
            <Badge name={k.name} size="m" />
            <span className="p5key-count">{k.count}</span>
          </button>
        );
      })}
      {others > 0 && (
        <button
          type="button"
          className={`p5key p5key--others${theme.has(NO_CAMPAIGN) ? " is-on" : ""}`}
          aria-pressed={theme.has(NO_CAMPAIGN)}
          onClick={() => only(NO_CAMPAIGN)}
        >
          {others} more ways to fix the future
        </button>
      )}
    </div>
  );
}
