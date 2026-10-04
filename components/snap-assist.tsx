"use client";

import { useEffect } from "react"; // of the screen, either side of a view

export default function SnapAssist() {
  useEffect(() => {
    if (!window.matchMedia("(max-width: 720px)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    let settling = false;

    const settle = () => {
      if (settling) return;
      /* the page's soft snap takes over while its switch is on */
      return;
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
