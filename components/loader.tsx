"use client";

import { useEffect, useState } from "react";
import Wordmark from "@/components/wordmark";
import { PHOTO_THUMBS, PLAY_IMAGES, isLineArt, thumb } from "@/lib/art-direction";

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
const LOADER_POOL = dealIn(dealIn(PHOTO_THUMBS, LOADER_LINES), LOADER_GIFS);

/* THE LOADER
   The whole page, white, filled with the index's own pictures - they arrive
   row by row, the way a contact sheet arrives as it loads, and leave again on
   the same wave just as fast. The wordmark is what is left in the middle.

   The wave is one CSS timeline and it ends itself: the last keyframe
   hides the layer, so the page underneath is reachable whether or not this
   component's JavaScript ever runs. What the script adds is the part CSS
   cannot do - taking the layer OUT of the page afterwards. Left in, it is a
   fixed full-viewport layer holding eighty-four pictures above everything
   else, and any re-render replays the whole wave over whatever you were
   reading.

   It plays on EVERY load. There was a once-a-session guard here; it is gone
   while the intro is being designed. If it should stop nagging returning
   visitors, that is a sessionStorage flag read at the top of this effect -
   nothing else needs to change.

   Twelve to a row, and a row lands as one - the delays are computed off that
   here rather than read off the DOM. */

const COLS = 12;
const ROWS = 7;
const CELLS = COLS * ROWS;

/* THE CLOCK, in one place. The CSS reads the two per-cell delays off the
   markup, so these numbers are the only ones. */
const LEAD = 170;                // a beat of empty page before row one, so
                                 // the first row is seen ARRIVING rather than
                                 // being there from the first frame
const ROW_STEP = 94;             // a row lands every 94ms
const OUT_STEP = 150;            // and leaves slower than it arrived
const HOLD = 100;                // the field stands complete - barely a beat
                                 // before the first row is taken away again
const CLEAR = LEAD + (ROWS - 1) * ROW_STEP + HOLD; // the first row leaves
const LAST_GONE = CLEAR + (ROWS - 1) * OUT_STEP; // the last row leaves
/* THE MARK IS UNCOVERED BY THE ROWS, NOT REVEALED AFTER THEM.
   It comes in over the last two row-steps, half at each: when one row is
   still standing you are seeing half the mark, and when that row goes you
   are seeing all of it. */
const MARK_STEPS = 2;
const MARK_IN = LAST_GONE - MARK_STEPS * OUT_STEP;
const REST = 240;                 // the mark stands there, whole, on white -
                                  // just long enough to register. It cannot
                                  // be less than nothing: the mark is black
                                  // and the film is dark, so the film cannot
                                  // begin before the mark has been seen.
/* and only THEN the white goes and the film starts painting - from the top
   down, so the last thing it reaches is the mark it covers */
const VEIL = LAST_GONE + REST;
const RUN_MS = VEIL;              // the layer leaves as the white does

export default function Loader() {
  const [done, setDone] = useState(false);

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
      className="loader"
      aria-hidden="true"
      /* the CSS reads its delays off these, so the clock above is the only
         place any of these numbers live */
      style={{
        ["--t-mark" as string]: `${MARK_IN}ms`,
        ["--t-mark-run" as string]: `${MARK_STEPS * OUT_STEP}ms`,
        ["--mark-steps" as string]: MARK_STEPS,
        ["--t-veil" as string]: `${VEIL}ms`,
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
              ["--in" as string]: `${LEAD + Math.floor(i / COLS) * ROW_STEP}ms`,
              ["--out" as string]: `${CLEAR + Math.floor(i / COLS) * OUT_STEP}ms`,
            }}
          >
            {/* dealt round the pool so no two neighbours repeat in a row */}
            <img src={LOADER_POOL[i % LOADER_POOL.length]} alt="" />
          </figure>
        ))}
      </div>
      <div className="loader-mark">
        <Wordmark label="100" className="loader-mark-svg" />
      </div>
    </div>
  );
}
