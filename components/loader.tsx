"use client";

import { useEffect, useState } from "react";
import Wordmark from "@/components/wordmark";
import { PHOTO_THUMBS } from "@/lib/art-direction";

/* THE LOADER
   The whole page, white, filled with the index's own pictures - they arrive
   row by row, the way a contact sheet arrives as it loads, and leave again on
   the same wave just as fast. The wordmark is what is left in the middle.

   The wave is one CSS timeline, 2450ms, and it ends itself: the last keyframe
   hides the layer, so the page underneath is reachable whether or not this
   component's JavaScript ever runs. What the script adds is the part CSS
   cannot do - taking the layer OUT of the page afterwards, and playing it
   once a session rather than on every load. Left in, it is a fixed
   full-viewport layer holding eighty-four pictures above everything else,
   and any re-render replays the whole wave over whatever you were reading.

   Twelve to a row, and a row lands as one - the delays are computed off that
   here rather than read off the DOM. */

const COLS = 12;
const ROWS = 7;
const CELLS = COLS * ROWS;
const RUN_MS = 2450;
const SEEN = "n100-loader-seen";

export default function Loader() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN) === "1";
      sessionStorage.setItem(SEEN, "1");
    } catch {
      /* a private window or blocked storage: just play it */
    }
    if (seen) {
      setDone(true);
      return;
    }
    const t = setTimeout(() => setDone(true), RUN_MS);
    return () => clearTimeout(t);
  }, []);

  if (done) return null;

  return (
    <div className="loader" aria-hidden="true">
      <div className="loader-sheet">
        {Array.from({ length: CELLS }, (_, i) => (
          <figure
            key={i}
            className="loader-cell"
            /* a whole row at a time, not a cell at a time */
            style={{ animationDelay: `${Math.floor(i / COLS) * 0.11}s` }}
          >
            {/* dealt round the pool so no two neighbours repeat in a row */}
            <img src={PHOTO_THUMBS[i % PHOTO_THUMBS.length]} alt="" />
          </figure>
        ))}
      </div>
      <div className="loader-mark">
        <Wordmark label="100" className="loader-mark-svg" />
      </div>
    </div>
  );
}
