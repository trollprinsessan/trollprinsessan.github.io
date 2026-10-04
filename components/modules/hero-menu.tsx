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
  /* whether the film is under the word: a strip at the head of the window,
     watched, so the word stands on the film in plain white */
  const [onFilm, setOnFilm] = useState(true);
  /* the section the reader is in, underlined in the list - so the menu is
     also where you are */
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    const hero = document.querySelector(".mod-hero");
    if (!hero) return;
    const io = new IntersectionObserver(
      ([e]) => setOnFilm(e.isIntersecting),
      { rootMargin: "0px 0px -95% 0px" }
    );
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  /* WHERE YOU ARE: whichever section crosses the middle of the window. The
     film counts as none of them. */
  useEffect(() => {
    const targets: [Element, string | null][] = [];
    const hero = document.querySelector(".mod-hero");
    if (hero) targets.push([hero, null]);
    for (const s of SECTIONS) {
      const el = document.querySelector(s.href);
      if (el) targets.push([el, s.href]);
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const hit = targets.find(([el]) => el === e.target);
          if (hit) setCurrent(hit[1]);
        }
      },
      { rootMargin: "-49% 0px -50% 0px" }
    );
    targets.forEach(([el]) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  /* THE JUMP GLIDES, AND LANDS WHERE THE SECTION IS READ.
     The list is read from under the pinned mark, so it lands with its first
     row at the mark's foot rather than beneath the letters. The address is
     left as it was: a section is somewhere on the page, not a page. */
  const go = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setOpen(false);
    const el = document.querySelector<HTMLElement>(href);
    if (!el) return;
    e.preventDefault();
    const mast =
      href === "#archive"
        ? document.querySelector(".archive-masthead")?.getBoundingClientRect().height ?? 0
        : 0;
    const top = el.getBoundingClientRect().top + window.scrollY - mast;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <nav
      className={`mod-hero-menu${open ? " mod-hero-menu--open" : ""}${onFilm ? " mod-hero-menu--on-film" : ""}`}
      aria-label="Sections"
    >
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
            <a
              key={s.href}
              href={s.href}
              onClick={(e) => go(e, s.href)}
              className={current === s.href ? "is-current" : undefined}
              aria-current={current === s.href ? "true" : undefined}
            >
              {s.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
