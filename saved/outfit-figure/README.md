# Outfit figure (parked)

A flat vector croquis — deliberately faceless, the way a lookbook sketch is
drawn — that stood on the outfit selector's stage and wore each colourway. It
was built because there was no on-body photography, and parked here the moment
real photography became the plan.

- `figure.svg` — standalone, dressed in Pink Sugar. Open it in a browser.
- `stage-markup.html` — the exact block that sat inside `.stage__screen`,
  with the `data-cq-*` hooks intact.

## Reinstating her

1. Paste `stage-markup.html` back into `.stage__screen` in `index.html`,
   above the `[data-stage-img]` tag.
2. Put back the `.cq-*` and `.croquis` rules in `site.css`:

```css
.croquis { position: relative; z-index: 1; height: clamp(290px, 34vw, 450px); width: auto; }
.croquis[hidden] { display: none; }
.cq-skin  { fill: #D9A583; }
.cq-shade { fill: #C4906B; }
.cq-hair  { fill: #3A2A22; }
.cq-shoe  { fill: #E9508D; }
```

3. Put an `outfit` back on each colourway in `catalog.js`. Each of the three
   pieces takes a hex or the token `polka` / `leopard`:

```js
{ id: 'pink-sugar', ..., outfit: { hoodie: '#F3C3D2', halter: '#F8D6E1', pants: '#F3C3D2' } },
{ id: 'pink-polka', ..., outfit: { hoodie: 'polka', halter: '#FFFFFF', pants: 'polka',
                                   polka: { base: '#F3C3D2', dot: '#FFFFFF' } } },
{ id: 'jet-polka',  ..., outfit: { hoodie: 'polka', halter: '#FFFFFF', pants: 'polka',
                                   polka: { base: '#1A1618', dot: '#FFFFFF' } } },
{ id: 'jet-ivory',  ..., outfit: { hoodie: '#1A1618', halter: '#FFFFFF', pants: 'polka',
                                   polka: { base: '#1A1618', dot: '#FFFFFF' } } },
{ id: 'leopard',    ..., outfit: { hoodie: '#1A1618', halter: 'leopard', pants: '#1A1618' } }
```

4. Add the dressing function to `site.js` and call it from `renderStage()`
   whenever a colourway has no `model` photograph:

```js
function paint(token) {
  if (token === 'polka') return 'url(#ph-polka)';
  if (token === 'leopard') return 'url(#ph-leopard)';
  return token;
}

function dressCroquis(outfit) {
  if (!outfit) return;
  if (outfit.polka) {
    $$('[data-polka-base]').forEach(function (el) { el.setAttribute('fill', outfit.polka.base); });
    $$('[data-polka-dot]').forEach(function (el) { el.setAttribute('fill', outfit.polka.dot); });
  }
  [['hoodie', '[data-cq-hoodie]'], ['halter', '[data-cq-halter]'], ['pants', '[data-cq-pants]']]
    .forEach(function (pair) {
      var fill = paint(outfit[pair[0]]);
      $$(pair[1]).forEach(function (el) { el.setAttribute('fill', fill); });
    });
}
```

She is an illustration and not a photograph of any person. If you use her
publicly, keep her recognisably illustrative rather than presenting her as
product photography.
