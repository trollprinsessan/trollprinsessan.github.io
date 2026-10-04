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
export const LOGOS = [
  { file: "world-fund.png", name: "World Fund", h: 19 },
  { file: "sequoia.png", name: "Sequoia Capital", h: 22 },
  { file: "softbank.png", name: "SoftBank", h: 25 },
  { file: "mit-solve.png", name: "MIT Solve", h: 32 },
  { file: "leaps-by-bayer.png", name: "Leaps by Bayer", h: 41 },
  { file: "planet-a-ventures.png", name: "Planet A", h: 32 },
  { file: "unreasonable.png", name: "Unreasonable Group", h: 58 },
  { file: "voyager-logo.png", name: "Voyager VC", h: 27 },
  { file: "norrskenvc-black.png", name: "Norrsken VC", h: 57 },
  { file: "norrskenlauncher-logo-black.png", name: "Norrsken Launcher", h: 33 },
  { file: "norrsken-evolve-logo-black.png", name: "Norrsken Evolve", h: 38 },
  { file: "norrsken22-black.png", name: "Norrsken22", h: 55 },
  { file: "norrsken-foundation-logo-black.png", name: "Norrsken Foundation", h: 24 },
  { file: "fleetzero-black-v.png", name: "Fleetzero", h: 58 },
  { file: "food-planet-prize.png", name: "Food Planet Prize", h: 58 },
  { file: "katapult-updated.png", name: "Katapult", h: 49 },
  { file: "kiko-ventures.png", name: "Kiko Ventures", h: 30 },
  { file: "lightspeed.png", name: "Lightspeed", h: 32 },
  { file: "lionheart-ventures.png", name: "Lionheart Ventures", h: 58 },
  { file: "mudcake.png", name: "Mudcake", h: 35 },
  { file: "mustard.png", name: "Mustard", h: 29 },
  { file: "nala-earth.png", name: "Nala Earth", h: 39 },
  { file: "northzone.png", name: "Northzone", h: 21 },
  { file: "oriole-networks-main-logo-768x216.png", name: "Oriole Networks", h: 25 },
  { file: "pale-blue-dot.png", name: "Pale Blue Dot", h: 55 },
  { file: "phaidra-png-2.png", name: "Phaidra", h: 43 },
  { file: "pionix.png", name: "Pionix", h: 37 },
  { file: "plural.png", name: "Plural", h: 35 },
  { file: "project-eaden-logo-stacked-left-black4x.png", name: "Project Eaden", h: 32 },
  { file: "ship2b.png", name: "Ship2B", h: 45 },
  { file: "sici-screenshot.png", name: "Sici", h: 38 },
  { file: "top-tier-impact.png", name: "Top Tier Impact", h: 42 },
  { file: "trawa-logo-png.png", name: "Trawa", h: 33 },
  { file: "vaayu-logo-black.png", name: "Vaayu", h: 38 },
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
