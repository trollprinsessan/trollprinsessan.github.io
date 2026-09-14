"use client";

import { useEffect, useState } from "react";

/* THE STAMP.
   Three lines in the corner of the film, the way a deck stamps its own
   picture: a running timecode, and the place - the tower, and its street
   address. The timecode runs on the film's clock: 294 frames at 20fps,
   14.7s, wrapping where the gif wraps. A clock, not a sync - they drift by
   a frame or two over a long visit and nobody can tell. */
const FPS = 20;
const FRAMES = 294;

export default function HeroOsd() {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      setFrame(Math.floor(((t - t0) / 1000) * FPS) % FRAMES);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  const two = (n: number) => String(n).padStart(2, "0");
  const tc = `00:00:${two(Math.floor(frame / FPS))}:${two(frame % FPS)}`;

  return (
    <div className="mod-hero-osd" aria-hidden="true">
      <span>{tc}</span>
      <span>Nasdaq Tower, Times Square</span>
      <span>4 Times Square, New York</span>
    </div>
  );
}
