"use client";

import "./decode.css";
import { useEffect, useRef, useState } from "react";

/* THE NAME DECODES. When a company view goes from one company to
   the next - Prev, Next, another company pressed in the list - the name
   does not just change: each letter runs through other letters on its own
   and lands on its own, left to right but not in step, in under half a
   second. Shuffle does not decode: it rolls and lands.
   While a name decodes, the view says so (busy), so the rest of it can wait
   white until the name has landed. */

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const RUN_MS = 420;

export function useDecode(text: string, skip: boolean) {
  const [shown, setShown] = useState(text);
  const [busy, setBusy] = useState(false);
  const last = useRef(text);

  useEffect(() => {
    if (text === last.current) return;
    last.current = text;
    /* nor while the card's letters fly in (parts/fly.ts): they bring it */
    const flying = document.documentElement.hasAttribute("data-nk-flying");
    if (skip || flying || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(text);
      setBusy(false);
      return;
    }
    /* each letter lands at its own moment: later along the name, give or
       take, so it reads left to right without marching */
    const lands = [...text].map((_, i) => 0.25 + (0.6 * i) / Math.max(1, text.length) + Math.random() * 0.15);
    const start = performance.now();
    let raf = 0;
    setBusy(true);
    const tick = (now: number) => {
      const t = (now - start) / RUN_MS;
      if (t >= 1) {
        setShown(text);
        setBusy(false);
        return;
      }
      setShown(
        [...text]
          .map((ch, i) => (ch === " " || t >= lands[i] ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
          .join("")
      );
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    /* a tab that draws no frames still lands */
    const done = setTimeout(() => {
      cancelAnimationFrame(raf);
      setShown(text);
      setBusy(false);
    }, RUN_MS + 200);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(done);
    };
  }, [text, skip]);

  return { shown, busy };
}

/* the roulette's steps, and the step it lands on, do not decode */
export function useWasSpinning(spinning: boolean | undefined) {
  const was = useRef(false);
  useEffect(() => {
    was.current = !!spinning;
  }, [spinning]);
  return was;
}
