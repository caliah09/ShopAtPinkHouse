# ShopAtPinkHouse

Brand site preview — a static, dependency-free storefront front end.

```
index.html                 the page
assets/css/site.css        all styling, one token system at the top
assets/js/catalog.js       product + category data (the only place to edit copy/prices)
assets/js/site.js          rendering and interaction
assets/img/source/         the master photography and logo — the only images you edit
assets/img/                brand/ product/ piece/ editorial/ are all generated
tools/prepare_assets.py    derives every crop and composite from the masters
tools/build_preview.py     flattens everything into a single preview.html
ASSETS.md                  how the imagery is derived, and what to change
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

## Imagery

The site runs on five studio shots of the set (one per colourway) plus the logo,
all in `assets/img/source/`. Every crop the page uses — the hero, the campaign
line-up, the three piece detail cards, the monogram inset — is cut from those by
`tools/prepare_assets.py`, so there are no hand-made crops to maintain:

```
python3 tools/prepare_assets.py
```

The logo's flat backdrop is knocked out by the same script, which is why one file
serves both the blush header and the black footer.

See **[ASSETS.md](ASSETS.md)** for the crop boxes, the ratios each slot expects,
and how to add a colourway.

## Commerce

Not wired up, but not painted into a corner either.

Everything renders from `assets/js/catalog.js`. Products carry `sku`, `handle`,
integer-cent `price`, colours and per-size availability; `PH.variantId()` builds
a deterministic key for each (colour × size) pair. Product cards, the filter
row, and the quick-view panel are all generated from that data, so swapping in a
Shopify Storefront / Stripe / headless CMS response means changing the data
source and nothing else.

Each colourway carries its own photography, so the swatch row on a card swaps
the image in place. The filter row hides itself while only one category is
stocked and reappears the moment a second one exists.

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
