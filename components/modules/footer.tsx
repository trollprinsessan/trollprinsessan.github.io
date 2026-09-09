// The record's last line: the page's own sections in one column, Norrsken in
// the next, the Good News sign-up in the last, then the imprint. Set on the
// page's twelve tracks, at 13px.
const SECTIONS = [
  { href: "#manifest", label: "Manifest" },
  { href: "#archive", label: "Archive" },
  { href: "#latest", label: "Latest" },
  { href: "#partners", label: "Partners" },
  { href: "#faq", label: "FAQ" },
];

const ELSEWHERE = [
  { href: "https://www.norrsken.org", label: "Norrsken" },
  { href: "https://www.norrsken.org/goodnews", label: "Good News" },
  { href: "https://www.instagram.com/norrsken", label: "Instagram" },
  { href: "https://www.linkedin.com/company/norrsken-foundation", label: "LinkedIn" },
];

export default function Footer() {
  return (
    <footer className="mod-footer">
      <div className="mod-footer-row">
        <nav className="mod-footer-links" aria-label="Sections">
          {SECTIONS.map((s) => (
            <a key={s.label} href={s.href}>{s.label}</a>
          ))}
        </nav>

        <nav className="mod-footer-links" aria-label="Norrsken">
          {ELSEWHERE.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noreferrer">
              {s.label}
            </a>
          ))}
        </nav>

        {/* The sign-up. The field has no endpoint yet: submitting hands the
            address to Norrsken's own Good News page rather than pretending to
            capture it here. */}
        <form
          className="mod-footer-signup"
          action="https://www.norrsken.org/goodnews"
          method="get"
          target="_blank"
        >
          <div className="mod-footer-signup-field">
            <input
              type="email"
              name="email"
              required
              placeholder="Email"
              aria-label="Email address"
            />
            <button type="submit">Subscribe</button>
          </div>
        </form>
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
