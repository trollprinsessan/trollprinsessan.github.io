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

export default function Latest() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const sync = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    // the track carries a horizontal padding, and scroll-snap parks the first
    // card at that offset — so resting scrollLeft is the padding, not 0.
    // Tolerance has to clear it or the back arrow never reads as disabled.
    const pad = parseFloat(getComputedStyle(el).paddingLeft) || 0;
    setAtStart(el.scrollLeft <= pad + 2);
    setAtEnd(el.scrollLeft >= el.scrollWidth - el.clientWidth - 2);
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

  // page by exactly one card + gap, so cards never end up half-cropped
  const page = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(".mod-latest-card");
    const step = card ? card.offsetWidth + 24 : el.clientWidth / 2;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
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

      <div className="mod-latest-track" ref={trackRef}>
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
