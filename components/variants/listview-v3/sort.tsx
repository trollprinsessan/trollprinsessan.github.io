"use client";

import "./sort.css";
import "./panel.css";
import type { Company } from "@/lib/types";
import { cohortsFor } from "@/lib/art-direction";

/* LISTAN-V3: THE INDEX SORTS BY ITS COLUMNS.
   Each column's head is a switch with three states, pressed in turn:
   A to Z, Z to A, and back to the list's own order - the composed edition
   first. Name, the one-liner, the campaign, the sector, the country. The
   campaign sorts as the edition sets them: Electro Union, then no campaign,
   then Prompt What Matters. */

type SortKey = "name" | "gymbs" | "campaign" | "sector" | "country";
export type Sort = { key: SortKey; dir: 1 | -1 } | null;

const collator = new Intl.Collator("en", { sensitivity: "base", numeric: true });
