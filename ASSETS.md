# Assets

The site now runs on your real photography and logo. Everything is derived from
six master files, so there are no hand-made crops to maintain.

## How it works

```
assets/img/source/          <- the masters. The only files you edit.
  set-pink-sugar.webp
  set-pink-polka.webp
  set-jet-polka.webp
  set-jet-ivory.webp
  set-leopard.webp
  logo.webp

python3 tools/prepare_assets.py

assets/img/brand/           <- logo with the backdrop knocked out
assets/img/product/         <- per-colourway card + hover shots
assets/img/piece/           <- hoodie / halter / flare detail crops
assets/img/editorial/       <- hero, hero inset, campaign, story, story inset
```

Everything under `brand/`, `product/`, `piece/` and `editorial/` is **generated**.
Don't edit those by hand — change the master or the script and re-run it.

## Replacing or adding photography

**A new colourway.** Drop a shot into `assets/img/source/` named
`set-<slug>.webp`, add it to `SETS` in `tools/prepare_assets.py`, add a matching
entry to `COLORWAYS` and `SPEC` in `assets/js/catalog.js`, and re-run the script.
The card, swatch row, quick view and hover shot all follow automatically.

**A new logo.** Overwrite `assets/img/source/logo.webp` and re-run. The script
flood-fills the flat backdrop from the border inward, so the same file works on
the blush header and the black footer. If your new logo has a busy or gradient
background the knockout won't work — supply a transparent PNG instead and point
`transparent_logo()` at it, or skip the function.

**Different crops.** The `CROPS` dictionary at the top of `prepare_assets.py`
holds every crop box in master-image pixels. All five masters share the same
flat-lay composition, so one set of boxes serves them all. If you reshoot with a
different layout, these are the numbers to adjust.

## What the layout expects

| Where | Ratio | Notes |
|---|---|---|
| Product card | 3:4 portrait | Fitted inside a bordered frame (`object-fit: contain`), so the garment sits in white space rather than bleeding to the edge. Studio-on-white works best. |
| Hero | 4:5 portrait | Composed onto a white canvas by the script, so any master ratio works. |
| Piece card | 3:4 portrait | Detail crops. A caption sits over the lower third — keep the subject above it. |
| Campaign | ~2.2:1 landscape | Composed from three colourways in a row. Sits on the black band. |
| Story | 4:5 portrait | Currently the leopard set. Swap for a founder or studio shot when you have one. |
| Insets | 1:1 square | Detail crops — the halter bodice and the PH monogram. |
| Logo | any | Rendered at ~62px tall in the header, 64px in the footer; width flows. |

Every `<img>` still carries a `data-slot` attribute, so you can find any single
image with a search for `data-slot`.

## On-body photography

The outfit selector shows the flat-lay for now. When you have model shots, set
`model` on the colourway in `catalog.js` and the stage uses that instead:

```js
{ id: 'pink-sugar', ..., model: 'assets/img/model/pink-sugar.jpg' }
```

**4:5 portrait, light ground.** It falls back to the flat-lay per colourway, so
you can add them one at a time rather than all five at once.

The illustrated figure is parked in `saved/outfit-figure/`.

## Still placeholder — change before this goes public

- **Pricing.** $168 across every colourway is a placeholder. `compareAt` is null
  everywhere — set it only when you actually run a promotion, and it renders the
  struck-through "was" price automatically.
- **Product copy.** The detail bullets in `catalog.js` describe the garments from
  the photos; check the fabric, gsm and construction claims are true.
- **Badges.** "Signature", "New" and "Best seller" are assigned arbitrarily.
- **Sold-out sizes.** Assigned arbitrarily to show the state rendering.
- **Footer links** all point at `#`.

The press row ("As seen in") was removed — a fabricated press logo is worse than
no press row. Add it back when you have real coverage.
