"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useVersion } from "@/components/settings/registry";
import { web } from "@/lib/art-direction";

/* THE LATEST: the five items as supplied, newest first. Hardcoded until
   Backstage carries them - the shape below is what a feed would have to
   give: date, category, title, body, the picture, and where it goes. `image` is a path to
   a file in public/latest; an item without one shows the empty plate.
   The category is set in caps by the stylesheet, so it is written plainly
   here. */
const LATEST: {
  date: string;
  category: string;
  title: string;
  body: string;
  image: string;
  href: string;
  video?: string;
}[] = [
  {
    date: "14.10.26",
    category: "Article",
    title: "Norrsken100 2026 edition is out",
    body: "How the hundred were picked, what the field looks like this year, and every company in it.",
    /* the film's own frame, standing in until a picture is made */
    image: "/latest/times-square.webp",
    href: "https://www.norrsken.org/goodnews",
  },
  {
    date: "10.10.26",
    category: "Merch",
    title: "Wear 100 ways to fix the future",
    body: "One hundred ways to fix the future, printed on a shirt. An homage to the people on it.",
    image: "/latest/merch-shirt.webp",
    href: "https://norrsken-merch.vercel.app/shop",
  },
  {
    date: "14.10.26",
    category: "Event",
    title: "2026 Release in Norrsken House Barcelona",
    body: "At Impact Week 2026 in Barcelona, this year's Norrsken100 companies come together for the reveal. A hundred companies, a hundred ways to fix the future.",
    image: "/latest/release-barcelona.webp",
    href: "https://www.norrsken.org/impactweek",
  },
  {
    date: "12.04.26",
    category: "Open letter",
    title: "Make Europe the Electro Union",
    body: "Europe has the technology to run on clean electricity made in Europe. What's missing is the political will to build a union around it. Read the open letter.",
    /* the cinemagraph from the letter; no still was made, so the card
       plays it, silent and looping */
    image: "",
    video: "/latest/electro-union.mp4",
    href: "https://www.norrsken.org/goodnews/make-europe-the-electro-union",
  },
  {
    date: "03.09.25",
    category: "Open letter",
    title: "Prompt What Matters",
    body: "AI will decide which problems get solved over the next decade. This open letter asks the people building it to aim it at the ones that matter most. Read more.",
    image: "/latest/prompt-what-matters.webp",
    href: "https://www.norrsken.org/goodnews/prompt-what-matters",
  },
];

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
    return card ? card.offsetWidth + 24 : el.clientWidth / 2;
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
    /* THE TRACK TAKES THE POINTER ONLY ONCE IT IS BEING DRAGGED.
       Capturing it on the press sent the click to the track rather than to
       the card under the cursor, and the cards - which are links - could
       not be opened with a mouse at all. */
    drag.current = { x: e.clientX, left: el.scrollLeft, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 4 && !d.moved) {
      d.moved = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      e.currentTarget.classList.add("is-dragging");
    }
    if (!d.moved) return;
    e.currentTarget.scrollLeft = d.left - dx;
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    const el = e.currentTarget;
    if (d.moved && el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    if (!d.moved) return;
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
          src={web("/title-gifs/the-latest.gif")}
          alt="The Latest Updates"
          loading="lazy"
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

      {(
        track()
      )}
    </section>
  );

  function track() {
    return (
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
          <a
            key={item.title}
            className="mod-latest-card"
            href={item.href}
            /* the merch shop is a site of its own; everything else is a page
               of norrsken.org, which is where this page already lives */
            target={item.href.startsWith("https://www.norrsken.org") ? undefined : "_blank"}
            rel={item.href.startsWith("https://www.norrsken.org") ? undefined : "noopener noreferrer"}
          >
            <div className="mod-latest-media">
              {item.video ? (
                /* silent, looping, no controls: a moving plate, not a player */
                <video
                  src={item.video}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-hidden="true"
                />
              ) : item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image} alt="" loading="lazy" />
              ) : (
                <span className="mod-latest-media-placeholder">Image</span>
              )}
            </div>
            <h3 className="mod-latest-title">{item.title}</h3>
            <span className="mod-latest-category">{item.category}</span>
            <p className="mod-latest-body">{item.body}</p>
            <span className="mod-latest-date">{item.date}</span>
          </a>
        ))}
      </div>
    );
  }
}
