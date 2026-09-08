"use client";

import { useEffect, useRef, useState } from "react";
import Wordmark from "@/components/wordmark";

/* The catalogue's running head. The contents are not printed across the bar -
   at 8px beside the mark they read as a caption under a logo, two different
   weights doing the same job. One word instead, set at the mark's own size,
   and the list drops when you ask for it. */
const SECTIONS = [
  { href: "#manifest", label: "Manifest" },
  { href: "#archive", label: "Archive" },
  { href: "#latest", label: "Latest" },
  { href: "#partners", label: "Partners" },
  { href: "#faq", label: "FAQ" },
];

export default function Nav() {
  const [here, setHere] = useState(SECTIONS[0].label);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLElement>(null);

  /* which section the reader is standing in - it marks the current entry in
     the contents when they are dropped */
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        let current = SECTIONS[0].label;
        for (const s of SECTIONS) {
          const el = document.getElementById(s.href.slice(1));
          if (el && el.getBoundingClientRect().top <= 80) current = s.label;
        }
        setHere(current);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  const goToSection = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    setOpen(false);
    const el = document.getElementById(href.slice(1));
    if (!el) return;
    window.scrollTo({ top: el.offsetTop, behavior: "smooth" });
    history.replaceState(null, "", href);
  };

  return (
    <header className="site-nav" ref={root}>
      <div className="site-nav-top">
        <Wordmark className="site-nav-title" />

        <button
          type="button"
          className={`site-nav-trigger${open ? " site-nav-trigger--on" : ""}`}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          Contents
        </button>
      </div>

      {open && (
        <nav className="site-nav-drop" aria-label="Sections">
          {SECTIONS.map((s) => (
            <a
              key={s.href}
              href={s.href}
              onClick={(e) => goToSection(e, s.href)}
              className={s.label === here ? "site-nav-here" : undefined}
              aria-current={s.label === here ? "true" : undefined}
            >
              {s.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
