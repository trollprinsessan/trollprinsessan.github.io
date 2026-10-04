"use client";
import { useEffect, useRef } from "react";
import Wordmark from "@/components/wordmark";

/* THE MARK IS ALREADY THERE.
   The loader uncovers a whole "norrsken100" at the foot of the window and
   hands over to this one. It used to arrive a second time - fade in, blank
   number, count 000 to 100 over two seconds - which read as the page loading
   twice. Now it is the same mark, whole, from its first frame: the handover
   is nothing happening. */
export default function ManifestLogo() {
  const ref = useRef<HTMLDivElement>(null);

  /* the manifest above ends a masthead's height short of the screen, so this
     wordmark rides up into the same snapped view. Measured, because the
     wordmark scales with the window's width. */
  useEffect(() => {
    const mast = ref.current?.closest(".archive-masthead");
    if (!mast) return;
    const place = () => {
      document.documentElement.style.setProperty(
        "--masthead-h",
        `${Math.ceil(mast.getBoundingClientRect().height)}px`
      );
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(mast);
    return () => ro.disconnect();
  }, []);

  /* PARKED IS PARKED.
     There was a scroll-driven rotateY here, +/-16deg as the mark crossed the
     screen. In perspective a rotation changes the rendered WIDTH, so the mark
     breathed as you scrolled - including after it had stopped and stuck above
     the list, where nothing should move at all. The mark has a move of its
     own now: it rides the foot of the window and parks. That is the gesture;
     a tilt on top of it was noise. */

  return (
    <div ref={ref} className="manifest-logo">
      <Wordmark label="100" className="manifest-logo-svg" />
    </div>
  );
}
