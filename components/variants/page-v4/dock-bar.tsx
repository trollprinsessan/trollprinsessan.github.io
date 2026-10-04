"use client";

import { useEffect, useRef } from "react";
import "./dock-bar.css";
import type { ListControls } from "@/components/archive";
import { Controls } from "@/components/variants/page-v2/list-tab";
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
  /* THE BAR'S PLACE AND MAKE-UP (dockstyle-v#), in any page with it:
       v1  at the foot, as the original dock
       v2  at the head, under the mark - or the banner, when it is on
       v3  split: search, filters and Shuffle at the head; the views at the
           foot, in the right-hand corner
       v4  at the foot, without the search
       v5  v4, without the arrows on the filters */
  const v = useVersion("dockstyle");
  /* dockplace-v2 puts any make-up at the head */
  const plats = useVersion("dockplace");
  const place = v === "v2" || v === "v3" || plats === "v2" ? "top" : "bottom";
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
  }, [v]);
  const cls = `p4dock p4dock--${place} p4dock--${v}${on ? " p4dock--on" : ""}${panel ? " p4dock--panel" : ""}`;
  return (
    <>
      <div className={cls} ref={barRef}>
        {/* open, so nothing in the row tries to fold a drawer up */}
        <Controls c={controls} open setOpen={() => toList()} searchRef={searchRef} />
      </div>
      {v === "v3" && (
        <div className={`p4dock p4dock--bottom p4dock--views${on ? " p4dock--on" : ""}${panel ? " p4dock--panel" : ""}`}>
          <Controls c={controls} open setOpen={() => toList()} searchRef={searchRef} />
        </div>
      )}
    </>
  );
}
