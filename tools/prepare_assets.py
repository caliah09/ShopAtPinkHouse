#!/usr/bin/env python3
"""Derive the site's imagery from the master photography in assets/img/source.

The studio shots are flat-lays of the full three-piece set on white. Everything
the page needs -- hero, campaign banner, editorial crops and the piece detail
cards -- is cut from those five files here, so the site never ships a crop that
was made by hand and can't be reproduced.

    python3 tools/prepare_assets.py

Re-run after replacing anything in assets/img/source/.
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "img" / "source"
OUT = ROOT / "assets" / "img"

WHITE = (255, 255, 255)

# The five colourways, in the order they appear on the site.
SETS = [
    ("pink-sugar", "Pink Sugar"),
    ("pink-polka", "Pink Polka"),
    ("jet-polka",  "Jet Polka"),
    ("jet-ivory",  "Jet & Ivory"),
    ("leopard",    "Leopard"),
]

# Crop boxes in master-image pixels (all masters are 1086 x 1448 and share the
# same flat-lay composition). Each is already at its target aspect ratio.
CROPS = {
    "hoodie":   (55, 230, 400, 690),    # 3:4  zip and chest
    "halter":   (415, 265, 700, 645),   # 3:4  gathered bodice
    "flare":    (735, 330, 1065, 770),  # 3:4  waistband and PH monogram
    "monogram": (800, 310, 1086, 596),  # 1:1  the embroidery on its own
    "bodice":   (415, 265, 715, 565),   # 1:1  square crop of the bodice
    "detail":   (600, 300, 1086, 948),  # 3:4  halter hem into the flare
}


def load(slug):
    return Image.open(SRC / f"set-{slug}.webp").convert("RGB")


def save(im, rel, quality=82, max_w=None):
    if max_w and im.width > max_w:
        h = round(im.height * max_w / im.width)
        im = im.resize((max_w, h), Image.LANCZOS)
    path = OUT / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.suffix == ".png":
        im.save(path, optimize=True)
    else:
        im.save(path, quality=quality, method=6)
    return path


def on_canvas(im, w, h, margin=0.06):
    """Centre a shot on a white canvas of the exact ratio the layout wants."""
    canvas = Image.new("RGB", (w, h), WHITE)
    box_w, box_h = w * (1 - margin * 2), h * (1 - margin * 2)
    scale = min(box_w / im.width, box_h / im.height)
    fitted = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    canvas.paste(fitted, ((w - fitted.width) // 2, (h - fitted.height) // 2))
    return canvas


def row(images, w, h, gap_frac=0.018, margin=0.05):
    """Lay shots out in a row on white — used for the campaign banner."""
    canvas = Image.new("RGB", (w, h), WHITE)
    gap = round(w * gap_frac)
    avail_w = w * (1 - margin * 2) - gap * (len(images) - 1)
    cell_w = avail_w / len(images)
    cell_h = h * (1 - margin * 2)
    scale = min(cell_w / images[0].width, cell_h / images[0].height)
    fw, fh = round(images[0].width * scale), round(images[0].height * scale)
    total = fw * len(images) + gap * (len(images) - 1)
    x = (w - total) // 2
    y = (h - fh) // 2
    for im in images:
        canvas.paste(im.resize((fw, fh), Image.LANCZOS), (x, y))
        x += fw + gap
    return canvas


def transparent_logo(src, tol=18):
    """Knock the flat backdrop out of the logo so it works on pink and on black.

    Flood-fills inward from the border rather than keying the colour globally,
    so pale highlights inside the lettering survive.
    """
    im = Image.open(src).convert("RGBA")
    px = im.load()
    w, h = im.size
    base = px[0, 0][:3]

    def near(c):
        return all(abs(c[i] - base[i]) <= tol for i in range(3))

    stack = [(x, y) for x in range(w) for y in (0, h - 1)]
    stack += [(x, y) for y in range(h) for x in (0, w - 1)]
    seen = set()
    while stack:
        x, y = stack.pop()
        if (x, y) in seen or not (0 <= x < w and 0 <= y < h):
            continue
        seen.add((x, y))
        c = px[x, y]
        if c[3] == 0 or not near(c):
            continue
        px[x, y] = (c[0], c[1], c[2], 0)
        stack += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]

    return im.crop(im.getbbox())


def main():
    made = []

    # ---- logo ------------------------------------------------------------
    logo = transparent_logo(SRC / "logo.webp")
    made.append(save(logo, "brand/logo.png", max_w=900))

    # ---- per-colourway product imagery -----------------------------------
    masters = {}
    for slug, _ in SETS:
        im = load(slug)
        masters[slug] = im
        made.append(save(im, f"product/set-{slug}.webp", max_w=1000))
        made.append(save(im.crop(CROPS["detail"]), f"product/set-{slug}-detail.webp", max_w=800))

    # ---- the three pieces, as editorial detail crops ---------------------
    pink = masters["pink-sugar"]
    for piece in ("hoodie", "halter", "flare"):
        made.append(save(pink.crop(CROPS[piece]), f"piece/{piece}.webp", max_w=900))

    # ---- hero, campaign, story ------------------------------------------
    made.append(save(on_canvas(pink, 1200, 1500), "editorial/hero.webp", max_w=1200))
    made.append(save(pink.crop(CROPS["bodice"]), "editorial/hero-inset.webp", max_w=700))

    banner = row([masters["pink-sugar"], masters["jet-polka"], masters["leopard"]], 2000, 920)
    made.append(save(banner, "editorial/campaign.webp", max_w=1800))

    made.append(save(on_canvas(masters["leopard"], 1000, 1250), "editorial/story.webp", max_w=1000))
    made.append(save(pink.crop(CROPS["monogram"]), "editorial/story-inset.webp", max_w=700))

    total = sum(p.stat().st_size for p in made)
    for p in made:
        print(f"  {p.relative_to(ROOT)}  {p.stat().st_size / 1024:.0f} KB")
    print(f"{len(made)} files, {total / 1024:.0f} KB total")


if __name__ == "__main__":
    main()
