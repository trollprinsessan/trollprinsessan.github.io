"""WHERE THE MOTIF IS in every picture in public/n100, for listview-v2.

The card stands every motif on one line - the same distance from the foot of
the drawing, cutout or photograph to the first line of type - so it needs to
know where the motif ends inside each file. The cutouts sit on a transparent
3:2 canvas at 92%, the gifs carry a wide ground, the line drawings a white one.

  cutouts, anything with alpha   alpha > 12 (the photobook's own crop threshold)
  photographs (flat, opaque)     the whole file - a photograph is its frame, and
                                 cutting its light sky or white wall away shows
                                 another picture than the one in the modal
  gifs                           anything darker than 245, the union over every
                                 frame, so nothing that moves is ever cut

Writes motif-boxes.json next to this file: for each "/n100/<file>", the box as
fractions of the file's width and height, and the motif's own proportion,
[x0, y0, x1, y1, width/height]. Re-run after pictures change. Needs Pillow:

  python3 components/variants/listview-v2/motif-boxes.py
"""

import json
from pathlib import Path

from PIL import Image, ImageSequence

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
PICTURES = ROOT / "public" / "n100"
ALPHA_MIN = 12
WHITE_MAX = 245


def box_of(frame: Image.Image):
    rgba = frame.convert("RGBA")
    alpha = rgba.getchannel("A")
    if alpha.getextrema()[0] < 255:
        return alpha.point(lambda a: 255 if a > ALPHA_MIN else 0).getbbox()
    # opaque: whatever is not the white ground
    grey = rgba.convert("L")
    return grey.point(lambda v: 255 if v < WHITE_MAX else 0).getbbox()


def union(a, b):
    if a is None:
        return b
    if b is None:
        return a
    return (min(a[0], b[0]), min(a[1], b[1]), max(a[2], b[2]), max(a[3], b[3]))


def main():
    out = {}
    for path in sorted(PICTURES.iterdir()):
        if path.suffix.lower() not in {".webp", ".gif", ".png", ".jpg", ".jpeg"}:
            continue
        with Image.open(path) as im:
            w, h = im.size
            box = None
            if getattr(im, "is_animated", False):
                for frame in ImageSequence.Iterator(im):
                    box = union(box, box_of(frame))
            elif "A" not in im.getbands() and "transparency" not in im.info:
                # a photograph: whole
                box = (0, 0, w, h)
            else:
                box = box_of(im)
        if box is None:
            box = (0, 0, w, h)
        x0, y0, x1, y1 = box
        out[f"/n100/{path.name}"] = [
            round(x0 / w, 4),
            round(y0 / h, 4),
            round(x1 / w, 4),
            round(y1 / h, 4),
            round((x1 - x0) / (y1 - y0), 4),
        ]
    target = HERE / "motif-boxes.json"
    target.write_text(json.dumps(out, indent=0) + "\n")
    print(f"{len(out)} pictures -> {target.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
