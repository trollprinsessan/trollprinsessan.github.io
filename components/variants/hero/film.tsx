"use client";

import "./film.css";
import { useEffect, useState } from "react";
import { useVersion } from "@/components/settings/registry";

export default function HeroFilm() {
  const [phone, setPhone] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 720px)");
    const on = () => setPhone(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
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
