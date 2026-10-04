"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Giga-style reveal: blurred + slightly enlarged until scrolled into view,
// then resolves to sharp/normal-scale. See .reveal-blur in globals.css.
export default function RevealBlur({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`reveal-blur${revealed ? " is-revealed" : ""}`} ref={ref}>
      {children}
    </div>
  );
}
