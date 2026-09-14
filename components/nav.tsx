"use client";

import Wordmark from "@/components/wordmark";

/* THE RUNNING HEAD
   The mark alone, centred, small - no sections beside it and no band behind
   it. The page's contents are the page: the list, the partners and the
   questions are all one scroll away, and a bar naming them was carrying
   weight the scroll already carries. */
export default function Nav() {
  return (
    <header className="site-nav">
      <a
        className="site-nav-mark"
        href="#top"
        aria-label="norrsken100"
        onClick={(e) => {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      >
        <Wordmark className="site-nav-mark-svg" />
      </a>
    </header>
  );
}
