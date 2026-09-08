"use client";

import { useEffect, useRef } from "react";

/* Draws the mark line by line. The file is inlined at runtime rather than used
   as an <img>, because CSS cannot reach inside an <img> to touch individual
   paths. Each path is then converted to its own outline (fill removed, stroke
   added) and drawn with stroke-dashoffset, staggered in document order. When a
   path finishes it swaps straight to its fill: a hard cut, no fade. */
export default function ElectroMark({ src }: { src: string }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const node = host.current;
    if (!node) return;

    (async () => {
      const markup = await fetch(src).then((r) => r.text());
      if (cancelled || !host.current) return;
      host.current.innerHTML = markup;

      const root = host.current.querySelector("svg");
      if (!root) return;
      root.removeAttribute("width");
      root.removeAttribute("height");

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      /* mask contents are not artwork, so they are left alone */
      const paths = Array.from(root.querySelectorAll("path")).filter(
        (p) => !p.closest("mask")
      );

      let clock = 0;
      paths.forEach((p) => {
        let len = 0;
        try {
          len = p.getTotalLength();
        } catch {
          return;
        }
        if (!isFinite(len) || len === 0) return;

        const painted = getComputedStyle(p).fill;
        p.style.fill = "none";
        p.style.stroke = painted && painted !== "none" ? painted : "#003399";
        p.style.strokeWidth = "1.4";
        p.style.strokeDasharray = String(len);
        p.style.strokeDashoffset = String(len);

        /* longer contours take longer to draw, so the ellipse does not finish
           in the same beat as a comma */
        const duration = Math.min(900, Math.max(220, len * 0.45));
        const anim = p.animate(
          [{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
          { duration, delay: clock, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "forwards" }
        );
        clock += 26;

        anim.onfinish = () => {
          p.style.stroke = "none";
          p.style.fill = "";
          p.style.strokeDasharray = "";
          p.style.strokeDashoffset = "";
        };
      });
    })();

    return () => {
      cancelled = true;
      if (node) node.innerHTML = "";
    };
  }, [src]);

  return <div ref={host} className="eu-mark" aria-hidden="true" />;
}
