"use client";

import { useEffect, useRef, useState } from "react";

// studioraheem.it masthead: a small, centred white bar pinned near the top.
// The menu follows centrephotogeneve.ch — the panel is NOT an overlay. It
// sits fixed behind the page at z-index -1, and opening the menu slides the
// whole page down off it. See .site-menu-panel / body.menu-open main.
const SECTIONS = [
  { href: "#manifest", label: "Manifest" },
  { href: "#archive", label: "Archive" },
  { href: "#partners", label: "Partners" },
  { href: "#network", label: "Network" },
  { href: "#faq", label: "FAQ" },
];

const ELSEWHERE = [
  { href: "https://www.norrsken.org", label: "Norrsken" },
  { href: "https://www.norrsken.org", label: "Get Good News" },
];

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);

  const lockedScroll = useRef(0);

  // Freeze the page while the menu is open, the way the reference does.
  // Simply translating <main> was not enough: it left the page in normal flow,
  // so the 50vh shift grew the document by 50vh, resized the scrollbar and
  // shoved the reader's position down half a screen. Pinning <body> with
  // position: fixed at -scrollY holds the view exactly where it was and keeps
  // the document from growing; the offset is restored on close.
  useEffect(() => {
    const body = document.body;
    if (menuOpen) {
      lockedScroll.current = window.scrollY;
      body.style.top = `-${lockedScroll.current}px`;
      body.classList.add("menu-open");
    } else if (body.classList.contains("menu-open")) {
      body.classList.remove("menu-open");
      body.style.top = "";
      window.scrollTo(0, lockedScroll.current);
    }
  }, [menuOpen]);

  // A plain #hash jump resolves against the CURRENT box, and <main> is still
  // translated 50vh while the menu closes — so the browser lands exactly one
  // panel-height short. offsetTop walks the layout tree and ignores
  // transforms, giving the true resting position regardless of the animation.
  const goToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const target = document.getElementById(href.slice(1));
    setMenuOpen(false);
    if (!target) return;
    let y = 0;
    for (let n = target as HTMLElement | null; n; n = n.offsetParent as HTMLElement | null) {
      y += n.offsetTop;
    }
    // Wait for the scroll lock to actually lift. A fixed number of frames is
    // not enough — while body still has overflow: hidden the document is
    // shorter, so the browser clamps the scroll short of the target.
    const whenUnlocked = (tries = 0) => {
      if (document.body.classList.contains("menu-open") && tries < 60) {
        requestAnimationFrame(() => whenUnlocked(tries + 1));
        return;
      }
      window.scrollTo({ top: y, behavior: "smooth" });
      history.replaceState(null, "", href);
    };
    // the unpin above restores the old offset first; jump from there
    whenUnlocked();
  };

  const focusSearch = () => {
    document.getElementById("archive")?.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => (document.querySelector(".search") as HTMLInputElement | null)?.focus(), 400);
  };

  return (
    <>
      <header className="site-nav">
        <div className="site-nav-blend">
          <div className="site-nav-top">
            {/* the bar label stays "Menu" whether open or shut — the source
                never swaps it; closing is done by the big word in the panel */}
            <button className="site-nav-menu" onClick={() => setMenuOpen((v) => !v)}>
              Menu
            </button>
            <span className="site-nav-title">norrsken100</span>
            <button className="site-nav-search" onClick={focusSearch}>Search</button>
          </div>
        </div>
      </header>

      {/* sibling of <main>, not a child of the nav — it has to share <main>'s
          stacking context for z-index: -1 to actually put it underneath. */}
      <div
        className={`site-menu-panel${menuOpen ? " site-menu-panel--open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <div className="site-menu-grid">
          <nav className="site-menu-links">
            {SECTIONS.map((s) => (
              <a key={s.href} href={s.href} onClick={(e) => goToSection(e, s.href)}>{s.label}</a>
            ))}
          </nav>
          <nav className="site-menu-links">
            {ELSEWHERE.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noreferrer">{s.label}</a>
            ))}
          </nav>
        </div>
        <button className="site-menu-close" onClick={() => setMenuOpen(false)}>
          Close
        </button>
      </div>
    </>
  );
}
