"use client";

import "./category.css";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useToggle } from "@/components/settings/registry";
import { ELECTRO_UNION, PROMPT_WHAT_MATTERS, cohortsFor } from "@/lib/art-direction";
import { CampaignLogo, NO_CAMPAIGN } from "@/components/variants/badge/badge";

/* THE CATEGORIES: the photobook's three chapters - Electro Union,
   Prompt What Matters and the rest - as the list can be read by them. Here
   their lines (the chapter intros' last lines, the third chapter's title),
   the third chapter's sticker, and the category view's chrome: a rolling
   banner under the mark and the category's logo stuck on the mark's 100.
   Both follow the current category - the one the filter picks, or in the
   category view the chapter scrolled to - and each has its switch in
   Show/hide. */

type CatKey = "eu" | "pwm" | "more";
const MORE = 100 - ELECTRO_UNION.length - PROMPT_WHAT_MATTERS.length;
const CATS: Record<CatKey, { theme: string; line: string }> = {
  eu: {
    theme: "Electro Union",
    line: `In here you'll find the ${ELECTRO_UNION.length} builders, making Europe the Electro Union.`,
  },
  pwm: {
    theme: "Prompt What Matters",
    line: "The world does not need another sales agent. It needs bigger prompts.",
  },
  more: { theme: NO_CAMPAIGN, line: `${MORE} more ways to fix the future.` },
};
const catOfTheme = (t: string): CatKey | null =>
  (Object.keys(CATS) as CatKey[]).find((k) => CATS[k].theme === t) ?? null;

/* THE THIRD CHAPTER'S STICKER: it has no logo of its own, so it gets one -
   its number, big, on a round yellow sticker, a little askew */
export function MoreSticker({ size = "l" }: { size?: "l" | "s" }) {
  return (
    <span className={`nkmore nkmore--${size}`} role="img" aria-label={`${MORE} more ways to fix the future`}>
      <b>{MORE}</b>
      <span>more ways to fix the future</span>
    </span>
  );
}

/* the category a company belongs to */
const catOfSlug = (slug: string): CatKey => {
  const cs = cohortsFor(slug);
  return cs.includes("Electro Union") ? "eu" : cs.includes("Prompt What Matters") ? "pwm" : "more";
};

export default function CategoryChrome({
  theme,
  cat,
  open,
  index = false,
  hosted = false,
}: {
  theme: Set<string>;
  /* the index view is up: the Electro Union ground shows behind its rows,
     not behind the grid's cards */
  index?: boolean;
  /* the open company's slug, null when none is open; undefined while the
     shuffle is running, when the ground holds as it is */
  open?: string | null;
  /* the category view is up */
  cat: boolean;
  /* in page-v2's drawer: the banner heads the drawer, under its row */
  hosted?: boolean;
}) {
  const [onList, setOnList] = useState(false);
  useEffect(() => {
    const check = () => {
      const a = document.getElementById("archive")?.getBoundingClientRect();
      /* the list is up as soon as the mark has left the window's foot: the
         whole time on the list, not only once the mark has stuck */
      const m = document.querySelector(".archive-masthead")?.getBoundingClientRect();
      setOnList(!!a && !!m && m.bottom < window.innerHeight - 2 && a.bottom > m.bottom + 40);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);
  /* whether the list is on screen: the ground shows only while it is */
  const [atList, setAtList] = useState(false);
  useEffect(() => {
    const check = () => {
      const a = document.getElementById("archive")?.getBoundingClientRect();
      setAtList(!!a && a.top < window.innerHeight * 0.6 && a.bottom > window.innerHeight * 0.4);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);
  const fromFilter = theme.size === 1 ? catOfTheme([...theme][0]) : null;
  const [scrolled, setScrolled] = useState<CatKey | null>(null);
  const [mast, setMast] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMast(document.querySelector<HTMLElement>(".archive-masthead"));
  }, []);

  /* the banner's height, for a bar that stands under it (dockstyle-v2, -v3) */
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--nk-banner-h", "0px");
    return;
  }, []);

  /* the chapter whose stretch is under the mark's foot */
  useEffect(() => {
    if (!cat) {
      setScrolled(null);
      return;
    }
    const check = () => {
      const foot = document.querySelector(".archive-masthead")?.getBoundingClientRect().bottom ?? 0;
      const line = Math.max(foot, 0) + 80;
      let k: CatKey | null = null;
      document.querySelectorAll<HTMLElement>(".chap[data-cat]").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top <= line && r.bottom > line) k = el.dataset.cat as CatKey;
      });
      setScrolled(k);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    const t = setInterval(check, 400);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
      clearInterval(t);
    };
  }, [cat]);
  const wish: CatKey | null = open ? catOfSlug(open) : fromFilter;
  useEffect(() => {
    if (open === undefined) return;
    const root = document.documentElement;
    const value = wish === "pwm" || wish === "eu" ? wish : open ? "plain" : "";
    if (value) root.dataset.nkListGround = value;
    else delete root.dataset.nkListGround;
    window.dispatchEvent(new Event("nk:ground"));
  }, [wish, open]);
  /* gone with the list */
  useEffect(
    () => () => {
      delete document.documentElement.dataset.nkListGround;
      window.dispatchEvent(new Event("nk:ground"));
    },
    []
  );
  const euUp = index && open !== undefined && wish === "eu" && atList;
  const found = fromFilter ?? scrolled;
  const current = (found === "more") ? null : found;
  const lines = current ? [CATS[current].line] : (Object.keys(CATS) as CatKey[]).filter((k) => k !== "more").map((k) => CATS[k].line);

  return (
    <>

      {/* the top dock's room, under the banner (shown by dock-bar.css) */}
      {!hosted && <div className="nk-dockroom" aria-hidden="true" />}
      {/* THE CATEGORY'S GROUND: its logo, faint, behind the whole list, held
          in the middle of the window - not of the list, so it stays put
          when a company opens beside it */}
      {euUp && (
        <div className="nkbg nkbg--eu nkbg--strong" aria-hidden="true">
          <CampaignLogo k="eu" />
        </div>
      )}

    </>
  );
}
