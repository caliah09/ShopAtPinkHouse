# ShopAtPinkHouse

Brand site preview — a static, dependency-free storefront front end.

```
index.html                 the page
assets/css/site.css        all styling, one token system at the top
assets/js/catalog.js       product + category data (the only place to edit copy/prices)
assets/js/site.js          rendering and interaction
assets/img/placeholder/    placeholder art, one file per image slot
tools/make_placeholders.py regenerates the placeholder art
tools/build_preview.py     flattens everything into a single preview.html
ASSETS.md                  where your photos and logo go, and at what size
```

## Running it

No build step, no dependencies. Open `index.html` in a browser, or serve the
folder:

```
python3 -m http.server 8000
```

`preview.html` is a generated single-file copy with every asset inlined — handy
for sending someone a link that works offline. Rebuild it after any change:

```
python3 tools/build_preview.py
```

## Design

Light pink and white, with the pink kept to accents so the white space carries
the premium feel. Decorative bow, heart and star line-art is used as punctuation
rather than wallpaper. One black band (the campaign section) gives the page
somewhere to be loud.

Typography is a high-contrast serif (Didot/Bodoni, falling back to Georgia) for
statements, against a wide-tracked geometric sans for navigation and labels.
No webfonts are linked — a silent fallback to a wrong face would do more damage
than a considered system stack.

The page is deliberately single-theme: it does not invert for dark mode, because
the palette is the identity. Every surface paints its own background explicitly.

## Adding your assets

See **[ASSETS.md](ASSETS.md)**. Short version: every image is an `<img>` tagged
with `data-slot`, pointing at a placeholder that has its own size spec drawn
into it. Replace the file, keep the layout.

## Commerce

Not wired up, but not painted into a corner either.

Everything renders from `assets/js/catalog.js`. Products carry `sku`, `handle`,
integer-cent `price`, colours and per-size availability; `PH.variantId()` builds
a deterministic key for each (colour × size) pair. Product cards, the filter
row, and the quick-view panel are all generated from that data, so swapping in a
Shopify Storefront / Stripe / headless CMS response means changing the data
source and nothing else.

`PH.bag` in `assets/js/site.js` is a working in-memory line-item model — add,
change quantity, remove, subtotal. It stops at exactly one place:

```js
checkout: function () { toast('Checkout isn’t connected yet'); }
```

That function is the seam. Point it at a real checkout session and the rest of
the page keeps working untouched. Line items already carry the fields Stripe
Checkout and the Shopify Cart API expect.

Also stubbed, and marked in the source: newsletter signup (front-end validation
only — point it at your ESP), search, account, and wishlist persistence.

## Placeholder copy

Product names, prices, the founding date, the "40k+ sets sold" figure and the
brand story are all invented placeholders. Replace them before this goes public
— see the end of ASSETS.md for the list.
