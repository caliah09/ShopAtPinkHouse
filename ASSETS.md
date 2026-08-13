# Dropping in your real assets

Every image on the site is a plain `<img>` pointing at a placeholder SVG. To go
live you replace the file the `src` points at — **no HTML or CSS changes.**

Two ways to do it:

1. **Keep the paths.** Save your photo over the placeholder using the same
   filename but a real extension, then update just the extension in the `src`
   (`hero.svg` → `hero.jpg`). Easiest if you're swapping everything at once.
2. **Point somewhere new.** Change the `src` to wherever your assets live
   (`assets/img/hero.jpg`, or a CDN URL). Nothing else cares.

Every slot is tagged with `data-slot="..."` in the markup, so you can find them
all with a search for `data-slot`. Each placeholder also has its own spec drawn
right into the artwork — slot name, pixel size, and the path to overwrite.

---

## Slot reference

Sizes are the **minimum**; supply 2× for retina if you can. The crop column is
what matters — the layout is built around these ratios, and a photo at a
different ratio will be cropped to fit (`object-fit: cover`), except product
shots which are fitted inside the frame (`object-fit: contain`).

### Logo

| Slot | File | Size | Notes |
|---|---|---|---|
| `logo-header` | `placeholder/logo-dark.svg` | ≥600px wide | Dark version, sits on the blush bar. Renders at ~52px tall, width flows — square or wide lockups both work. Transparent PNG or SVG. |
| `logo-footer` | `placeholder/logo-light.svg` | ≥600px wide | **Light/white version** — the footer is near-black. Renders at 54px tall. |

Your `ShopPH by ZIONZAREA` lockup drops straight into both. You'll want a
white or knocked-out variant for the footer.

### Hero

| Slot | File | Size | Crop |
|---|---|---|---|
| `hero` | `placeholder/hero.svg` | 1400 × 1750 | **4:5 portrait.** Main campaign shot. Sits inside the chrome bezel. |
| `hero-inset` | `placeholder/hero-inset.svg` | 700 × 700 | **1:1 square.** Optional detail/crop shot overlapping the hero. Hidden below 640px. |

### Editorial

| Slot | File | Size | Crop |
|---|---|---|---|
| `campaign` | `placeholder/editorial-wide.svg` | 2400 × 1100 | **~16:10 landscape.** Sits on the black band. |
| `story` | `placeholder/story.svg` | 1200 × 1500 | **4:5 portrait.** Founder / studio shot. |
| `story-inset` | `placeholder/story-inset.svg` | 760 × 760 | **1:1 square.** Fabric or detail shot. |

### Category cards (6)

All **900 × 1200, 3:4 portrait**, files `placeholder/cat-<id>.svg`:
`cat-sets`, `cat-tops`, `cat-bottoms`, `cat-outerwear`, `cat-knitwear`,
`cat-dresses`.

A caption is painted over the lower third, so keep the subject in the upper
two-thirds and avoid busy detail at the bottom edge.

These come from `assets/js/catalog.js` → `categories[].image`, not from the
HTML — change the path there.

### Product shots

All **1080 × 1440, 3:4 portrait**, on a **white or very light ground**. They're
fitted inside a bordered frame with padding rather than cropped, which suits
the flat-lay studio shots you sent — the garment sits in white space instead of
bleeding to the edge.

Each product needs two: a `primary` and a `hover` (shown on mouse-over). The
`gallery` array feeds the quick-view thumbnails.

Set in `assets/js/catalog.js` → `products[].images`:

```js
images: {
  primary: 'assets/img/products/ph-set-pink-01.jpg',
  hover:   'assets/img/products/ph-set-pink-02.jpg',
  gallery: ['...01.jpg', '...02.jpg', '...03.jpg']
}
```

### Press logos (5)

`placeholder/press-1.svg` … `press-5.svg`. Render at 34px tall, width flows.
Transparent SVG or PNG, single colour. Delete the `<img>` tags you don't need —
the row is a flex wrap and re-centres itself.

---

## Copy you'll want to change

All of it is placeholder. The pieces most worth a pass:

- **Hero headline** — "Come in. Stay a season" (`index.html`, `.hero__title`)
- **Brand story** — the "It really was a pink house" section is invented. The
  founding year, the 40k+ figure and the origin story are all placeholders.
  Replace with your real story before this goes public.
- **Product names, prices and descriptions** — `assets/js/catalog.js`
- **"As seen in"** — remove the whole section if you don't have press yet.
  Claiming coverage you don't have is worse than having no press row.
- **Footer links** — all `href="#"`. Point them at real pages.
