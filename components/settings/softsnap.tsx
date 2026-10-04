"use client";

import { useEffect } from "react";
import { useToggle } from "./registry";

/* SOFT SNAP. The page's CSS scroll snap takes hold from far off, and snaps
   back when a manifest tab changes the page's height. With the switch on,
   the CSS snap is off (manifest-v2/manifest.css) and this takes its place:
   only when a scroll comes to rest close to a stop - within 56px - does the
   page glide the rest of the way. A press on a tab never scrolls. */
const NEAR = 56;

export default function SoftSnap() {
  const on = useToggle("softsnap");
  useEffect(() => {
    if (!on) return;
    let t: ReturnType<typeof setTimeout> | null = null;
    let ours = 0;
    const stops = () => {
      const out: number[] = [];
      /* THE STOPS: each section's head at the window's head (the manifest's
         is where the mark rests on the window's foot), and the list under
         the mark. The manifest's links are deliberately not a stop: there,
         half the list's first row shows under the mark. */
      const top = (id: string) => {
        const el = document.getElementById(id);
        return el ? el.getBoundingClientRect().top + window.scrollY : null;
      };
      const mast = document.querySelector(".archive-masthead")?.getBoundingClientRect().height ?? 0;
      const list = top("archive");
      /* the list under the mark is a stop on a phone only: on a desktop it
         sits half a row into the list, and the manifest's stop covers it */
      if (list !== null && window.matchMedia("(max-width: 720px)").matches) out.push(list - mast);
      for (const id of ["manifest", "latest", "goodnews", "partners", "faq"]) {
        const y = top(id);
        if (y !== null) out.push(y);
      }
      return out;
    };
    const settle = () => {
      if (Date.now() < ours) return;
      const y = window.scrollY;
      const near = stops()
        .map((s) => ({ s, d: Math.abs(s - y) }))
        .filter((x) => x.d > 2 && x.d < NEAR)
        .sort((a, b) => a.d - b.d)[0];
      if (!near) return;
      ours = Date.now() + 700;
      window.scrollTo({ top: near.s, behavior: "smooth" });
    };
    const onScroll = () => {
      if (t) clearTimeout(t);
      t = setTimeout(settle, 160);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (t) clearTimeout(t);
    };
  }, [on]);
  return null;
}
