import type { Company } from "@/lib/types";

/* TEMPORARY, for looking at this year's art direction only.
   Every picture on the site comes out of "Norrsken100 Images copy" - nothing
   draws the stock photography that ships with the records. The files are
   1600px webp at q85, alpha intact: the set was 73MB of png, and an earlier
   pass that quantised them to 256 colours at 800px made the photographic
   cutouts band and soften. Delete this file and the visualFor() calls to go
   back to the real photography. */

/* the pool, as the folder holds it */
export const PLAY_IMAGES = [
  "/n100/011h.webp",
  "/n100/44-01.webp",
  "/n100/ai-bob.webp",
  "/n100/agteria.webp",
  "/n100/airforestry.webp",
  "/n100/amatera.webp",
  "/n100/ataraxis-ai.webp",
  "/n100/avelios-medical.webp",
  "/n100/axle-energy-2.webp",
  "/n100/biographica.webp",
  "/n100/biorce.webp",
  "/n100/biosorra.webp",
  "/n100/blykalla.webp",
  "/n100/cemvision.webp",
  "/n100/cemvision2.webp",
  "/n100/cradle.webp",
  "/n100/decade.webp",
  "/n100/delfos.webp",
  "/n100/dioxycle.webp",
  "/n100/endolith.webp",
  "/n100/enline.webp",
  "/n100/epoch-biodesign.webp",
  "/n100/exergy3.webp",
  "/n100/farmless.webp",
  "/n100/fleetzero.webp",
  "/n100/flok-health.webp",
  "/n100/floodbase.webp",
  "/n100/flox-intelligence.webp",
  "/n100/foundindustries.webp",
  "/n100/galvany.webp",
  "/n100/genomines2.webp",
  "/n100/gigmile.webp",
  "/n100/gridware.webp",
  "/n100/hades-mining.webp",
  "/n100/heliosinnovation.webp",
  "/n100/icharm.webp",
  "/n100/ionate.webp",
  "/n100/jua.webp",
  "/n100/mazama.webp",
  "/n100/metafuels.webp",
  "/n100/mialgae.webp",
  "/n100/mitti-labs.webp",
  "/n100/mittilabs-1.webp",
  "/n100/mittilabs.webp",
  "/n100/netzeronitrogen.webp",
  "/n100/octarine.webp",
  "/n100/oneka-waves.gif",
  /* the animated plates, from impact-gif-v2: laid on the cutouts'
     3:2 canvas so they draw at the same size as everything else */
  "/n100/arcride.gif",
  "/n100/bound4blue.gif",
  "/n100/cler.gif",
  "/n100/dioxycle-stack.gif",
  "/n100/intramotev.gif",
  "/n100/koolboks.gif",
  "/n100/missionzero.gif",
  "/n100/oneka-buoy.gif",
  "/n100/planetary.gif",
  "/n100/tandempv.gif",
  "/n100/overstory.webp",
  "/n100/predium.webp",
  "/n100/proximafusion.webp",
  "/n100/pulsetrain.webp",
  "/n100/r3-robotics.webp",
  "/n100/rift.webp",
  "/n100/recupere-metals.webp",
  "/n100/renasens.webp",
  "/n100/robeaute.webp",
  "/n100/savor.webp",
  "/n100/shellworks.webp",
  "/n100/source-ag.webp",
  "/n100/stillbright.webp",
  "/n100/strongbyform.webp",
  "/n100/sway.webp",
  "/n100/syre.webp",
  "/n100/trawa.webp",
  "/n100/vibrant-planet.webp",
  "/n100/vindai.webp",
  "/n100/voize.webp",
  "/n100/assetcool.webp",
  "/n100/enerin.webp",
  "/n100/entrixenergy.webp",
  "/n100/evroc.webp",
  "/n100/herthametals.webp",
  "/n100/isometric.webp",
  "/n100/junaai.webp",
  "/n100/mantle8.webp",
  "/n100/plantedsolar.webp",
  "/n100/turn2x.webp",
  "/n100/variantbio.webp",
]

/* the ones whose filename names a company in the data - 25 of the 78.
   Everything else is dealt a picture from the pool below; most of the rest
   are the 2026 cohort, which is not in backstage yet. */
export const ART_DIRECTION: Record<string, string> = {
  "011h": "/n100/011h.webp",
  "airforestry": "/n100/airforestry.webp",
  "ataraxis": "/n100/ataraxis-ai.webp",
  "avelios": "/n100/avelios-medical.webp",
  "biorce": "/n100/biorce.webp",
  "blykalla": "/n100/blykalla.webp",
  "cemvision": "/n100/cemvision.webp",
  "cradle": "/n100/cradle.webp",
  "decade": "/n100/decade.webp",
  "dioxycle-7ce20": "/n100/dioxycle.webp",
  "evroc": "/n100/evroc.webp",
  "fleetzero": "/n100/fleetzero.webp",
  "genomines": "/n100/genomines2.webp",
  "gigmile": "/n100/gigmile.webp",
  "gridware": "/n100/gridware.webp",
  "juna-ai": "/n100/junaai.webp",
  "overstory": "/n100/overstory.webp",
  "predium": "/n100/predium.webp",
  "proxima-fusion": "/n100/proximafusion.webp",
  "robeaute": "/n100/robeaute.webp",
  "savor": "/n100/savor.webp",
  "syre": "/n100/syre.webp",
  "syre-8a4db": "/n100/syre.webp",
  "trawa": "/n100/trawa.webp",
  "variant-bio": "/n100/variantbio.webp",
  "vind-ai": "/n100/vindai.webp",
};

/* fnv-1a, then avalanche - the same hash the plate slots use, so a company
   keeps its picture between visits and two neighbours rarely share one */
function pick(slug: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  h ^= h >>> 15;
  h = Math.imul(h, 0x2545f491) >>> 0;
  h = (h ^ (h >>> 13)) >>> 0;
  return PLAY_IMAGES[h % PLAY_IMAGES.length];
}

export function visualFor(c: Company) {
  return ART_DIRECTION[c.slug] ?? pick(c.slug);
}

/* the full-frame photographs in the pool - not the cutouts, the line drawings
   or the gif. These come in at 5:4, 4:3 and 3:2 and are all shown at 4:3 in
   the grid, cropped in CSS, so the photos sit at one proportion and at about
   the mass of the objects beside them. */
export const PHOTOS = new Set([
  "/n100/44-01.webp",
  "/n100/axle-energy-2.webp",
  "/n100/blykalla.webp",
  "/n100/decade.webp",
  "/n100/delfos.webp",
  "/n100/enline.webp",
  "/n100/exergy3.webp",
  "/n100/galvany.webp",
  "/n100/gigmile.webp",
  "/n100/ionate.webp",
  "/n100/mazama.webp",
  "/n100/metafuels.webp",
  "/n100/mittilabs.webp",
  "/n100/octarine.webp",
  "/n100/proximafusion.webp",
  "/n100/pulsetrain.webp",
  "/n100/rift.webp",
  "/n100/recupere-metals.webp",
  "/n100/trawa.webp",
  "/n100/vindai.webp",
  "/n100/assetcool.webp",
  "/n100/enerin.webp",
  "/n100/entrixenergy.webp",
  "/n100/evroc.webp",
  "/n100/junaai.webp",
  "/n100/mantle8.webp",
  "/n100/turn2x.webp",
  "/n100/variantbio.webp",
]);

export function isPhoto(src: string | undefined) {
  return !!src && PHOTOS.has(src);
}

/* The line-drawn plates. Classified off the files themselves this time:
   every plotter drawing in the folder is a 4800x4800 png with alpha, every
   photograph is flat RGB, and everything else with alpha is a cutout. */
const LINE_ART = new Set([
  "/n100/ai-bob.webp",
  "/n100/ataraxis-ai.webp",
  "/n100/biographica.webp",
  "/n100/biorce.webp",
  "/n100/cradle.webp",
  "/n100/epoch-biodesign.webp",
  "/n100/flok-health.webp",
  "/n100/floodbase.webp",
  "/n100/flox-intelligence.webp",
  "/n100/gridware.webp",
  "/n100/jua.webp",
  "/n100/mitti-labs.webp",
  "/n100/overstory.webp",
  "/n100/r3-robotics.webp",
  "/n100/source-ag.webp",
  "/n100/vibrant-planet.webp",
  "/n100/voize.webp",
]);

/* the clipart plates and the gifs: what the manifest's wheel draws from.
   Not the full-frame photographs and not the line drawings - those stay in
   the grid, but the draw is the cutouts for now. */
export function isClipart(src: string | undefined) {
  return !!src && !PHOTOS.has(src) && !LINE_ART.has(src);
}

export function isPhotographic(src: string) {
  return !LINE_ART.has(src) && !src.endsWith(".gif");
}

/* the photographs and cutouts alone - the ones that are neither drawn nor moving */
export const PHOTO_POOL = PLAY_IMAGES.filter(isPhotographic);

/* 320px copies of the same files, for the places that draw them small - the
   loader's field and the contact sheet. The full plates are 1600px, and
   eighty-odd of those is five megabytes before the page has painted. */
export function thumb(src: string) {
  /* the gif has no small copy - it is small already, and a gif thumb would
     be the gif again */
  if (src.endsWith(".gif")) return src;
  return src.replace("/n100/", "/n100/thumb/");
}
export const PHOTO_THUMBS = PHOTO_POOL.map(thumb);

/* the same hash as pick(), against the photographic pool only: a company
   keeps its picture, and the contact sheet never draws a line plate */
export function photoFor(slug: string) {
  const named = ART_DIRECTION[slug];
  if (named && isPhotographic(named)) return named;
  let h = 0x811c9dc5;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  h ^= h >>> 15;
  h = Math.imul(h, 0x2545f491) >>> 0;
  h = (h ^ (h >>> 13)) >>> 0;
  return PHOTO_POOL[h % PHOTO_POOL.length];
}

/* THE ELECTRO UNION, provisionally.
   The panel's copy names 27 builders, but no cohort field exists in the data
   yet - these are picked from it by the only signal there is: European, and
   in the sectors the copy names (the grid, storage, generation, electrified
   industry and transport, and the materials it runs on), alphabetical.
   Replace with the real list the moment it is in backstage. */
export const ELECTRO_UNION = [
  "1komma5",
  "alight",
  "beyond-aero",
  "bloom-biorenewables",
  "blykalla",
  "cuspai",
  "desolenator",
  "einride",
  "electricity-maps",
  "elonroad",
  "elyos-energy",
  "enter",
  "genomines",
  "granular-energy",
  "h2site",
  "heart-aerospace",
  "hived",
  "instagrid",
  "kitekraft",
  "kraftblock",
  "magnotherm",
  "metris-energy",
  "newcleo",
  "nitrovolt",
  "northvolt",
  "piclo",
  "pionix",
];

/* THE COHORTS.
   Three kinds of thing end up under a company's name, and they are not the
   same kind of thing:

     the sector and the place   a RECORD - every one of the 352 has them,
                                they are facts, and they need no styling
     a cohort                   a CLAIM - the edition saying this company
                                belongs to a group it has drawn

   So the record is set plainly and the cohort is the only thing on a card
   that is marked. It is marked with the slot fill the dock uses - the page's
   one tone - so a filled tag means the same thing everywhere on the site:
   something the edition groups you by, rather than something true about you.

   `themes` in companies.json is empty on every record, so these come from
   here until the cohorts are in backstage. */
export const PROMPT_WHAT_MATTERS: string[] = [
  /* the 17 are not picked yet - drop their slugs in and they carry the tag */
];

export function cohortsFor(slug: string) {
  const out: string[] = [];
  if (ELECTRO_UNION.includes(slug)) out.push("Electro Union");
  if (PROMPT_WHAT_MATTERS.includes(slug)) out.push("Prompt What Matters");
  return out;
}
