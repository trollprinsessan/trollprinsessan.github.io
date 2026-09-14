import HeroOsd from "./hero-osd";

export default function Hero() {
  return (
    <section className="mod-hero">
      <div className="mod-hero-media">
        {/* TWO CUTS OF THE SAME FILM.
            The 16:9 frame is Times Square with the tower in the middle of
            it; a cover crop of that onto a phone left a strip of the tower
            with the words running off both edges. The phone gets a 9:16 cut
            made from the same frames - the tower, whole, and nothing else -
            so the film is a portrait there rather than a landscape squeezed
            into one. Same 294 frames, same clock; 6.7MB against 30. */}
        <picture>
          <source
            media="(max-width: 720px)"
            srcSet="/Full_Film_Norrsken_Impact100_2023_NasdaqxTimesSquare_9x16.gif"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/Full_Film_Norrsken_Impact100_2023_NasdaqxTimesSquare_16x9.gif"
            alt="Norrsken Impact 100 at Nasdaq Times Square"
          />
        </picture>
        {/* inside the media, all of them - the stamp, the scanlines, the
            grain - so they paint in with the film's bands rather than
            standing on the white before it */}
        <HeroOsd />
        <div className="mod-hero-scan" aria-hidden="true" />
        <div className="mod-hero-grain" aria-hidden="true" />
      </div>
    </section>
  );
}
