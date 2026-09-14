import Wordmark from "@/components/wordmark";
import { GoodNewsForm } from "@/components/modules/good-news";

// The record's last line: the page's own sections in one column, Norrsken in
// the next, the Good News signup on the right half - then the norrsken100
// mark across the whole width as the last thing on the page. Set on the page's
// twelve tracks, at 13px.
const SECTIONS = [
  { href: "#manifest", label: "Manifest" },
  { href: "#archive", label: "Archive" },
  { href: "#latest", label: "Latest" },
  { href: "#goodnews", label: "Good News" },
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

        <div className="mod-footer-signup">
          <p className="mod-footer-signup-head">WANT MORE GOOD NEWS?</p>
          <GoodNewsForm className="mod-goodnews-form--footer" />
        </div>
      </div>

      {/* the mark comes down to the foot of the page, whole, across the
          width - the same mark the masthead parks above the list */}
      <div className="mod-footer-mark">
        <Wordmark label="100" className="mod-footer-mark-svg" />
      </div>
    </footer>
  );
}
