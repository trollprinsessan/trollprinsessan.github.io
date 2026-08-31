"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Wordmark from "@/components/wordmark";

export default function ManifestLogo() {
  const [visible, setVisible] = useState(false);
  const [num, setNum] = useState<number | null>(null); // null → not shown yet

  const ref = useRef<HTMLDivElement>(null);
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

  const label = num === null ? "" : String(num).padStart(3, "0");

  return (
    <div
      ref={ref}
      className="manifest-logo"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 0.3s ease" }}
    >
      <Wordmark label={label} className="manifest-logo-svg" />
    </div>
  );
}
