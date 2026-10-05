/* THE PAGE'S SETTINGS, in one place.

   Each part of the page is built in a numbered layout, and a handful of
   details are switches. What the page ships with is fixed here: components
   read it through useVersion and useToggle (registry.ts), and the stylesheets
   through the attributes rootAttributes() writes on <html> -
   html[data-v-<part>="v2"] for a layout, html[data-t-<switch>="on"] for a
   switch. Only the layouts named here have styles in the stylesheets. */

/* the layout of each part */
export const LAYOUTS: Record<string, string> = {
  page: "v5",
  listview: "v4",
  badge: "v1",
  cardstyle: "v10",
  linestyle: "v1",
  tagstyle: "v1",
  sideview: "v13",
  modal: "v8",
  latest: "v2",
  hero: "v3",
  dockstyle: "v7",
  dockplace: "v1",
  markmode: "v6",
  mlayout: "v11",
  tabsign: "v2",
  faq: "v3",
  menustyle: "v2",
  manifest: "v2",
};

/* the switches */
export const SWITCHES: Record<string, boolean> = {
  tagstyle: true,
  cardlines: true,
  cardlogos: false,
  sticker: false,
  banner: false,
  countrytag: true,
  nameroom: true,
  sideviewphone: true,
  flyin: true,
  copy2col: false,
  partnersinplate: true,
  partnersplain: true,
  shakegrid: false,
  more56: false,
  copylink: true,
  gridcut: false,
  rowcut: false,
  bannerlevel: false,
  nomenu: true,
  nofooter: true,
  eubg: true,
  listhead: false,
  categorybg: false,
  fixedwidth: false,
  noarrows: true,
  namezone: true,
  campaignline: true,
  closetop: true,
  freshstart: true,
  groundfade: true,
  rosaslut: true,
  softsnap: true,
  boldmanifest: false,
  boldfaq: true,
  phoneplate: true,
  tabshuffle: true,
  faqroomphone: true,
};

/* the card line's thickness, in px */
export const LINE_WIDTH = "2";

/* the settings as attributes for <html>, there from the first paint */
export function rootAttributes(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [id, v] of Object.entries(LAYOUTS)) out[`data-v-${id}`] = v;
  for (const [id, on] of Object.entries(SWITCHES)) out[`data-t-${id}`] = on ? "on" : "off";
  return out;
}
