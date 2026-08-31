// `h` is a per-logo height computed from each PNG's real aspect ratio so every
// mark occupies roughly the same AREA, not the same height. A single shared
// height makes long wordmarks (Sequoia, ratio 7.6) look enormous next to square
// marks (Pale Blue Dot, ratio 0.9) — that is what caused the 5.6x size spread.
// Formula: h = clamp(22, sqrt(4160 / aspectRatio), 58) — the original
// clamp(28, sqrt(6500 / ar), 72) scaled to 80%. Regenerate if logos change.
export const LOGOS = [
  { file: "world-fund.png", name: "World Fund", h: 27 },
  { file: "sequoia.png", name: "Sequoia Capital", h: 23 },
  { file: "softbank.png", name: "SoftBank", h: 48 },
  { file: "mit-solve.png", name: "MIT Solve", h: 58 },
  { file: "leaps-by-bayer.png", name: "Leaps by Bayer", h: 39 },
  { file: "planet-a-ventures.png", name: "Planet A", h: 38 },
  { file: "unreasonable.png", name: "Unreasonable Group", h: 58 },
  { file: "voyager-logo.png", name: "Voyager VC", h: 34 },
  { file: "norrskenvc-black.png", name: "Norrsken VC", h: 58 },
  { file: "norrskenlauncher-logo-black.png", name: "Norrsken Launcher", h: 38 },
  { file: "norrsken-evolve-logo-black.png", name: "Norrsken Evolve", h: 40 },
  { file: "norrsken22-black.png", name: "Norrsken22", h: 48 },
  { file: "norrsken-foundation-logo-black.png", name: "Norrsken Foundation", h: 24 },
  { file: "fleetzero-black-v.png", name: "Fleetzero", h: 58 },
  { file: "food-planet-prize.png", name: "Food Planet Prize", h: 49 },
  { file: "katapult-updated.png", name: "Katapult", h: 43 },
  { file: "kiko-ventures.png", name: "Kiko Ventures", h: 48 },
  { file: "lightspeed.png", name: "Lightspeed", h: 46 },
  { file: "lionheart-ventures.png", name: "Lionheart Ventures", h: 58 },
  { file: "mudcake.png", name: "Mudcake", h: 46 },
  { file: "mustard.png", name: "Mustard", h: 36 },
  { file: "nala-earth.png", name: "Nala Earth", h: 39 },
  { file: "northzone.png", name: "Northzone", h: 34 },
  { file: "oriole-networks-main-logo-768x216.png", name: "Oriole Networks", h: 34 },
  { file: "pale-blue-dot.png", name: "Pale Blue Dot", h: 58 },
  { file: "phaidra-png-2.png", name: "Phaidra", h: 48 },
  { file: "pionix.png", name: "Pionix", h: 42 },
  { file: "plural.png", name: "Plural", h: 38 },
  { file: "project-eaden-logo-stacked-left-black4x.png", name: "Project Eaden", h: 34 },
  { file: "ship2b.png", name: "Ship2B", h: 41 },
  { file: "sici-screenshot.png", name: "Sici", h: 37 },
  { file: "top-tier-impact.png", name: "Top Tier Impact", h: 40 },
  { file: "trawa-logo-png.png", name: "Trawa", h: 33 },
  { file: "vaayu-logo-black.png", name: "Vaayu", h: 36 },
];

// gigadesignstudio.com's logo wall: two rows, each an infinite marquee,
// scrolling in opposite directions.
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
            style={{ height: `${logo.h}px` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function Partners() {
  const mid = Math.ceil(LOGOS.length / 2);
  const rowA = LOGOS.slice(0, mid);
  const rowB = LOGOS.slice(mid);

  return (
    <section className="mod-partners">
      <div className="mod-section-header">
        <span className="mod-eyebrow">Nomination Partners</span>
        <span className="mod-eyebrow-right">{LOGOS.length}+ organisations</span>
      </div>
      <Row logos={rowA} />
      <Row logos={rowB} reverse />
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
