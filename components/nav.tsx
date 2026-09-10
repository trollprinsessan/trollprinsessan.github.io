"use client";

/* THE RUNNING HEAD
   Four things on the page's own twelve tracks - the mark on track 1, the
   three sections on 9, 10 and 11 - and nothing else. The mark is set, not
   drawn: the wordmark's letterforms belong to the masthead below, and up
   here the name is a word like the other three. No caps, no grey, no rules.
   The contents dropdown the old bar carried is gone; with three sections
   there is nothing to hide behind a word. */
const SECTIONS = [
  { href: "#archive", label: "The List" },
  { href: "#partners", label: "Partners" },
  { href: "#faq", label: "FAQ" },
];

export default function Nav() {
  const go = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    const el = document.getElementById(href.slice(1));
    if (!el) return;
    /* clear of the bar itself, which stays on the head of the page */
    const bar = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue("--nav-h"),
      10
    );
    window.scrollTo({ top: el.offsetTop - (bar || 0), behavior: "smooth" });
    history.replaceState(null, "", href);
  };

  return (
    <header className="site-nav">
      <a
        className="site-nav-mark"
        href="#top"
        onClick={(e) => {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      >
        norrsken100
      </a>
      {SECTIONS.map((s, i) => (
        <a
          key={s.href}
          className={`site-nav-link site-nav-link--${i + 1}`}
          href={s.href}
          onClick={(e) => go(e, s.href)}
        >
          {s.label}
        </a>
      ))}
    </header>
  );
}
