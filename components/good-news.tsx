"use client";

import { useEffect, useRef, useState } from "react";

/* architecturecuratingpractice.com's floating note, measured: a fixed,
   draggable box with a title row, a [close], and the newsletter pitch under
   it. Theirs is 270x102 on acid green at 8px; this one is in the site's own
   black and white, on the site's own 11px, with no radius.
   It follows you down the page and can be dragged anywhere or dismissed;
   dismissal is remembered so it cannot nag. */
const DISMISSED = "n100-goodnews-dismissed";

export default function GoodNews() {
  const [shown, setShown] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISSED) === "1";
    } catch {
      /* private windows throw on access: show the note */
    }
    if (dismissed) return;
    // it arrives once the reader is into the page, not on top of the hero
    const onScroll = () => {
      if (window.scrollY > window.innerHeight * 1.2) {
        setShown(true);
        window.removeEventListener("scroll", onScroll);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const close = () => {
    setShown(false);
    try {
      localStorage.setItem(DISMISSED, "1");
    } catch {
      /* nothing to remember it with; it will return next visit */
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    // the title row is the handle; the link is not
    if ((e.target as HTMLElement).closest("a, button")) return;
    drag.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setPos({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y });
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  if (!shown) return null;

  return (
    <aside
      className="goodnews"
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      aria-label="Good News"
    >
      <div className="goodnews-head">
        <span>Good News</span>
        <button onClick={close} aria-label="Close">
          [close]
        </button>
      </div>
      <p className="goodnews-body">
        The week&rsquo;s progress, once a week. Written by the people funding it.
      </p>
      <a
        className="goodnews-link"
        href="https://www.norrsken.org/goodnews"
        target="_blank"
        rel="noreferrer"
      >
        Subscribe
      </a>
    </aside>
  );
}
