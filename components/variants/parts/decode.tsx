"use client";

import "./decode.css";
import { useEffect, useRef, useState } from "react";

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
      const t = (now - start) / 420;
      if (t >= 1) {
        setShown(text);
        setBusy(false);
        return;
      }
      setShown(
        [...text]
          .map((ch, i) => (ch === " " || t >= lands[i] ? ch : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".length)]))
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
    }, 420 + 200);
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
