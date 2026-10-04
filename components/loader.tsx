"use client";

import { useEffect, useRef, useState } from "react";
import Wordmark from "@/components/wordmark";
import { PHOTO_THUMBS, PLAY_IMAGES, cardSrc, isLineArt, thumb } from "@/lib/art-direction";

/* the photographs and cutouts, with the line drawings and four of the
   animated plates dealt in among them at even intervals - spread through the
   field, never landing together in one row */
const LOADER_LINES = PLAY_IMAGES.filter(isLineArt).map(thumb);
const LOADER_GIFS = [
  "/n100/spaceforge.gif",
  "/n100/arcride.gif",
  "/n100/ampdenergy.gif",
  "/n100/arkeabio.gif",
];
function dealIn(base: string[], extra: string[]) {
  const out = [...base];
  const every = base.length / extra.length;
  /* from the back, so an insert does not shift the places still to come */
  for (let i = extra.length - 1; i >= 0; i--) {
    out.splice(Math.round(every * i + every / 2), 0, extra[i]);
  }
  return out;
}
const LOADER_POOL = dealIn(dealIn(PHOTO_THUMBS, LOADER_LINES), LOADER_GIFS.map(cardSrc));
const CELLS = 12 * 7;                // the field stands complete - barely a beat
                                 // before the first row is taken away again
const CLEAR = 170 + (7 - 1) * 94 + 100; // the first row leaves
const LAST_GONE = CLEAR + (7 - 1) * 150;
const MARK_IN = LAST_GONE - 2 * 150;                 // the mark stands there, whole, on white -
                                  // just long enough to register. It cannot
                                  // be less than nothing: the mark is black
                                  // and the film is dark, so the film cannot
                                  // begin before the mark has been seen.
/* and only THEN the white goes and the film starts painting - from the top
   down, so the last thing it reaches is the mark it covers */
const VEIL = LAST_GONE + 240;
const RUN_MS = VEIL;              // the layer leaves as the white does

export default function Loader() {
  const [done, setDone] = useState(false);

  /* THE LOADER'S MARK IS LAID ON THE REAL ONE, MEASURED.
     Set from the window's edges it was the real mark's box only where the
     window and the page are the same width - a scrollbar, a phone's own foot
     spacing, and the two parted by a few pixels and the handover read as a
     double. So it takes the masthead's own box: its left edge, its width,
     and - while the masthead stands at the foot of the window, as it does
     under the intro - its foot. */
  const markRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const mark = markRef.current;
    const mast = document.querySelector<HTMLElement>(".archive-masthead");
    if (!mark || !mast) return;
    const place = () => {
      const r = mast.getBoundingClientRect();
      const cs = getComputedStyle(mast);
      const padL = parseFloat(cs.paddingLeft) || 0;
      const padR = parseFloat(cs.paddingRight) || 0;
      const padB = parseFloat(cs.paddingBottom) || 0;
      mark.style.left = `${r.left + padL}px`;
      mark.style.right = "auto";
      mark.style.width = `${r.width - padL - padR}px`;
      const foot = r.bottom - padB;
      if (r.bottom <= window.innerHeight + 1 && r.bottom > window.innerHeight / 2) {
        mark.style.bottom = `${window.innerHeight - foot}px`;
      }
    };
    place();
    /* re-laid whenever the masthead's box changes, which a window resize
       does not always announce (a device turning, a viewport settling), and
       once more just before the mark shows, whatever happened in between */
    const ro = new ResizeObserver(place);
    ro.observe(mast);
    window.addEventListener("resize", place);
    const again = setTimeout(place, Math.max(0, MARK_IN - 50));
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", place);
      clearTimeout(again);
    };
  }, []);

  /* THE PAGE MOVED UNDER THE INTRO: the loader's mark is fixed
     to the window where the real one stood, so a scroll before the intro
     has ended parts the two and both show. The real one is the page's: the
     loader's goes the moment the page moves. */
  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY < 2 || !markRef.current) return;
      markRef.current.style.visibility = "hidden";
      window.removeEventListener("scroll", onScroll);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    /* THE INTRO IS FOR THE FRONT DOOR. A visit to the page as it is - no
       company, no list state, no section in the address - gets it; a link
       into something, or coming back with the back button, does not. The
       decision is made before the first paint by the script in the layout,
       which marks the root; here the layer simply stands down. */
    if (root.classList.contains("no-loader")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDone(true);
      return;
    }
    /* the film waits behind the veil rather than assembling under it */
    root.classList.add("intro");
    /* the film starts painting under the mark, not after it */
    const v = setTimeout(() => root.classList.remove("intro"), VEIL);
    const t = setTimeout(() => setDone(true), RUN_MS);
    return () => {
      clearTimeout(v);
      clearTimeout(t);
      root.classList.remove("intro");
    };
  }, []);

  if (done) return null;

  return (
    <div
      className={`loader loader--behind`}
      aria-hidden="true"
      /* the CSS reads its delays off these, so the clock above is the only
         place any of these numbers live */
      style={{
        ["--t-mark" as string]: `${MARK_IN}ms`,
        ["--t-mark-run" as string]: `${2 * 150}ms`,
        ["--mark-steps" as string]: 2,
        ["--t-veil" as string]: `${VEIL}ms`,
        ["--t-clear" as string]: `${CLEAR}ms`,
        ["--t-out-run" as string]: `${7 * 150}ms`,
        ["--rows" as string]: 7,
      }}
    >
      <div className="loader-sheet">
        {Array.from({ length: CELLS }, (_, i) => (
          <figure
            key={i}
            className="loader-cell"
            /* a whole row at a time, in AND out: the field fills row by row
               and empties the same way */
            style={{
              ["--in" as string]: `${170 + Math.floor(i / 12) * 94}ms`,
              ["--out" as string]: `${CLEAR + Math.floor(i / 12) * 150}ms`,
            }}
          >
            {/* dealt round the pool so no two neighbours repeat in a row */}
            <img src={LOADER_POOL[i % LOADER_POOL.length]} alt="" />
          </figure>
        ))}
      </div>
      <div className="loader-mark" ref={markRef}>
        <Wordmark label="100" className="loader-mark-svg" />
      </div>
    </div>
  );
}
