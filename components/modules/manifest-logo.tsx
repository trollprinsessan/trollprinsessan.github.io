"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Wordmark from "@/components/wordmark";

export default function ManifestLogo() {
  const [visible, setVisible] = useState(false);
  /* the tilt is written straight onto the node, never into state: as state it
     re-rendered this whole SVG on every scroll frame, and the page stuttered
     under the sticky bars for it. */
  const markRef = useRef<SVGSVGElement>(null);
  const [num, setNum] = useState<number | null>(null); // null → not shown yet

  const ref = useRef<HTMLDivElement>(null);

  /* the manifest above ends a masthead's height short of the screen, so this
     wordmark rides up into the same snapped view. Measured, because the
     wordmark scales with the window's width. */
  useEffect(() => {
    const mast = ref.current?.closest(".archive-masthead");
    if (!mast) return;
    const place = () => {
      document.documentElement.style.setProperty(
        "--masthead-h",
        `${Math.ceil(mast.getBoundingClientRect().height)}px`
      );
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(mast);
    return () => ro.disconnect();
  }, []);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startAnimation = useCallback(() => {
    setVisible(true);

    // Show 000, then count up to 100 with an ease-out deceleration
    timerRef.current = setTimeout(() => {
      setNum(0);
      const duration = 2000;
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3); // decelerate into 100
        setNum(Math.round(eased * 100));
        if (t < 1) rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    }, 300);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          setTimeout(startAnimation, 200);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [startAnimation]);

  /* p-o.space, measured: the wordmark is a plain element carrying
     transform: rotateY(Ndeg), driven straight off scroll position, inside a
     parent with perspective. Theirs runs to 70deg; this one turns through
     +/-16deg as the mark crosses the screen, so it reads as a sheet catching
     the light rather than a spin. */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const r = el.getBoundingClientRect();
        // -1 when the mark sits at the foot of the screen, +1 at the head
        const t = 1 - ((r.top + r.height / 2) / window.innerHeight) * 2;
        const deg = Math.max(-1, Math.min(1, t)) * 16;
        const svg = markRef.current;
        if (svg) svg.style.transform = `rotateY(${deg.toFixed(2)}deg)`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const label = num === null ? "" : String(num).padStart(3, "0");

  return (
    <div
      ref={ref}
      className="manifest-logo"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 0.3s ease" }}
    >
      <Wordmark ref={markRef} label={label} className="manifest-logo-svg" />
    </div>
  );
}
