#!/usr/bin/env python3
"""Web-weight copies of the pictures, written beside the originals.

  python3 scripts/optimize-images.py

The originals are never changed. For every picture the page uses it writes:

  public/n100/card/<name>.webp        the still at the grid card's size (640px
                                      wide, the largest a card is drawn at
                                      twice over for dense screens)
  public/n100/<name>.anim.webp        an animation (a .gif) as animated WebP,
                                      same size, same frames, same timing
                                      (it has no card-size copy: scaled
                                      down it weighs as much)
  public/n100/thumb/<name>.webp       a still of the animation, for the
                                      index row on a phone
  public/title-gifs/<name>.anim.webp  the section titles' animations

lib/art-direction.ts maps a picture to its copy (web, cardSrc, rowThumb).
Needs Pillow. Files that are already newer than their source are skipped.
"""
from pathlib import Path
from PIL import Image, ImageSequence

ROOT = Path(__file__).resolve().parent.parent / "public"
N100 = ROOT / "n100"
CARD_W = 640
QUALITY = 90


def fresh(out: Path, src: Path) -> bool:
    return out.exists() and out.stat().st_mtime >= src.stat().st_mtime


def frames_of(src: Path, width: int | None):
    """Every frame composed whole, as a browser shows it, with its duration."""
    im = Image.open(src)
    frames, durations = [], []
    for frame in ImageSequence.Iterator(im):
        durations.append(frame.info.get("duration", im.info.get("duration", 100)) or 100)
        f = frame.convert("RGBA")
        if width and f.width > width:
            f = f.resize((width, round(f.height * width / f.width)), Image.LANCZOS)
        frames.append(f)
    return frames, durations, im.info.get("loop", 0)


def animate(src: Path, out: Path, width: int | None = None):
    if fresh(out, src):
        return
    frames, durations, loop = frames_of(src, width)
    out.parent.mkdir(parents=True, exist_ok=True)
    frames[0].save(
        out, "WEBP", save_all=True, append_images=frames[1:], duration=durations,
        loop=loop, quality=QUALITY, method=4, minimize_size=True, allow_mixed=True,
    )
    print(f"{src.stat().st_size / 1e6:6.2f} MB -> {out.stat().st_size / 1e6:5.2f} MB  {out.relative_to(ROOT)}")


def still(src: Path, out: Path, width: int, frame: int = 0):
    if fresh(out, src):
        return
    im = Image.open(src)
    if getattr(im, "n_frames", 1) > 1:
        im.seek(min(frame, im.n_frames - 1))
    im = im.convert("RGBA")
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    out.parent.mkdir(parents=True, exist_ok=True)
    im.save(out, "WEBP", quality=QUALITY, method=6)


def main():
    for src in sorted(N100.glob("*.webp")):
        if src.name.endswith(".anim.webp"):
            continue
        still(src, N100 / "card" / src.name, CARD_W)
    for src in sorted(N100.glob("*.gif")):
        animate(src, src.with_suffix(".anim.webp"))
        still(src, N100 / "thumb" / (src.stem + ".webp"), 320)
    for src in sorted((ROOT / "title-gifs").glob("*.gif")):
        animate(src, src.with_suffix(".anim.webp"))


if __name__ == "__main__":
    main()
