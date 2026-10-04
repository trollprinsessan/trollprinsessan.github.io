import Wordmark from "@/components/wordmark";
import { GoodNewsForm } from "@/components/modules/good-news";

// NORRSKEN.ORG'S OWN FOOTER, word for word: its four columns of links (only
// the second has a heading, "Media", set in the grey), the Good News signup
// with its own intro line, and the copyright with the privacy policy. Taken
// off the live site's markup, which is the same on every page there. The
// norrsken100 mark stays the last thing on the page.
type FooterLink = { href: string; label: string };
const COLUMNS: { title?: string; links: FooterLink[] }[] = [
  {
    links: [
      { href: "https://norrskenhouse.officernd.com/", label: "Members Portal" },
      { href: "https://www.norrsken.org/press", label: "Press" },
      { href: "https://www.norrsken.org/event-policy", label: "Event Policy" },
      { href: "https://www.norrsken.org/sitemap", label: "Sitemap" },
    ],
  },
  {
    title: "Media",
    links: [
      { href: "https://www.norrsken.org/goodnews", label: "Good News" },
      { href: "https://www.instagram.com/norrskenfoundation/?hl=sv", label: "Instagram" },
      { href: "https://www.linkedin.com/company/norrsken-foundation/", label: "LinkedIn" },
      { href: "https://www.youtube.com/@norrskenfoundation", label: "Youtube" },
      { href: "https://twitter.com/norrsken_org", label: "X" },
    ],
  },
  {
    links: [
      { href: "https://www.norrsken.org/", label: "Home" },
      { href: "https://norrsken.org/#houses", label: "Houses" },
      { href: "https://norrsken.org/#investments", label: "Investments" },
      { href: "https://www.norrsken.org/events", label: "Events" },
      { href: "https://www.norrsken.org/initiatives", label: "Initiatives" },
    ],
  },
  {
    links: [
      { href: "https://www.norrsken.org/about", label: "About" },
      { href: "https://www.norrsken.org/partners", label: "Partners" },
      { href: "https://jobs.norrsken.org/jobs", label: "Careers" },
      { href: "https://www.norrsken.org/about#contact", label: "Contact" },
      { href: "https://www.norrsken.org/about#FAQ", label: "FAQ" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mod-footer">
      <div className="mod-footer-row">
        {COLUMNS.map((col, i) => (
          <nav
            key={i}
            className="mod-footer-links"
            aria-label={col.title ?? "Norrsken"}
          >
            {col.title && <span className="mod-footer-links-title">{col.title}</span>}
            {col.links.map((l) => (
              <a key={l.label} href={l.href} target="_blank" rel="noreferrer">
                {l.label}
              </a>
            ))}
          </nav>
        ))}

        <div className="mod-footer-signup">
          <p className="mod-footer-signup-head">
            Join over 75,000 other changemakers and subscribe to good news from Norrsken
          </p>
          <GoodNewsForm
            className="mod-goodnews-form--footer"
            placeholder="Enter your e-mail"
          />
        </div>

        <p className="mod-footer-legal">
          <span>Copyright © {new Date().getFullYear()} Norrsken Foundation</span>
          <a href="https://www.norrsken.org/privacy-policy" target="_blank" rel="noreferrer">
            Privacy Policy
          </a>
        </p>
      </div>

      {/* the mark comes down to the foot of the page, whole, across the
          width - the same mark the masthead parks above the list */}
      <div className="mod-footer-mark">
        <Wordmark label="100" className="mod-footer-mark-svg" />
      </div>
    </footer>
  );
}
