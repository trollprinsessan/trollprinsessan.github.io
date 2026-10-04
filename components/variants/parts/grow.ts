/* THE CARD GROWS INTO THE MODAL (cardstyle-v8).
   A press on a card lays a copy of it - its white ground and shadow, and
   each of its parts - over the page where the card stands, opens the modal
   unseen, and then moves the copy into the modal: the ground grows to the
   sheet, and the name, the picture, the one-liner and the tags each travel
   to where the modal sets them, while the copy's other words fade. When
   they land the modal shows and the copy lifts away. Nothing of the
   original modal is changed; it only waits hidden (html[data-nk-growing])
   while the copy is in flight. */

const RUN = 520;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/* each part of the card, and where the modal puts it */
const PARTS: { from: string; to: string; kind: "text" | "img" }[] = [
  { from: ".entry2-name", to: ".entry-name", kind: "text" },
  { from: ".entry2-thumb", to: ".entry-figure img", kind: "img" },
  { from: ".entry2-gymbs", to: ".entry-statement", kind: "text" },
  { from: ".entry2-sections", to: ".entry-record", kind: "text" },
];

const TEXT_PROPS = [
  "fontFamily",
  "fontSize",
  "fontWeight",
  "fontStyle",
  "lineHeight",
  "letterSpacing",
  "color",
  "textAlign",
] as const;

function fixedAt(el: HTMLElement, r: DOMRect) {
  Object.assign(el.style, {
    position: "fixed",
    left: `${r.left}px`,
    top: `${r.top}px`,
    width: `${r.width}px`,
    height: `${r.height}px`,
    margin: "0",
    zIndex: "400",
    pointerEvents: "none",
    boxSizing: "border-box",
  });
}

/* the sheet, once it is in the page and laid out */
function whenOpen(done: (entry: HTMLElement) => void) {
  const start = performance.now();
  const look = () => {
    const entry = document.querySelector<HTMLElement>(".entry-scrim .entry");
    if (entry && entry.getBoundingClientRect().width > 0) {
      /* the original sheet takes its place from its own opening animation:
         run it to its end, unseen, so the place measured is where it rests */
      entry.getAnimations().forEach((a) => a.finish());
      return done(entry);
    }
    if (performance.now() - start > 1200) return done(document.body);
    requestAnimationFrame(look);
  };
  requestAnimationFrame(look);
}

export function growFrom(card: HTMLElement, open: () => void) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return open();
  const root = document.documentElement;
  const r0 = card.getBoundingClientRect();

  /* the copy: the ground, then each part, at the card's own place */
  const layer = document.createElement("div");
  layer.className = "nk-grow";
  const ground = document.createElement("div");
  ground.className = "nk-grow-ground";
  fixedAt(ground, r0);
  layer.appendChild(ground);

  const flights: { clone: HTMLElement; from: DOMRect; to: string; kind: "text" | "img" }[] = [];
  for (const p of PARTS) {
    const src = card.querySelector<HTMLElement>(p.from);
    if (!src) continue;
    const from = src.getBoundingClientRect();
    if (!from.width) continue;
    const clone = src.cloneNode(true) as HTMLElement;
    const cs = getComputedStyle(src);
    if (p.kind === "text") for (const k of TEXT_PROPS) clone.style[k] = cs[k];
    else clone.style.objectFit = "contain";
    fixedAt(clone, from);
    clone.style.overflow = "visible";
    layer.appendChild(clone);
    flights.push({ clone, from, to: p.to, kind: p.kind });
  }
  document.body.appendChild(layer);

  /* the modal opens unseen */
  root.setAttribute("data-nk-growing", "");
  open();

  whenOpen((entry) => {
    const t = entry.getBoundingClientRect();
    const ground$ = ground.animate(
      [
        { left: `${r0.left}px`, top: `${r0.top}px`, width: `${r0.width}px`, height: `${r0.height}px` },
        { left: `${t.left}px`, top: `${t.top}px`, width: `${t.width}px`, height: `${t.height}px` },
      ],
      { duration: RUN, easing: EASE, fill: "forwards" }
    );
    for (const f of flights) {
      const target = entry.querySelector<HTMLElement>(f.to);
      const to = target?.getBoundingClientRect();
      if (!to || !to.width) {
        /* nowhere for it in the modal: it fades where it is */
        f.clone.animate([{ opacity: 1 }, { opacity: 0 }], { duration: RUN / 2, fill: "forwards" });
        continue;
      }
      const dx = to.left - f.from.left;
      const dy = to.top - f.from.top;
      if (f.kind === "img") {
        f.clone.animate(
          [
            { left: `${f.from.left}px`, top: `${f.from.top}px`, width: `${f.from.width}px`, height: `${f.from.height}px` },
            { left: `${to.left}px`, top: `${to.top}px`, width: `${to.width}px`, height: `${to.height}px` },
          ],
          { duration: RUN, easing: EASE, fill: "forwards" }
        );
      } else {
        /* words travel, and hand over to the modal's own once they land */
        const size = parseFloat(getComputedStyle(target!).fontSize) / (parseFloat(f.clone.style.fontSize) || 1);
        f.clone.style.transformOrigin = "0 0";
        f.clone.animate(
          [
            { transform: "translate(0, 0) scale(1)" },
            { transform: `translate(${dx}px, ${dy}px) scale(${size})` },
          ],
          { duration: RUN, easing: EASE, fill: "forwards" }
        );
      }
    }
    ground$.finished.then(() => {
      root.removeAttribute("data-nk-growing");
      layer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, fill: "forwards" }).finished.then(() => layer.remove());
    });
  });
}
