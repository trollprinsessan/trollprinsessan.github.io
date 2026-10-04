"use client";

import { useEffect, useRef } from "react";
import type { ListControls } from "@/components/archive";
import { Controls } from "@/components/variants/page-v2/list-tab";
/* after the row's own stylesheet (list-tab.css, loaded with Controls): the
   bar's rules overrule the row's at the same weight */
import "./dock-bar.css";
import { useVersion } from "@/components/settings/registry";

/* PAGE-V4: THE ORIGINAL PAGE, WITH THE TAB'S ROW AS ITS DOCK.
   The list stays in the page, under the mark, as in page-v1. Its bar is the
   row from page-v2 and -v3 - the views with the one slider through the grid
   to the index, the filters as drop-downs, the search, shake, shuffle, and
   the list's count - but not a drawer: it is fixed at the foot the way the
   original dock is, and shown when that would be, while the list is on
   screen. The drop-downs open upward, off the foot. Pressing the count
   takes the page to the top of the list. */
export default function DockBar({
  controls,
  on,
  panel,
}: {
  controls: ListControls;
  on: boolean;
  panel: boolean;
}) {
  const searchRef = useRef<HTMLInputElement>(null);
  const toList = () => {
    const list = document.querySelector("#archive");
    const mast = document.querySelector(".archive-masthead")?.getBoundingClientRect().height ?? 0;
    if (!list) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({
      top: list.getBoundingClientRect().top + window.scrollY - mast,
      behavior: reduce ? "auto" : "smooth",
    });
  };
  /* the bar's height, for its room in the list */
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const root = document.documentElement;
    const put = () => root.style.setProperty("--nk-dock-h", `${Math.round(el.getBoundingClientRect().height)}px`);
    put();
    const ro = new ResizeObserver(put);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const cls = `p4dock p4dock--bottom p4dock--v6${on ? " p4dock--on" : ""}${panel ? " p4dock--panel" : ""}`;
  return (
    <>
      <div className={cls} ref={barRef}>
        {/* open, so nothing in the row tries to fold a drawer up */}
        <Controls c={controls} open setOpen={() => toList()} searchRef={searchRef} />
      </div>

    </>
  );
}
