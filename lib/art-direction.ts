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
  "/n100/agteria.webp",
  "/n100/ai-bob.webp",
  "/n100/aibob.webp",
  "/n100/amatera.webp",
  "/n100/assetcool.webp",
  "/n100/biocre.webp",
  "/n100/biographica.webp",
  "/n100/biorce.webp",
  "/n100/biosorra.webp",
  "/n100/cradle.webp",
  "/n100/endolith.webp",
  "/n100/enerin.webp",
  "/n100/farmless.webp",
  "/n100/floodbase.webp",
  "/n100/icharm.webp",
  "/n100/isometric.webp",
  "/n100/jua.webp",
  "/n100/junaai.webp",
  "/n100/mantle8.webp",
  "/n100/metafuels.webp",
  "/n100/mittilabs-1.webp",
  "/n100/mittilabs.webp",
  "/n100/mittilabs2.webp",
  "/n100/oneka-waves.gif",
  "/n100/overstory.webp",
  "/n100/proximafusion.webp",
  "/n100/pulsetrain.webp",
  "/n100/source-ag.webp",
  "/n100/strongbyform.webp",
  "/n100/syre.webp",
  "/n100/turn2x.webp",
  "/n100/variantbio.webp",
  "/n100/vindai.webp",
]

/* the ones whose filename names a company in the data. Everything else is
   dealt a picture from the pool below - most of these are the 2026 cohort,
   which is not in backstage yet. */
export const ART_DIRECTION: Record<string, string> = {
  "biorce": "/n100/biorce.webp",
  "cradle": "/n100/cradle.webp",
  "juna-ai": "/n100/junaai.webp",
  "overstory": "/n100/overstory.webp",
  "proxima-fusion": "/n100/proximafusion.webp",
  "syre": "/n100/syre.webp",
  "syre-8a4db": "/n100/syre.webp",
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
  "/n100/assetcool.webp",
  "/n100/enerin.webp",
  "/n100/junaai.webp",
  "/n100/mantle8.webp",
  "/n100/metafuels.webp",
  "/n100/proximafusion.webp",
  "/n100/pulsetrain.webp",
  "/n100/turn2x.webp",
  "/n100/vindai.webp",
]);

export function isPhoto(src: string | undefined) {
  return !!src && PHOTOS.has(src);
}
