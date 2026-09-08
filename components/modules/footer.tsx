// The record's last line: a hairline, the mark, the same links the nav
// carries, and the imprint. Nothing the page hasn't already said.
const SECTIONS = [
  { href: "#manifest", label: "Manifest" },
  { href: "#archive", label: "Archive" },
  { href: "#partners", label: "Partners" },
  { href: "#faq", label: "FAQ" },
];

const ELSEWHERE = [
  { href: "https://www.norrsken.org", label: "Norrsken" },
  { href: "https://www.norrsken.org", label: "Get Good News" },
];

export default function Footer() {
  return (
    <footer className="mod-footer">
      <div className="mod-footer-row">
        <span className="mod-footer-mark">norrsken100</span>
        <nav className="mod-footer-links" aria-label="Footer">
          {SECTIONS.map((s) => (
            <a key={s.label} href={s.href}>{s.label}</a>
          ))}
          {ELSEWHERE.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noreferrer">
              {s.label}
            </a>
          ))}
        </nav>
      </div>
      <div className="mod-footer-row mod-footer-row--imprint">
        <span>Norrsken Foundation · Stockholm · 2026</span>
        <a href="https://www.norrsken.org/100" target="_blank" rel="noreferrer">
          norrsken.org/100
        </a>
      </div>
    </footer>
  );
}
