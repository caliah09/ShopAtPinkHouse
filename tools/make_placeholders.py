#!/usr/bin/env python3
"""Generate the placeholder art used by the ShopAtPinkHouse preview.

Every image on the site is a real <img> pointing at one of these SVGs. To go
live you replace the file (or repoint the src) with your own photography --
no markup or CSS changes required. Each placeholder bakes its own spec into
the artwork: slot name, pixel size, and the path to overwrite.

    python3 tools/make_placeholders.py
"""

from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "assets" / "img" / "placeholder"

INK = "#141011"
PINK = "#E9508D"
BLUSH = "#F9DCE6"
POWDER = "#FBEEF3"
LINE = "#EBC3D2"

# --- small line-art garments, drawn once and reused at any scale -------------
# Each returns SVG markup inside a 0 0 200 260 viewBox.

HOODIE = """
<path d="M74 46 L60 54 C46 61 40 74 39 90 L34 132 L52 137 L57 108 L57 214
  C57 219 60 222 65 222 L135 222 C140 222 143 219 143 214 L143 108 L148 137
  L166 132 L161 90 C160 74 154 61 140 54 L126 46"/>
<path d="M74 46 C86 62 114 62 126 46"/>
<path d="M100 60 L100 222"/>
<path d="M86 50 L92 74 M114 50 L108 74"/>
"""

HALTER = """
<path d="M100 34 C88 34 82 42 82 52 L82 66"/>
<path d="M100 34 C112 34 118 42 118 52 L118 66"/>
<path d="M62 74 C74 66 86 64 100 64 C114 64 126 66 138 74
  L134 118 C134 142 130 168 126 196 L74 196 C70 168 66 142 66 118 Z"/>
<path d="M66 118 C80 130 120 130 134 118"/>
<path d="M100 64 L100 118"/>
"""

FLARE = """
<path d="M64 44 L136 44 L136 74 L64 74 Z"/>
<path d="M64 74 L68 150 L58 226 L94 226 L100 128 L106 226 L142 226 L132 150
  L136 74"/>
<path d="M100 74 L100 128"/>
"""

DRESS = """
<path d="M76 42 C86 56 114 56 124 42"/>
<path d="M76 42 L62 52 L54 84 L70 90 L74 74 L64 204 C84 214 116 214 136 204
  L126 74 L130 90 L146 84 L138 52 L124 42"/>
<path d="M100 56 L100 208"/>
"""

COAT = """
<path d="M76 44 L60 52 C48 58 42 70 41 84 L36 130 L54 136 L59 106 L59 216
  L141 216 L141 106 L146 136 L164 130 L159 84 C158 70 152 58 140 52 L124 44"/>
<path d="M76 44 L100 82 L124 44"/>
<path d="M100 82 L100 216"/>
<circle cx="100" cy="112" r="3"/><circle cx="100" cy="140" r="3"/>
<circle cx="100" cy="168" r="3"/>
"""

KNIT = """
<path d="M70 48 L56 56 C44 63 38 76 38 92 L34 134 L52 139 L58 110 L58 210
  C58 215 61 218 66 218 L134 218 C139 218 142 215 142 210 L142 110 L148 139
  L166 134 L162 92 C162 76 156 63 144 56 L130 48"/>
<path d="M70 48 C82 60 118 60 130 48"/>
<path d="M74 92 L126 92 M74 116 L126 116 M74 140 L126 140 M74 164 L126 164"/>
"""

TRIO = """
<g transform="translate(-38,26) scale(0.62)">%s</g>
<g transform="translate(52,20) scale(0.62)">%s</g>
<g transform="translate(140,26) scale(0.62)">%s</g>
""" % (HOODIE, HALTER, FLARE)

ART = {
    "hoodie": HOODIE, "halter": HALTER, "flare": FLARE,
    "dress": DRESS, "coat": COAT, "knit": KNIT, "trio": TRIO,
    "none": "",
}

BOW = """
<path d="M50 22 C50 12 40 6 30 10 C18 15 16 30 26 36 C34 41 44 36 50 22 Z"/>
<path d="M50 22 C50 12 60 6 70 10 C82 15 84 30 74 36 C66 41 56 36 50 22 Z"/>
<path d="M50 22 C46 30 44 40 42 52 M50 22 C54 30 56 40 58 52"/>
<ellipse cx="50" cy="22" rx="7" ry="6"/>
"""


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def build(w, h, title, path, art="none", ground=POWDER, art_scale=1.0,
          label_top=False):
    """Compose one placeholder SVG at the slot's true pixel dimensions.

    `label_top` lifts the spec text into the upper third. Category cards paint
    a caption over their lower edge, so centred spec text would collide.
    """
    cx = w / 2
    # Artwork occupies the middle band; labels sit beneath it.
    box = min(w, h) * 0.42 * art_scale
    ax, ay = cx - box / 2, h / 2 - box * 0.62
    label_y = h / 2 + box * 0.60
    if label_top:
        ay = h * 0.46 - box * 0.5
        label_y = h * 0.17
    unit = min(w, h)
    t1 = max(11.0, unit * 0.033)
    t2 = max(9.5, unit * 0.024)
    stroke = max(1.1, unit * 0.0045)

    art_g = ""
    if art != "none":
        art_g = (
            '<g transform="translate(%.2f,%.2f) scale(%.4f)" fill="none" '
            'stroke="%s" stroke-width="%.2f" stroke-linecap="round" '
            'stroke-linejoin="round" opacity=".55">%s</g>'
            % (ax, ay, box / 200.0, PINK, 2.6 * (200.0 / box) * stroke, ART[art])
        )

    inset = unit * 0.035
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" \
width="{w}" height="{h}" role="img" aria-label="{esc(title)} placeholder">
<rect width="{w}" height="{h}" fill="{ground}"/>
<rect x="{inset:.1f}" y="{inset:.1f}" width="{w - inset * 2:.1f}" \
height="{h - inset * 2:.1f}" fill="none" stroke="{LINE}" \
stroke-width="{stroke:.2f}" stroke-dasharray="{stroke * 7:.1f} {stroke * 5:.1f}"/>
{art_g}
<text x="{cx:.1f}" y="{label_y:.1f}" text-anchor="middle" \
font-family="Futura,'Avenir Next','Century Gothic','Helvetica Neue',Arial,sans-serif" \
font-size="{t1:.1f}" letter-spacing="{t1 * 0.20:.2f}" fill="{INK}" \
opacity=".75">{esc(title.upper())}</text>
<text x="{cx:.1f}" y="{label_y + t1 * 1.9:.1f}" text-anchor="middle" \
font-family="Futura,'Avenir Next','Century Gothic','Helvetica Neue',Arial,sans-serif" \
font-size="{t2:.1f}" letter-spacing="{t2 * 0.10:.2f}" fill="{PINK}">\
{w} &#215; {h}</text>
<text x="{cx:.1f}" y="{label_y + t1 * 1.9 + t2 * 1.9:.1f}" text-anchor="middle" \
font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" \
font-size="{t2 * 0.92:.1f}" fill="{INK}" opacity=".42">{esc(path)}</text>
</svg>
"""


def logo(w, h, name, on_dark=False):
    """Wordmark slot. Renders a PH monogram lockup until the real file lands."""
    fg = "#FFFFFF" if on_dark else INK
    accent = "#F7A8C6" if on_dark else PINK
    ground = "none" if on_dark else "none"
    cx, cy = w / 2, h / 2
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" \
width="{w}" height="{h}" role="img" aria-label="{esc(name)} logo placeholder">
<rect width="{w}" height="{h}" fill="{ground}"/>
<g fill="none" stroke="{accent}" stroke-width="{h * 0.035:.2f}" \
stroke-linecap="round" stroke-linejoin="round">
<g transform="translate({cx - h * 1.62:.1f},{cy - h * 0.30:.1f}) \
scale({h * 0.0090:.4f})">{BOW}</g>
<g transform="translate({cx + h * 1.02:.1f},{cy - h * 0.30:.1f}) \
scale({h * 0.0090:.4f})">{BOW}</g>
</g>
<text x="{cx:.1f}" y="{cy + h * 0.10:.1f}" text-anchor="middle" \
font-family="Didot,'Bodoni MT','Hoefler Text',Garamond,Georgia,serif" \
font-style="italic" font-size="{h * 0.52:.1f}" fill="{fg}" \
letter-spacing="{h * 0.02:.2f}">PH</text>
<text x="{cx:.1f}" y="{cy + h * 0.38:.1f}" text-anchor="middle" \
font-family="Futura,'Avenir Next','Century Gothic','Helvetica Neue',Arial,sans-serif" \
font-size="{h * 0.115:.1f}" letter-spacing="{h * 0.075:.2f}" fill="{fg}" \
opacity=".62">LOGO SLOT</text>
</svg>
"""


def press(w, h, n):
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" \
width="{w}" height="{h}" role="img" aria-label="Press logo slot {n}">
<rect x="1" y="1" width="{w - 2}" height="{h - 2}" fill="none" stroke="{LINE}" \
stroke-width="1.4" stroke-dasharray="6 4"/>
<text x="{w / 2}" y="{h / 2 + 4}" text-anchor="middle" \
font-family="Futura,'Avenir Next','Century Gothic','Helvetica Neue',Arial,sans-serif" \
font-size="11" letter-spacing="2.2" fill="{INK}" opacity=".5">PRESS {n}</text>
</svg>
"""


SLOTS = [
    # name, w, h, title, art, ground, art_scale, label_top
    # hero + editorial
    ("hero.svg",            1400, 1750, "Hero image",      "trio",   POWDER,    1.25, False),
    ("hero-inset.svg",       700,  700, "Hero inset",      "halter", "#FFFFFF", 1.00, False),
    ("editorial-wide.svg",  2400, 1100, "Campaign banner", "trio",   BLUSH,     1.30, False),
    ("story.svg",           1200, 1500, "Brand story",     "hoodie", POWDER,    1.00, False),
    ("story-inset.svg",      760,  760, "Story inset",     "flare",  "#FFFFFF", 1.00, False),
    ("set-shop.svg",        1600, 1000, "Set shop",        "trio",   "#FFFFFF", 1.15, False),
    # category cards — caption sits over the lower edge, so specs go up top
    ("cat-sets.svg",         900, 1200, "Sets",            "trio",   POWDER,    1.15, True),
    ("cat-tops.svg",         900, 1200, "Tops",            "halter", BLUSH,     1.00, True),
    ("cat-bottoms.svg",      900, 1200, "Bottoms",         "flare",  POWDER,    1.00, True),
    ("cat-outerwear.svg",    900, 1200, "Outerwear",       "coat",   BLUSH,     1.00, True),
    ("cat-knitwear.svg",     900, 1200, "Knitwear",        "knit",   POWDER,    1.00, True),
    ("cat-dresses.svg",      900, 1200, "Dresses",         "dress",  BLUSH,     1.00, True),
]

# product shots sit on pure white, matching flat-lay studio photography
PRODUCTS = [
    ("p-set-pink",      "trio"),   ("p-set-pink-alt",   "trio"),
    ("p-set-polka",     "trio"),   ("p-set-polka-alt",  "trio"),
    ("p-set-jet",       "trio"),   ("p-set-jet-alt",    "trio"),
    ("p-hoodie",        "hoodie"), ("p-hoodie-alt",     "hoodie"),
    ("p-halter",        "halter"), ("p-halter-alt",     "halter"),
    ("p-flare",         "flare"),  ("p-flare-alt",      "flare"),
    ("p-cardigan",      "knit"),   ("p-cardigan-alt",   "knit"),
    ("p-slip-dress",    "dress"),  ("p-slip-dress-alt", "dress"),
    ("p-mini-dress",    "dress"),  ("p-mini-dress-alt", "dress"),
    ("p-track-jacket",  "coat"),   ("p-track-jacket-alt", "coat"),
]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    written = 0

    for name, w, h, title, art, ground, scale, label_top in SLOTS:
        rel = f"assets/img/placeholder/{name}"
        (OUT / name).write_text(
            build(w, h, title, rel, art, ground, scale, label_top)
        )
        written += 1

    for name, art in PRODUCTS:
        rel = f"assets/img/placeholder/{name}.svg"
        (OUT / f"{name}.svg").write_text(
            build(1080, 1440, "Product shot", rel, art, "#FFFFFF", 1.15)
        )
        written += 1

    (OUT / "logo-dark.svg").write_text(logo(520, 130, "ShopAtPinkHouse"))
    (OUT / "logo-light.svg").write_text(logo(520, 130, "ShopAtPinkHouse", True))
    written += 2

    for n in range(1, 6):
        (OUT / f"press-{n}.svg").write_text(press(190, 56, n))
        written += 1

    print(f"wrote {written} placeholders to {OUT}")


if __name__ == "__main__":
    main()
