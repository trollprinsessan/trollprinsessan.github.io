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

export type Size = "s" | "m" | "l";
type Key = "eu" | "pwm";

const KEYS: Record<string, Key> = { "Electro Union": "eu", "Prompt What Matters": "pwm" };
const SHORT: Record<Key, string> = { eu: "EU", pwm: "PWM" };
const RING: Record<Key, string> = {
  eu: "ELECTRO UNION • MAKE EUROPE • ",
  pwm: "PROMPT WHAT MATTERS • BIGGER PROMPTS • ",
};

/* a root path, as every picture on the site is; a build served under a base
   path has them rewritten (scripts/snapshot.mjs). A tracing of the logo - to
   be replaced by the campaign's own vector file when it is available */
const EU_LOGO = "/badges/electro-union.svg";
/* the strip's rows, longer than any strip: cut at both ends, as the logo is */
const ROW = ":^...".repeat(16) + ":^.";

/* THE STAR of the logo, and the cursor a prompt waits with */
function Star() {
  return (
    <svg className="nkb-star" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 1.6l3.05 7.1 7.7.66-5.84 5.05 1.75 7.53L12 17.9l-6.66 4.04 1.75-7.53L1.25 9.36l7.7-.66z" />
    </svg>
  );
}
function Cursor() {
  return <span className="nkb-cursor" aria-hidden="true" />;
}
const Sign = ({ k }: { k: Key }) => (k === "eu" ? <Star /> : <Cursor />);

/* THE LOGOS. Electro Union as the traced file; Prompt What Matters set in
   type - the pink strip, the name in the typewriter face between two rows
   of :^... cut at the strip's ends - so it is sharp at any size */
function EuLogo() {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="nkb-eulogo" src={EU_LOGO} alt="" />;
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

/* v5: the ring. The words run once round the circle; the sign sits in it */
function Seal({ k, ring }: { k: Key; ring: boolean }) {
  const id = `nkb-ring-${k}`;
  return (
    <span className="nkb-seal">
      {ring && (
        <svg className="nkb-sealring" viewBox="0 0 100 100" aria-hidden="true">
          <defs>
            <path id={id} d="M50 50 m-38 0 a38 38 0 1 1 76 0 a38 38 0 1 1 -76 0" />
          </defs>
          <circle cx="50" cy="50" r="48.5" className="nkb-sealdisc" />
          <text className="nkb-sealtext">
            <textPath href={`#${id}`} textLength="236">
              {RING[k]}
            </textPath>
          </text>
          <circle cx="50" cy="50" r="26" className="nkb-sealin" />
        </svg>
      )}
      <span className="nkb-sealsign">
        <Sign k={k} />
      </span>
    </span>
  );
}

export function Badge({ name, size = "s" }: { name: string; size?: Size }) {
  const v = useVersion("badge");
  const k = KEYS[name];
  if (!k) return null;
  const cls = `nkb nkb--${v} nkb--${k} nkb--${size}`;

  /* v1: the original, in words */
  if (v === "v1") return <span className={cls}>{name}</span>;

  if (v === "v2") {
    if (size === "l")
      return (
        <span className={cls} role="img" aria-label={name}>
          <Logo k={k} />
        </span>
      );
    return (
      <span className={cls} role="img" aria-label={name} title={name}>
        <span className="nkb-in">{size === "s" ? SHORT[k] : name}</span>
      </span>
    );
  }

  if (v === "v3") {
    return (
      <span className={cls} role="img" aria-label={name} title={name}>
        {size === "l" ? (
          <>
            <span className="nkb-in">{k === "eu" ? "Electro" : "Prompt What"}</span>
            <span className="nkb-in">{k === "eu" ? "Union" : "Matters"}</span>
          </>
        ) : (
          <span className="nkb-in">{size === "s" ? SHORT[k] : name}</span>
        )}
      </span>
    );
  }

  if (v === "v4") {
    return (
      <span className={cls} role="img" aria-label={name} title={name}>
        {k === "eu" && <Sign k={k} />}
        {size !== "s" && <span className="nkb-name">{name}</span>}
        {k === "pwm" && <Sign k={k} />}
      </span>
    );
  }

  if (v === "v5") {
    return (
      <span className={cls} role="img" aria-label={name} title={name}>
        <Seal k={k} ring={size === "l"} />
        {size !== "s" && <span className="nkb-name">{name}</span>}
      </span>
    );
  }

  /* v6: the logos. Whole from medium up; at a tag's size what still reads -
     Electro Union's star and letters over its red arc, Prompt What Matters'
     strip with its letters */
  return (
    <span className={cls} role="img" aria-label={name} title={name}>
      {size === "s" ? (
        k === "eu" ? (
          <span className="nkb-eumini">
            <Star />
            <span className="nkb-in">EU</span>
          </span>
        ) : (
          <span className="nkb-pwmlogo">
            <span className="nkb-pwmname">PWM</span>
          </span>
        )
      ) : (
        <Logo k={k} />
      )}
    </span>
  );
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
