// `h` is a per-logo height computed from each PNG's real aspect ratio so every
// mark occupies roughly the same AREA, not the same height. A single shared
// height makes long wordmarks (Sequoia, ratio 7.6) look enormous next to square
// marks (Pale Blue Dot, ratio 0.9) — that is what caused the 5.6x size spread.
// The files are trimmed to their ink first: several carried a wide empty
// border (Kiko's mark was 18% of its canvas), so the same height drew them a
// third the size of the rest. Then a mild correction for weight - a solid
// disc reads bigger than a hairline wordmark of the same area.
// Formula: h = clamp(18, sqrt(4160 / ar) * clamp(0.85, (0.33 / ink)^0.25, 1.15), 58)
// where ar is the trimmed aspect ratio and ink the share of the trimmed box
// that is drawn. Regenerate if logos change.
/* THE NOMINATION PARTNERS' MARKS, from Backstage.
   The marquee used to be a hand-made folder that mixed partner marks with
   portfolio ones - eight companies from the list were in it, and thirty-one
   partners were missing. These are the fifty the API serves
   (backstage.norrsken.org/api/public/impact100, `partners`), in its own
   sort order, trimmed to their ink and saved at twice the height they are
   drawn at.

   `h` is a per-logo height computed from each file's real aspect ratio so
   every mark occupies roughly the same AREA, not the same height - a long
   wordmark set to one height dwarfs a square mark - with a mild correction
   for weight, since a solid disc reads bigger than a hairline wordmark of
   the same area.
   Formula: h = clamp(18, sqrt(4160 / ar) * clamp(0.85, (0.33 / ink)^0.25, 1.15), 58)
   where ar is the trimmed aspect ratio and ink the share of the trimmed box
   that is drawn. Regenerate if the list changes. */
const LOGOS = [
  { file: "world-fund.webp", name: "World Fund", h: 19 },
  { file: "voyager-vc.webp", name: "Voyager VC", h: 26 },
  { file: "unreasonable-group.webp", name: "Unreasonable Group", h: 58 },
  { file: "top-tier-impact.webp", name: "Top Tier Impact", h: 53 },
  { file: "softbank-group.webp", name: "SoftBank Group", h: 24 },
  { file: "ship2b.webp", name: "Ship2B", h: 43 },
  { file: "sequoia-capital.webp", name: "Sequoia Capital", h: 22 },
  { file: "prins-daniel-s-fellowship.webp", name: "Prins Daniel's Fellowship", h: 38 },
  { file: "plural.webp", name: "Plural", h: 35 },
  { file: "planet-a.webp", name: "Planet A", h: 32 },
  { file: "partech-partners.webp", name: "Partech Partners", h: 29 },
  { file: "pale-blue-vc.webp", name: "Pale Blue VC", h: 29 },
  { file: "obvious.webp", name: "Obvious", h: 42 },
  { file: "northzone.webp", name: "Northzone", h: 21 },
  { file: "norrsken-vc.webp", name: "Norrsken VC", h: 57 },
  { file: "norrsken-launcher.webp", name: "Norrsken Launcher", h: 33 },
  { file: "norrsken22.webp", name: "Norrsken22", h: 55 },
  { file: "norrsken-evolve.webp", name: "Norrsken Evolve", h: 38 },
  { file: "norrsken-africa-seed.webp", name: "Norrsken Africa Seed", h: 23 },
  { file: "mustard-seed-partners.webp", name: "Mustard Seed Partners", h: 29 },
  { file: "mudcake.webp", name: "Mudcake", h: 34 },
  { file: "mit-solve.webp", name: "MIT Solve", h: 31 },
  { file: "lumo-labs.webp", name: "Lumo Labs", h: 38 },
  { file: "lionheart-ventures.webp", name: "Lionheart Ventures", h: 58 },
  { file: "lightspeed-venture-partners.webp", name: "Lightspeed Venture Partners", h: 31 },
  { file: "leaps-by-bayer.webp", name: "Leaps by Bayer", h: 42 },
  { file: "kiko-vc.webp", name: "Kiko VC", h: 29 },
  { file: "katapult.webp", name: "Katapult", h: 49 },
  { file: "harvard-kennedy-school-sici.webp", name: "Harvard Kennedy School – SICI", h: 37 },
  { file: "giant-ventures.webp", name: "Giant Ventures", h: 58 },
  { file: "food-planet-prize.webp", name: "Food Planet Prize", h: 58 },
  { file: "first-circle-capital.webp", name: "First Circle Capital", h: 43 },
  { file: "fifty-years.webp", name: "Fifty Years", h: 55 },
  { file: "felix-capital.webp", name: "Felix Capital", h: 45 },
  { file: "eqt-ventures.webp", name: "EQT Ventures", h: 20 },
  { file: "eqt-foundation.webp", name: "EQT Foundation", h: 35 },
  { file: "enza-capital.webp", name: "Enza Capital", h: 37 },
  { file: "eka-ventures.webp", name: "EKA Ventures", h: 46 },
  { file: "dob-equity.webp", name: "DOB Equity", h: 32 },
  { file: "creandum.webp", name: "Creandum", h: 20 },
  { file: "collab-fund.webp", name: "Collab Fund", h: 30 },
  { file: "capital-t.webp", name: "Capital T", h: 54 },
  { file: "breakthrough-energy.webp", name: "Breakthrough Energy", h: 40 },
  { file: "bmw-foundation.webp", name: "BMW Foundation", h: 29 },
  { file: "blume-equity.webp", name: "Blume Equity", h: 50 },
  { file: "blue-lion.webp", name: "Blue Lion", h: 44 },
  { file: "blue-ashva-capital.webp", name: "Blue Ashva Capital", h: 44 },
  { file: "astralis-foundation.webp", name: "Astralis Foundation", h: 37 },
  { file: "ananda-impact-ventures.webp", name: "Ananda Impact Ventures", h: 39 },
  { file: "aenu.webp", name: "AENU", h: 35 },
];

// gigadesignstudio.com's logo wall: three rows, each an infinite marquee,
// alternating direction row to row.
function Row({ logos, reverse }: { logos: typeof LOGOS; reverse?: boolean }) {
  const doubled = [...logos, ...logos];
  return (
    <div className="mod-partners-marquee">
      <div className={`mod-partners-track${reverse ? " mod-partners-track--reverse" : ""}`}>
        {doubled.map((logo, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${logo.file}-${i}`}
            src={`/partner-logos/${logo.file}`}
            alt={logo.name}
            className="mod-partner-logo"
            style={{ ["--h" as string]: `${logo.h}px` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function Partners() {
  /* no title: the section is the logos alone, in three rows of a third each */
  const third = Math.ceil(LOGOS.length / 3);
  const rowA = LOGOS.slice(0, third);
  const rowB = LOGOS.slice(third, third * 2);
  const rowC = LOGOS.slice(third * 2);

  return (
    <section className="mod-partners" aria-label="Nomination partners">
      <Row logos={rowA} />
      <Row logos={rowB} reverse />
      <Row logos={rowC} />
    </section>
  );
}

/* The nomination partners, verbatim as supplied — the authoritative list of
   who nominates, which is NOT the same set as LOGOS above. LOGOS is the
   marquee, and it mixes partner marks with portfolio marks, so using it as
   the credit list named companies that never nominated anyone. */
export const NOMINATION_PARTNERS = [
  "Wave Ventures",
  "Plural",
  "Astralis Foundation",
  "Kinnevik",
  "SoftBank",
  "Telos Impact",
  "Merantix",
  "Fair Capital",
  "Revent VC",
  "4impact",
  "Ada Ventures",
  "Better Society Capital",
  "Bluelion",
  "BMW Foundation",
  "Earthshot prize",
  "Eka Ventures",
  "Inclimo (Climate Tech Fund)",
  "Index Ventures",
  "Leaps by Bayer",
  "Redalpine",
  "Rubio Impact Ventures",
  "SHIFT Invest",
  "Tilia Impact Ventures",
  "Visionaries Tomorrow",
  "Project Europe",
  "Pale Blue Dot",
  "Zero Carbon Capital",
  "CapitalT",
  "CarbonFix",
  "Top Tier Impact",
  "Blume Equity",
  "Lumo Labs",
  "Mudcake",
  "The Footprint Firm",
  "Vireo Ventures",
  "World Fund",
  "Nucleus Capital",
  "Norrsken Africa Seed",
  "Norrsken Evolve",
  "Norrsken Launcher",
  "Norrsken VC",
  "Norrsken22",
  "CIV",
  "Telescope Foundation",
  "Collaborative Fund",
  "Obvious Ventures",
  "TRACE",
  "Vox Capital",
  "Breakthrough Energy",
  "B Capital",
  "Egregor",
  "Enza Capital",
  "First Circle Capital",
  "Harvard SICI",
  "Innovative Finance Initiative",
  "Khosla Ventures",
  "Lionheart Ventures",
  "Longe VC",
  "MIT Solve",
  "Obama Foundation",
  "DOB Equity",
  "Prins Daniels Fellowship",
  "Shift4Good",
  "B+ Collective",
  "Kalytix Ventures",
  "Food Planet Prize",
  "Techleap",
  "Backing Minds",
  "AENU",
  "Ananda Impact Ventures",
  "Contrarian Ventures",
  "Kindred Capital (fka Earth)",
  "Kompas VC",
  "Voyager Ventures",
  "Pulse Foundation",
  "Tech Nation",
  "Sustainable Oceans Alliance",
  "Endeavor",
];
