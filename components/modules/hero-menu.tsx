"use client";

import { useEffect, useState } from "react";

/* THE MENU.
   One word on the film's top right - Menu - and the sections fold out
   under it when it is pressed, stacked, right-aligned. Pressing the word
   again, or Escape, or a section, folds them away. */
const SECTIONS = [
  { href: "#manifest", label: "Manifest" },
  { href: "#archive", label: "The List" },
  { href: "#goodnews", label: "Good News" },
  { href: "#partners", label: "Partners" },
  { href: "#faq", label: "FAQ" },
];

export default function HeroMenu() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <nav className={`mod-hero-menu${open ? " mod-hero-menu--open" : ""}`} aria-label="Sections">
      <button
        className="mod-hero-menu-word"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        Menu
      </button>
      {open && (
        <div className="mod-hero-menu-list">
          {SECTIONS.map((s) => (
            <a key={s.href} href={s.href} onClick={() => setOpen(false)}>
              {s.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
