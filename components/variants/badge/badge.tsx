"use client";

import "./badge.css";
import { useVersion } from "@/components/settings/registry";
import { cohortsFor } from "@/lib/art-direction";

/* THE CAMPAIGN BADGE: a mark for each of the edition's two campaigns that
   reads at a tag's size and at a heading's, and is clear at both. Versions,
   set in settings/versions.ts:

     v1  the original: the campaign in words, as the original cards and rows
         set it
     v2  the oval - the ellipse the Electro Union logo's red arcs draw: the
         letters in it when small, the name in it at medium, the logos large
     v3  the plate - the dock's filled slot: EU white on the logo's blue over
         a red rule, PWM on the logo's pink in its typewriter letters
     v4  the sign - the logo's star for Electro Union, the prompt's cursor
         for Prompt What Matters, blinking; the name beside it from medium up
     v5  the seal - the name round a ring, the sign in the middle, large; at
         a tag's size only the disc and the sign, since no ring of words can
         be read there, and the name beside it from medium up
     v6  the logos themselves: Electro Union's stars and arcs, Prompt What
         Matters' pink strip between its rows of :^...; cut down to what
         reads when small

   The colours are the two logos': Electro Union the blue
   #003794 and the red #D02E39 of its stars and arcs, Prompt What Matters
   the pink #FFB2E9 of its strip and its typewriter ink. Only Prompt What
   Matters is pink.

   s = a tag's size (cards, rows), m = a line's (caption, key), l = a head's. */

type Size = "s" | "m" | "l";
type Key = "eu" | "pwm";

const KEYS: Record<string, Key> = { "Electro Union": "eu", "Prompt What Matters": "pwm" };
/* the strip's rows, longer than any strip: cut at both ends, as the logo is */
const ROW = ":^...".repeat(16) + ":^.";

/* THE LOGOS. Electro Union as the manifest's file; Prompt What Matters set in
   type - the pink strip, the name in the typewriter face between two rows
   of :^... cut at the strip's ends - so it is sharp at any size */
function EuLogo() {
  // eslint-disable-next-line @next/next/no-img-element
  /* the manifest's own drawing, with the ring and the two lines of small
     caps taken off it: behind the list only the script is wanted, and at
     that size "MAKE EUROPE" round the ring was noise */
  return <img className="nkb-eulogo" src={"/badges/electro-union-wordmark.svg"} alt="" />;
}
function PwmLogo() {
  return (
    <span className="nkb-pwmlogo" aria-hidden="true">
      <span className="nkb-pwmrow">{ROW}</span>
      <span className="nkb-pwmname">PROMPT WHAT MATTERS</span>
      <span className="nkb-pwmrow">{ROW}</span>
    </span>
  );
}
const Logo = ({ k }: { k: Key }) => (k === "eu" ? <EuLogo /> : <PwmLogo />);
/* a campaign's logo by its key, for the category view's sticker */
export const CampaignLogo = Logo;

export function Badge({ name, size = "s" }: { name: string; size?: Size }) {
  const k = KEYS[name];
  if (!k) return null;
  const cls = `nkb nkb--v1 nkb--${k} nkb--${size}`;

  /* v1: the original, in words */
  return <span className={cls}>{name}</span>;
}

/* THE STAMPS: on the cards of listview-v4 and later, each campaign's logo
   stuck on the picture's head like a stamp, a little askew - Electro Union
   in the right-hand corner, Prompt What Matters in the left - in place of
   the badge in the card's foot. Always the logos, whatever badge version is
   chosen: a stamp is the campaign's own mark. */
export function Stamps({ slug }: { slug: string }) {
  const list = cohortsFor(slug);
  if (!list.length) return null;
  return (
    <>
      {list.map((n) => {
        const k = KEYS[n];
        if (!k) return null;
        return (
          <span key={n} className={`nks nks--${k}`} role="img" aria-label={n} title={n}>
            <Logo k={k} />
          </span>
        );
      })}
    </>
  );
}

/* the campaigns' logos, level, for the compact index's first column */
export function Logos({ slug }: { slug: string }) {
  const list = cohortsFor(slug);
  if (!list.length) return null;
  return (
    <>
      {list.map((n) => {
        const k = KEYS[n];
        return k ? (
          <span key={n} className={`nkl nkl--${k}`} role="img" aria-label={n} title={n}>
            <Logo k={k} />
          </span>
        ) : null;
      })}
    </>
  );
}

/* THE COMPANIES IN NO CAMPAIGN, for page-v5's "more ways": a value of the
   Theme filter that no campaign has, standing for all of them */
export const NO_CAMPAIGN = "No campaign";
export function inCampaigns(slug: string, theme: Set<string>) {
  const tags = cohortsFor(slug);
  return tags.some((x) => theme.has(x)) || (theme.has(NO_CAMPAIGN) && tags.length === 0);
}

/* the campaigns a company is in, as badges */
export function Badges({ slug, size = "s" }: { slug: string; size?: Size }) {
  const list = cohortsFor(slug);
  if (!list.length) return null;
  return (
    <span className={`nkbs nkbs--${size}`}>
      {list.map((n) => (
        <Badge key={n} name={n} size={size} />
      ))}
    </span>
  );
}
