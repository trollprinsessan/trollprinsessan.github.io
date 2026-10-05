"use client";

import { useEffect } from "react";
/* the variants that are only CSS, waiting on html[data-v-<id>] */
import "@/components/variants/menustyle-v2/menu.css";
import "@/components/variants/manifest-v2/manifest.css";
import "@/components/variants/motion/slide.css";
import "@/components/variants/sections-v2.css";
import SoftSnap from "./softsnap";
import { LINE_WIDTH, rootAttributes } from "./registry";

/* WHAT EVERY BUILD RUNS: the settings written
   on the root for the CSS-only variants, the soft snap, and the class that
   says the mark is parked at the window's foot. */
export default function Runtime() {
  useEffect(() => {
    const root = document.documentElement;
    for (const [k, v] of Object.entries(rootAttributes())) root.setAttribute(k, v);
    root.style.setProperty("--nk-line-w", `${LINE_WIDTH}px`);
  }, []);

  /* THE MARK FOLLOWS THE LIST: parked at the foot of the window (the page is
     above the list) it is the page's whole width again, even with a company
     open - page-v4/company-side.css and listview-v3/panel.css read the class */
  useEffect(() => {
    let raf = 0;
    const check = () => {
      raf = 0;
      const m = document.querySelector(".archive-masthead")?.getBoundingClientRect();
      document.documentElement.classList.toggle("nk-mast-wide", !!m && m.bottom >= window.innerHeight - 1);
    };
    const ask = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", ask, { passive: true });
    window.addEventListener("resize", ask, { passive: true });
    /* a company opens and closes, the intro ends - without a scroll */
    const tick = setInterval(check, 250);
    return () => {
      window.removeEventListener("scroll", ask);
      window.removeEventListener("resize", ask);
      clearInterval(tick);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  /* THE PAGE'S GROUND. Pink belongs to Prompt What Matters and to nothing
     else. The list's choice comes first - an open company, else the chosen
     category (parts/category.tsx writes data-nk-list-ground: "pwm", "eu" or
     "plain"). With no choice in the list, the manifest's Prompt What Matters
     panel turns the page pink while the page stands above the list, and the
     list itself is on the plain ground. */
  useEffect(() => {
    const root = document.documentElement;
    const decide = () => {
      const list = root.dataset.nkListGround;
      const a = document.getElementById("archive")?.getBoundingClientRect();
      const above = !a || a.top >= window.innerHeight * 0.6;
      /* switch rosaslut: the list's pink is the list's - once the list has
         gone up past the middle of the window, the page under it is plain */
      const past = (!!a) && a.bottom < window.innerHeight * 0.5;
      const pink = list ? list === "pwm" && !past : root.dataset.nkPanelGround === "pink" && above;
      root.classList.toggle("ground-pink", pink);
    };
    decide();
    window.addEventListener("nk:ground", decide);
    window.addEventListener("scroll", decide, { passive: true });
    window.addEventListener("resize", decide);
    return () => {
      window.removeEventListener("nk:ground", decide);
      window.removeEventListener("scroll", decide);
      window.removeEventListener("resize", decide);
      root.classList.remove("ground-pink");
    };
  }, []);

  /* THE MANIFEST'S MEASURED STEP: from the end of the menu's longest word to
     the start of the copy, for the layouts that repeat it (mlayout-v9) */
  useEffect(() => {
    const root = document.documentElement;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const tabs = [...document.querySelectorAll<HTMLElement>(".mod-manifest-tab-label")];
      const body = document.querySelector<HTMLElement>(".mod-manifest-body p");
      if (!tabs.length || !body) return;
      const range = document.createRange();
      const right = Math.max(
        ...tabs.map((t) => {
          range.selectNodeContents(t);
          return range.getBoundingClientRect().right;
        })
      );
      range.selectNodeContents(body);
      const left = range.getBoundingClientRect().left;
      if (left > right) root.style.setProperty("--nk-menu-gap", `${Math.round(left - right)}px`);

    };
    const ask = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("resize", ask);
    const t = setInterval(ask, 1000);
    return () => {
      window.removeEventListener("resize", ask);
      clearInterval(t);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  /* THE MANIFEST'S LAYOUT (mlayout-v10), laid out once per panel and per
     window size - never in a loop:
     - the copy keeps its type and its column width; when it would run down
       behind the mark parked at the window's foot, it takes a column more
       (2, 3, 4) instead of getting smaller
     - the picture starts the menu's step after the copy and runs to the
       menu's own margin from the window's right edge, up to a maximum; it
       may lie over the mark
     - the roster of nomination partners takes the picture's box, in as many
       columns as keep it above the mark */
  useEffect(() => {
    const root = document.documentElement;
    let raf = 0;
    let last = "";
    const layout = (force: boolean) => {
      raf = 0;
      if ((!window.matchMedia("(min-width: 721px)").matches)) return;
      const section = document.getElementById("manifest");
      const copy = document.querySelector<HTMLElement>(".mod-manifest-body");
      const menu = document.querySelector<HTMLElement>(".mod-manifest-index");
      const mast = document.querySelector<HTMLElement>(".archive-masthead");
      if (!section || !copy || !menu || !mast) return;
      const key = `${copy.textContent?.length}|${window.innerWidth}|${window.innerWidth}x${window.innerHeight}|v2|${!!document.querySelector(".nk-np-list")}|${document.querySelector(".mod-manifest-draw-caption")?.textContent}`;
      if (!force && key === last) return;
      last = key;

      /* the room above the parked mark, from where the copy starts */
      const top = copy.getBoundingClientRect().top - section.getBoundingClientRect().top;
      const room = window.innerHeight - mast.getBoundingClientRect().height - top - 24;
      root.style.setProperty("--nk-copy-room", `${Math.max(0, Math.round(room))}px`);
      const margin = menu.getBoundingClientRect().left;
      const gap = parseFloat(getComputedStyle(root).getPropertyValue("--nk-menu-gap")) || 16;
      const right = window.innerWidth - margin;

      /* the copy: two columns as long as it can; a third only on a very
         wide window; past that, a size smaller, a step at a time */
      root.style.removeProperty("--nk-copy-fs");
      /* every panel's copy must fit, the one on screen and the others set
         unseen beside it: the panels share one type size */
      const measures = [...document.querySelectorAll<HTMLElement>(".mod-manifest-body.nk-measure")];
      const bodies = [copy, ...measures];
      /* the unseen copies take the copy's own width, whatever its columns */
      const match = () => {
        const w = copy.getBoundingClientRect().width;
        for (const m of measures) m.style.width = `${w}px`;
      };
      const fits = () => {
        match();
        return bodies.every((b) => b.getBoundingClientRect().height <= room);
      };
      const leaves = () => copy.getBoundingClientRect().right + gap + 480 <= right;
      let cols = 2;
      root.style.setProperty("--nk-copy-cols", "2");
      /* with the roster up the picture's box is the roster's, and it needs
         the width more than the copy needs the column */
      const rosterUp = !!document.querySelector(".nk-np-list");
      for (const n of [3]) {
        if (fits() || rosterUp) break;
        root.style.setProperty("--nk-copy-cols", String(n));
        if (!leaves()) {
          root.style.setProperty("--nk-copy-cols", String(cols));
          break;
        }
        cols = n;
      }
      for (const fs of [14, 13, 12, 11]) {
        if (fits()) break;
        root.style.setProperty("--nk-copy-fs", String(fs));
      }
      /* mlayout-v11: the type settled over all the panels in two columns,
         the panel on screen takes one column, three quarters as wide, where
         it fits in one */
            root.style.setProperty("--nk-copy-cols", "1");
      if (copy.getBoundingClientRect().height > room) root.style.setProperty("--nk-copy-cols", "2");

      /* the picture's box: from the copy's step to the right margin */
      const start = copy.getBoundingClientRect().right + gap;
      const width = Math.max(200, Math.min(880, right - start));
      for (const el of document.querySelectorAll<HTMLElement>(
        ".mod-manifest-draw-caption, .mod-manifest-draw-plate, .mod-manifest-verso"
      )) {
        el.style.setProperty("--nk-pic-left", "0px");
        const off = el.getBoundingClientRect().left;
        el.style.setProperty("--nk-pic-left", `${Math.round(start - off)}px`);
        el.style.setProperty("--nk-pic-w", `${Math.round(width)}px`);
      }

      /* the roster in that box: smaller, a step at a time, while its
         columns would run out past the box's right edge */
      const list = document.querySelector<HTMLElement>(".nk-np-list ul");
      if (list) {
        list.style.removeProperty("--nk-np-fs");
        for (const fs of [12, 11, 10]) {
          if (list.scrollWidth <= list.clientWidth + 1) break;
          list.style.setProperty("--nk-np-fs", String(fs));
        }
      }
    };
    const ask = (force = false) => {
      if (!raf) raf = requestAnimationFrame(() => layout(force));
    };
    const onResize = () => ask(true);
    layout(true);
    window.addEventListener("resize", onResize);
    /* a tab changes the copy, a draw the picture, without a resize */
    const t = setInterval(() => ask(false), 250);
    const placed = setInterval(() => {
      layout(true);
    }, 1500);
    return () => {
      window.removeEventListener("resize", onResize);
      clearInterval(t);
      clearInterval(placed);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  /* FAQ-V3: the questions start the manifest's step (from its menu to its
     copy) to the right of the FAQ mark, and run to the right margin */
  useEffect(() => {
    const root = document.documentElement;
    let raf = 0;
    const place = () => {
      raf = 0;
      const art = document.querySelector<HTMLElement>(".mod-faq .mod-title-art--faq");
      const top = document.querySelector<HTMLElement>(".mod-faq .faq-top");
      if ((!art) || !top || !window.matchMedia("(min-width: 901px)").matches) {
        top?.style.removeProperty("--nk-faq-shift");
        return;
      }
      const gap = parseFloat(getComputedStyle(root).getPropertyValue("--nk-menu-gap")) || 16;
      top.style.setProperty("--nk-faq-shift", "0px");
      const shift = art.getBoundingClientRect().right + gap - top.getBoundingClientRect().left;
      top.style.setProperty("--nk-faq-shift", `${Math.round(shift)}px`);
      /* and the same margin at the right as the manifest keeps: its menu's
         distance from the window's left edge */
      const menu = document.querySelector<HTMLElement>(".mod-manifest-index");
      top.style.setProperty("--nk-faq-right", "0px");
      if (menu) {
        const margin = menu.getBoundingClientRect().left;
        const overrun = top.getBoundingClientRect().right - (window.innerWidth - margin);
        top.style.setProperty("--nk-faq-right", `${Math.max(0, Math.round(overrun))}px`);
      }
    };
    const ask = () => {
      if (!raf) raf = requestAnimationFrame(place);
    };
    place();
    window.addEventListener("resize", ask);
    const t = setInterval(ask, 1000);
    return () => {
      window.removeEventListener("resize", ask);
      clearInterval(t);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <SoftSnap />;
}
