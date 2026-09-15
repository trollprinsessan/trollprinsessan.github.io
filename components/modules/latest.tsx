"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// PLACEHOLDER CONTENT — lorem ipsum standing in until real items are supplied.
// Only `category` is real: the mix of types (event / fundraise / report /
// partnership) is the whole point of the section, after studioraheem.it's
// "Selected Works", where every card carries its own category label.
const LATEST = [
  {
    date: "18.08.26",
    category: "Fundraise",
    title: "Lorem ipsum dolor sit amet",
    body: "Consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco.",
  },
  {
    date: "02.09.26",
    category: "Event",
    title: "Duis aute irure dolor",
    body: "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus.",
  },
  {
    date: "14.09.26",
    category: "Report",
    title: "Sed ut perspiciatis unde omnis",
    body: "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.",
  },
  {
    date: "28.09.26",
    category: "Partnership",
    title: "Neque porro quisquam est",
    body: "Qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam.",
  },
  {
    date: "07.10.26",
    category: "Event",
    title: "Quis autem vel eum iure",
    body: "Reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur at vero eos.",
  },
  {
    date: "21.10.26",
    category: "Fundraise",
    title: "At vero eos et accusamus",
    body: "Et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati.",
  },
];

const GAP = 24;

export default function Latest() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  /* the first card in view, for the counter */
  const [at, setAt] = useState(0);

  /* one card and its gap: what Prev, Next, the arrow keys and a drag's
     landing all move by, so a card is never left half-cropped */
  const stepOf = (el: HTMLElement) => {
    const card = el.querySelector<HTMLElement>(".mod-latest-card");
    return card ? card.offsetWidth + GAP : el.clientWidth / 2;
  };

  const sync = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    // the track carries a horizontal padding, and scroll-snap parks the first
    // card at that offset — so resting scrollLeft is the padding, not 0.
    // Tolerance has to clear it or the back arrow never reads as disabled.
    const pad = parseFloat(getComputedStyle(el).paddingLeft) || 0;
    const end = el.scrollLeft >= el.scrollWidth - el.clientWidth - 2;
    setAtStart(el.scrollLeft <= pad + 2);
    setAtEnd(end);
    setAt(end ? LATEST.length - 1 : Math.round(el.scrollLeft / stepOf(el)));
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [sync]);

  const page = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * stepOf(el), behavior: "smooth" });
  };

  /* THE TRACK TAKES A HAND.
     A mouse can take hold of the cards and pull them along, the way a finger
     already can; let go and the track settles on the nearest card. The snap
     is lifted while the hand is on it, or it would fight every pixel. A drag
     that travelled is not a click. Touch keeps the browser's own swipe. */
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    const el = e.currentTarget;
    drag.current = { x: e.clientX, left: el.scrollLeft, moved: false };
    el.setPointerCapture(e.pointerId);
    el.classList.add("is-dragging");
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 4) d.moved = true;
    e.currentTarget.scrollLeft = d.left - dx;
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    const el = e.currentTarget;
    const pad = parseFloat(getComputedStyle(el).paddingLeft) || 0;
    const step = stepOf(el);
    const target = Math.round((el.scrollLeft - pad) / step) * step + pad;
    el.scrollTo({ left: target, behavior: "smooth" });
    /* the snap comes back once the glide has landed */
    setTimeout(() => el.classList.remove("is-dragging"), 450);
    if (d.moved) {
      const swallow = (ev: Event) => { ev.stopPropagation(); ev.preventDefault(); };
      el.addEventListener("click", swallow, { capture: true, once: true });
    }
  };

  return (
    <section className="mod-latest">
      <div className="mod-section-header">
        <img
          className="mod-title-art mod-title-art--latest"
          src="/title-gifs/the-latest.gif"
          alt="The Latest Updates"
        />
        <div className="mod-latest-nav">
          {/* where you are in the run */}
          <span className="mod-latest-count" aria-live="polite">
            {at + 1} / {LATEST.length}
          </span>
          <button
            className="mod-latest-arrow"
            onClick={() => page(-1)}
            disabled={atStart}
            aria-label="Previous"
          >
            Prev
          </button>
          <button
            className="mod-latest-arrow"
            onClick={() => page(1)}
            disabled={atEnd}
            aria-label="Next"
          >
            Next
          </button>
        </div>
      </div>

      <div
        className="mod-latest-track"
        ref={trackRef}
        /* in the tab order, so the arrow keys can page it */
        tabIndex={0}
        aria-label="The latest updates"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") { e.preventDefault(); page(1); }
          else if (e.key === "ArrowLeft") { e.preventDefault(); page(-1); }
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {LATEST.map((item) => (
          <article key={item.title} className="mod-latest-card">
            <div className="mod-latest-media">
              <span className="mod-latest-media-placeholder">Image</span>
            </div>
            <h3 className="mod-latest-title">{item.title}</h3>
            <span className="mod-latest-category">{item.category}</span>
            <p className="mod-latest-body">{item.body}</p>
            <span className="mod-latest-date">{item.date}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
