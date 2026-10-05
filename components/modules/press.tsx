/* THE PRESS: four marks, each a link to what was written. No heading, no
   quotes, no dates - the logos are the credit, the way the nomination
   partners' wall works a section earlier. Hardcoded until Backstage
   carries press cuttings: the shape below is all a feed would need.

   `h` is the per-logo height, the same equal-area normalisation the
   partners' marquee uses (see partners.tsx) - a wide wordmark and a stacked
   mark set to one height read as two different sizes. */
const PRESS = [
  {
    file: "forbes.webp",
    name: "Forbes",
    h: 30,
    href: "https://www.forbes.com/sites/trevorclawson/2023/08/30/entrepreneurs-need-better-role-models-says-klarna-co-founder/",
  },
  {
    file: "sifted.webp",
    name: "Sifted",
    h: 35,
    href: "https://sifted.eu/articles/the-46-most-promising-impact-startups-in-europe-according-to-investors",
  },
  {
    file: "fortune.webp",
    name: "Fortune",
    h: 28,
    href: "https://fortune.com/europe/2024/06/12/hollywood-star-alexander-skarsgard-is-spotifys-new-voice-of-conscious-capitalismheres-why-sweden-is-the-world-leader/",
  },
  {
    file: "tech-eu.webp",
    name: "tech.eu",
    h: 52,
    href: "https://tech.eu/2024/09/25/unveiling-impact-unicorns-norrsken-foundations-aannual-impact100/",
  },
];

export default function Press() {
  return (
    <section className="mod-press" aria-label="Press">
      <div className="mod-press-row">
        {PRESS.map((p) => (
          <a
            key={p.file}
            className="mod-press-link"
            href={p.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${p.name} on the Norrsken100`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="mod-press-logo"
              src={`/press/${p.file}`}
              alt={p.name}
              style={{ ["--h" as string]: `${p.h}px` }}
              loading="lazy"
            />
          </a>
        ))}
      </div>
    </section>
  );
}
