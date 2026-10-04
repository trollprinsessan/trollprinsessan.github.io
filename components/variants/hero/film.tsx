"use client";

import "./film.css";
import { useEffect, useState } from "react";
import { useVersion } from "@/components/settings/registry";

/* THE FILM, AS A FILM. The original hero is two GIFs, 30.8MB and 6.7MB, and
   on a phone the intro waits on them. hero-v2 and -v3 play the same frames
   as video - the same two cuts, 16:9 and 9:16 - at 2.6MB and 0.4MB, with
   the first frame as a poster until the video has its own:

     hero-v1  the original GIFs
     hero-v2  the video; white behind the intro, then the film, as in v1
     hero-v3  the video; behind the intro, uncovered row by row as the
              intro's pictures leave (loader.tsx, film.css)

   The cut is chosen on the client - a <source media> in a <video> is not
   read everywhere - so until then the posters stand in, by the same media
   rule as the original picture. */
const GIF = "/Full_Film_Norrsken_Impact100_2023_NasdaqxTimesSquare_";

export default function HeroFilm() {
  const v = useVersion("hero");
  const [phone, setPhone] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 720px)");
    const on = () => setPhone(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  if (v === "v1") {
    return (
      <picture>
        <source media="(max-width: 720px)" srcSet={`${GIF}9x16.gif`} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${GIF}16x9.gif`} alt="Norrsken Impact 100 at Nasdaq Times Square" />
      </picture>
    );
  }
  if (phone === null) {
    return (
      <picture>
        <source media="(max-width: 720px)" srcSet="/film/poster-9x16.jpg" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/film/poster-16x9.jpg" alt="Norrsken Impact 100 at Nasdaq Times Square" />
      </picture>
    );
  }
  const cut = phone ? "9x16" : "16x9";
  return (
    <video
      key={cut}
      className="nk-film"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      poster={`/film/poster-${cut}.jpg`}
      aria-label="Norrsken Impact 100 at Nasdaq Times Square"
    >
      <source src={`/film/film-${cut}.webm`} type="video/webm" />
      <source src={`/film/film-${cut}.mp4`} type="video/mp4" />
    </video>
  );
}
