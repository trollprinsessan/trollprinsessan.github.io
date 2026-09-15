"use client";

import { useEffect } from "react";

/* THE SNAP, MADE DECISIVE ON A PHONE.
   CSS proximity snapping only catches a scroll that ends a little way off a
   snap point - the browser decides how little, and on a phone a flick runs
   past that band more often than not. This finishes the job: when a scroll
   ends within reach of either of the page's two views - the mark at the foot
   of the screen, or the mark at its head with the list under it - the page
   settles onto it. It never fires mid-list: past the second view there is
   nothing to settle on, so the list scrolls free.

   Phone only. On desktop the CSS band is enough, and a wheel is not a flick. */
const REACH = 0.42; // of the screen, either side of a view

export default function SnapAssist() {
  useEffect(() => {
    if (!window.matchMedia("(max-width: 720px)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    let settling = false;

    const views = () => {
      const reveal = document.querySelector(".reveal-end");
      const archive = document.querySelector("#archive");
      const mast = document.querySelector(".archive-masthead");
      if (!reveal || !archive || !mast) return [];
      const vh = window.innerHeight;
      const foot = reveal.getBoundingClientRect().bottom + window.scrollY - vh;
      const head =
        archive.getBoundingClientRect().top +
        window.scrollY -
        mast.getBoundingClientRect().height;
      return [foot, head];
    };

    const settle = () => {
      if (settling) return;
      const y = window.scrollY;
      const reach = window.innerHeight * REACH;
      let best: number | null = null;
      for (const v of views()) {
        const d = Math.abs(v - y);
        if (d > 2 && d < reach && (best === null || d < Math.abs(best - y))) best = v;
      }
      if (best === null) return;
      settling = true;
      window.scrollTo({ top: best, behavior: "smooth" });
      setTimeout(() => (settling = false), 600);
    };

    /* scrollend where it exists; a quiet 120ms after the last scroll event
       where it does not */
    const onScroll = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(settle, 120);
    };
    const hasScrollEnd = "onscrollend" in window;
    if (hasScrollEnd) window.addEventListener("scrollend", settle);
    else window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (hasScrollEnd) window.removeEventListener("scrollend", settle);
      else window.removeEventListener("scroll", onScroll);
      if (timer) clearTimeout(timer);
    };
  }, []);
  return null;
}
