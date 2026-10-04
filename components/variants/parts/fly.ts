/* THE CARD'S PARTS FLY INTO THE MODAL (cardstyle-v3, cardstyle-v3b).
   A press on a card opens the modal as it always opens, and over it each
   part of the card travels on its own from where it stood on the card to
   where the modal sets it: the name letter by letter, starting first; then
   the picture, the one-liner, the sector, the country and the campaign,
   each leaving a little later and so travelling a little faster. While they
   are in flight the modal's copy is written out line by line, and the
   website last. Everything lands at the same moment (RUN), and the modal
   has its full size well before that.

   Nothing in the modal's own markup is changed: the travelling parts are
   copies in a layer over the page, the modal's own parts are held
   transparent until their copies land, and the writing is a set of covers
   drawn back off the lines. */

const RUN = 720;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
/* when the modal has settled, and the writing can start */
const SETTLED = 260;
const LINK = 110;
/* words hand over to the modal's own over the last stretch of the run */
const HANDOVER = RUN * 0.78;

const TEXT_PROPS = [
  "fontFamily",
  "fontSize",
  "fontWeight",
  "fontStyle",
  "lineHeight",
  "letterSpacing",
  "textTransform",
  "color",
] as const;

type Flight = { key: string; from: HTMLElement; to: string; delay: number; kind: "text" | "tag" | "img" | "letters"; hidden?: boolean };

function at(el: HTMLElement, r: DOMRect) {
  Object.assign(el.style, {
    position: "fixed",
    left: `${r.left}px`,
    top: `${r.top}px`,
    width: `${r.width}px`,
    height: `${r.height}px`,
    margin: "0",
    boxSizing: "border-box",
    pointerEvents: "none",
  });
}

function copyText(el: HTMLElement, src: HTMLElement) {
  const cs = getComputedStyle(src);
  for (const k of TEXT_PROPS) el.style[k] = cs[k];
}

/* the box of each character of an element's text, spaces left out */
function charRects(el: HTMLElement) {
  const out: { ch: string; r: DOMRect }[] = [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent ?? "";
    for (let i = 0; i < text.length; i++) {
      if (!text[i].trim()) continue;
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      out.push({ ch: text[i], r: range.getBoundingClientRect() });
    }
  }
  return out;
}

/* the box of each line of an element's text, within what shows of it */
function lineRects(el: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(el);
  const view = el.getBoundingClientRect();
  const lines: { left: number; top: number; right: number; bottom: number }[] = [];
  for (const r of Array.from(range.getClientRects())) {
    if (!r.width || r.bottom <= view.top || r.top >= view.bottom) continue;
    const line = lines.find((l) => Math.abs(l.top - r.top) < r.height / 2);
    if (line) {
      line.left = Math.min(line.left, r.left);
      line.right = Math.max(line.right, r.right);
      line.bottom = Math.max(line.bottom, r.bottom);
    } else lines.push({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });
  }
  return lines.sort((a, b) => a.top - b.top);
}

/* the modal, once it is in the page and laid out */
function whenOpen(done: (entry: HTMLElement | null) => void) {
  const start = performance.now();
  const look = () => {
    const entry = document.querySelector<HTMLElement>(".entry-scrim .entry, .cside, .index-panel .entry");
    if (entry && entry.getBoundingClientRect().width > 0) return done(entry);
    if (performance.now() - start > 1200) return done(null);
    requestAnimationFrame(look);
  };
  requestAnimationFrame(look);
}

/* what may leave: an element, where the modal sets it, when it leaves,
   and how it travels */
export type Part = [key: string, from: HTMLElement | null, to: string, delay: number, kind: Flight["kind"]];

/* a card's parts, in the order they leave */
function cardParts(card: HTMLElement): Part[] {
  const q = (s: string) => card.querySelector<HTMLElement>(s);
  const code = q(".entry2-code");
  return [
    ["name", q(".entry2-nametext"), TO.name, 0, "letters"],
    ["picture", q(".entry2-thumb"), TO.picture, 60, "img"],
    ["gymbs", q(".entry2-gymbs"), TO.gymbs, 120, "text"],
    ["sector", q(".nkt-tag--sector, .nkc-foot-tag--sector"), TO.sector, 170, "tag"],
    ["country", code ?? q(".nkt-tag--geo, .nkc-foot-tag--geo"), TO.country, 210, code ? "text" : "tag"],
    ["campaign", q(".nkt-tag--eu, .nkt-tag--pwm, .nkc-foot-tag--camp"), TO.campaign, 250, "tag"],
  ];
}

/* where each part lands: in the modal, or in the side view */
export const TO = {
  name: ".entry-name, .cside-title",
  picture: ".entry-figure img, .cside-picture img",
  gymbs: ".entry-statement, .cside-gymbs",
  sector: ".entry-record-values > span:nth-of-type(2), .cside-info > span:nth-of-type(2)",
  country: ".entry-record-values > span:nth-of-type(1), .cside-info > span:nth-of-type(1)",
  campaign: ".entry-record-campaign, .entry-record-values > .entry-tags:not(:empty), .entry-plate-caption, .cside-caption",
};

/* an index row's parts: the name, the phone's picture, the one-liner and
   the facts */
export function rowParts(row: HTMLElement): Part[] {
  const q = (s: string) => row.querySelector<HTMLElement>(s);
  return [
    ["name", q(".row-name"), TO.name, 0, "letters"],
    ["picture", row.querySelector<HTMLImageElement>("img.row-thumb"), TO.picture, 60, "img"],
    ["gymbs", q(".row-statement"), TO.gymbs, 120, "text"],
    ["sector", q(".row-sector"), TO.sector, 170, "text"],
    ["country", q(".row-geo"), TO.country, 210, "text"],
    ["campaign", q(".row-campaign"), TO.campaign, 250, "text"],
  ];
}

export function flyFrom(card: HTMLElement, open: () => void, parts?: Part[]) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return open();

  const flights: Flight[] = [];
  for (const [key, from, to, delay, kind] of parts ?? cardParts(card)) {
    if (from && from.getBoundingClientRect().width > 0) flights.push({ key, from, to, delay, kind });
    /* a picture the source does not show (an index row on a desktop):
       it leaves from the row's head, a line high */
    else if (from && kind === "img" && (from as HTMLImageElement).src) flights.push({ key, from, to, delay, kind, hidden: true });
  }

  /* the copies, laid over the card's own parts before anything moves */
  const layer = document.createElement("div");
  layer.className = "nk-fly";
  const made: { f: Flight; clones: { el: HTMLElement; r: DOMRect; padX: number; padY: number }[] }[] = [];
  for (const f of flights) {
    const clones: { el: HTMLElement; r: DOMRect; padX: number; padY: number }[] = [];
    if (f.kind === "letters") {
      for (const { ch, r } of charRects(f.from)) {
        const el = document.createElement("span");
        el.textContent = ch;
        copyText(el, f.from);
        at(el, r);
        el.style.lineHeight = `${r.height}px`;
        el.style.whiteSpace = "pre";
        clones.push({ el, r, padX: 0, padY: 0 });
      }
    } else {
      let r = f.from.getBoundingClientRect();
      if (f.hidden) {
        const row = (f.from.closest(".row") ?? f.from.parentElement ?? f.from).getBoundingClientRect();
        r = new DOMRect(row.left, row.top, row.height * 1.5, row.height);
      }
      const cs = getComputedStyle(f.from);
      const el = f.from.cloneNode(true) as HTMLElement;
      if (f.hidden) el.style.display = "block";
      el.removeAttribute("class");
      at(el, r);
      if (f.kind === "img") {
        el.style.objectFit = cs.objectFit;
        el.style.objectPosition = cs.objectPosition;
      } else {
        copyText(el, f.from);
        /* one line, as the modal sets it, whatever the card wrapped it to */
        el.style.whiteSpace = "nowrap";
        el.style.width = "auto";
        el.style.height = "auto";
        el.style.overflow = "visible";
        el.style.padding = cs.padding;
        if (f.kind === "tag") {
          el.style.background = cs.backgroundColor;
          el.style.borderRadius = cs.borderRadius;
          el.style.boxShadow = cs.boxShadow;
        }
      }
      clones.push({ el, r, padX: parseFloat(cs.paddingLeft) || 0, padY: parseFloat(cs.paddingTop) || 0 });
    }
    for (const c of clones) layer.appendChild(c.el);
    /* the card's own part is gone from the card while its copy travels */
    f.from.animate([{ opacity: 0 }, { opacity: 0 }], { duration: RUN, fill: "none" });
    made.push({ f, clones });
  }
  document.body.appendChild(layer);

  /* in flight from before the view opens, so the view knows not to decode
     the name the letters are bringing */
  const root = document.documentElement;
  root.setAttribute("data-nk-flying", "");
  open();

  whenOpen((entry) => {
    if (!entry) {
      root.removeAttribute("data-nk-flying");
      return layer.remove();
    }

    /* where the modal's parts stand once it has opened: its opening is run
       to its end to measure, then played from the start */
    /* the view's own opening and its frame's (the original panel slides in
       from the right, the sheet rises): run to their end to measure where
       the parts will stand, then played from the start */
    const frames: Element[] = [];
    for (let el: Element | null = entry; el && el !== document.body; el = el.parentElement) frames.push(el);
    const opening = frames.flatMap((el) => el.getAnimations());
    for (const a of opening) {
      a.pause();
      a.currentTime = Number(a.effect?.getComputedTiming().endTime ?? 0);
    }
    const target = (s: string) => {
      const el = entry.querySelector<HTMLElement>(s);
      return el && el.getBoundingClientRect().width > 0 ? el : null;
    };
    const waiting: Element[] = [];
    const hold = (el: Element, ms: number) =>
      el.animate([{ opacity: 0 }, { opacity: 0 }], { duration: ms, fill: "none" });

    for (const { f, clones } of made) {
      const to = target(f.to);
      const run = RUN - f.delay;
      if (!to) {
        for (const c of clones) c.el.animate([{ opacity: 1 }, { opacity: 0 }], { delay: f.delay, duration: run / 2, fill: "both" });
        continue;
      }
      /* the modal's own part shows the moment its copy has landed; words
         come up under their copy as it arrives */
      if (f.kind === "letters" || f.kind === "img") {
        /* on the element itself, and by a mark it carries: the modal's name
           can be drawn anew while the letters are in flight (it decodes),
           and the new element must wait as well */
        hold(to, RUN);
        to.setAttribute("data-nk-awaiting", "");
        waiting.push(to);
      }
      else
        to.animate([{ opacity: 0 }, { opacity: 0, offset: HANDOVER / RUN }, { opacity: 1 }], {
          duration: RUN,
          fill: "none",
        });
      const tr = to.getBoundingClientRect();
      const tcs = getComputedStyle(to);

      if (f.kind === "letters") {
        const ends = charRects(to);
        clones.forEach((c, i) => {
          /* letters the modal's name does not have (a caption's ", SWE")
             fade where they are */
          if (i >= ends.length) {
            c.el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: RUN / 3, fill: "both" });
            return;
          }
          const e = ends[i].r;
          /* the letter takes the modal's own form the moment it lifts - its
             case, face, weight and size - drawn at the card's letter's
             height, so it only moves and grows on the way and lands as the
             letter it becomes, with nothing to swap */
          c.el.textContent = ends[i].ch;
          copyText(c.el, to);
          c.el.style.textTransform = "none";
          c.el.style.width = `${e.width}px`;
          c.el.style.height = `${e.height}px`;
          c.el.style.lineHeight = `${e.height}px`;
          const k = c.r.height / e.height;
          /* each letter a touch after the one before it */
          const delay = Math.min(i * 14, 200);
          c.el.style.transformOrigin = "0 0";
          c.el.animate(
            [
              { transform: `translate(0, 0) scale(${k})` },
              { transform: `translate(${e.left - c.r.left}px, ${e.top - c.r.top}px) scale(1)` },
            ],
            { delay, duration: RUN - delay, easing: EASE, fill: "both" }
          );
        });
        continue;
      }

      const c = clones[0];
      if (f.kind === "img") {
        /* it lands on the picture as the modal draws it - the whole image,
           fitted into its box - so a card's crop opens on the way */
        const src = f.from as HTMLImageElement;
        let box = { left: tr.left, top: tr.top, width: tr.width, height: tr.height };
        if (src.naturalWidth && src.naturalHeight && tcs.objectFit === "contain") {
          const k = Math.min(tr.width / src.naturalWidth, tr.height / src.naturalHeight);
          const [px, py] = tcs.objectPosition.split(" ").map((v) => (v.endsWith("%") ? parseFloat(v) / 100 : 0.5));
          const width = src.naturalWidth * k;
          const height = src.naturalHeight * k;
          box = { left: tr.left + (tr.width - width) * px, top: tr.top + (tr.height - height) * py, width, height };
        }
        c.el.animate(
          [
            { left: `${c.r.left}px`, top: `${c.r.top}px`, width: `${c.r.width}px`, height: `${c.r.height}px` },
            { left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px` },
          ],
          { delay: f.delay, duration: run, easing: EASE, fill: "both" }
        );
        continue;
      }
      /* words: the first letter of the copy to the first letter of the
         modal's, growing or shrinking to its size; a tag sheds its plate on
         the way */
      const size = parseFloat(tcs.fontSize) / (parseFloat(c.el.style.fontSize) || 1);
      /* the space a line keeps over its letters, so the letters meet and not
         the boxes */
      const lead = (fontSize: string, lineHeight: string) => {
        const fs = parseFloat(fontSize) || 0;
        return ((parseFloat(lineHeight) || fs * 1.2) - fs) / 2;
      };
      const dx = tr.left + (parseFloat(tcs.paddingLeft) || 0) - c.r.left - c.padX * size;
      const dy =
        tr.top +
        (parseFloat(tcs.paddingTop) || 0) +
        lead(tcs.fontSize, tcs.lineHeight) -
        c.r.top -
        (c.padY + lead(c.el.style.fontSize, c.el.style.lineHeight)) * size;
      c.el.style.transformOrigin = "0 0";
      const from: Keyframe = { transform: "translate(0, 0) scale(1)", color: c.el.style.color };
      const land: Keyframe = { transform: `translate(${dx}px, ${dy}px) scale(${size})`, color: tcs.color };
      c.el.animate([{ opacity: 1 }, { opacity: 1, offset: Math.max(0, (HANDOVER - f.delay) / run) }, { opacity: 0 }], {
        delay: f.delay,
        duration: run,
        fill: "both",
      });
      if (f.kind === "tag") {
        from.backgroundColor = c.el.style.backgroundColor;
        from.boxShadow = c.el.style.boxShadow;
        land.backgroundColor = "rgba(0, 0, 0, 0)";
        land.boxShadow = "inset 0 0 0 1px rgba(0, 0, 0, 0)";
      }
      c.el.animate([from, land], { delay: f.delay, duration: run, easing: EASE, fill: "both" });
    }

    /* THE WRITING: the record's remaining line and the copy from the moment
       the modal has settled, line by line; the website last */
    /* the view's ground: its own, or the first painted one behind it */
    let ground = "rgb(255, 255, 255)";
    for (let el: Element | null = entry; el; el = el.parentElement) {
      const bg = getComputedStyle(el).backgroundColor;
      if (bg && bg !== "transparent" && !/rgba\(.*,\s*0\)$/.test(bg)) {
        ground = bg;
        break;
      }
    }
    const cover = (el: HTMLElement | null, start: number, span: number) => {
      if (!el) return;
      hold(el, start);
      const lines = lineRects(el);
      lines.forEach((l, k) => {
        const c = document.createElement("div");
        Object.assign(c.style, {
          position: "fixed",
          left: `${l.left - 1}px`,
          top: `${l.top - 1}px`,
          width: `${l.right - l.left + 2}px`,
          height: `${l.bottom - l.top + 2}px`,
          background: ground,
          transformOrigin: "100% 50%",
          pointerEvents: "none",
        });
        layer.appendChild(c);
        /* no cover before there is anything under it to cover */
        if (start > 0) hold(c, start);
        c.animate([{ transform: "scaleX(1)" }, { transform: "scaleX(0)" }], {
          delay: start + (span * k) / lines.length,
          duration: span / lines.length,
          easing: "linear",
          fill: "both",
        });
      });
    };
    const writeEnd = RUN - LINK;
    const meta = target(".entry-record-values > span:nth-of-type(3):not(.entry-record-campaign):not(.entry-tags), .cside-info > span:nth-of-type(3)");
    cover(meta, SETTLED, 90);
    cover(target(".entry-blocks, .cside-text"), SETTLED, writeEnd - SETTLED);
    cover(target(".entry-record-values a, .cside-site"), writeEnd, LINK);

    for (const a of opening) {
      a.currentTime = 0;
      a.play();
    }
    /* the layer goes when the run is over - on the animations' own clock,
       so it holds however the page is throttled */
    const done = () => {
      layer.remove();
      root.removeAttribute("data-nk-flying");
      for (const el of waiting) el.removeAttribute("data-nk-awaiting");
    };
    layer.animate([{ opacity: 1 }, { opacity: 1 }], { duration: RUN + 20 }).finished.then(done, done);
  });
}
