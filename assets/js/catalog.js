/* ShopAtPinkHouse — catalog data
 * ---------------------------------------------------------------------------
 * COMMERCE READINESS
 * This file is the single source of product truth for the preview. Every card,
 * swatch, size chip and quick-view panel on the page is rendered from it, so
 * nothing about the layout is hard-coded to a specific product.
 *
 * To go live, replace `window.PH.catalog` with data fetched from your backend
 * (Shopify Storefront API, Stripe Products, Medusa, a headless CMS, whatever).
 * Keep the shape below and no markup or CSS has to change:
 *
 *   id        stable internal id
 *   sku       the id you will hand to the payment processor
 *   handle    URL slug -> /products/<handle> when product pages exist
 *   name      display name
 *   price     INTEGER MINOR UNITS (cents). Never floats -- money in cents is
 *             what Stripe/Shopify expect and it avoids rounding drift.
 *   compareAt integer cents or null; renders the struck-through "was" price
 *   currency  ISO 4217
 *   category  must match a `categories` id below
 *   badge     optional flag chip ("New", "Best seller", ...)
 *   colors    [{ id, name, hex, pattern? }] -- swatches on the card
 *   sizes     [{ id, label, available }] -- `available:false` renders sold out
 *   images    { primary, hover, gallery[] } -- swap these paths for real photos
 *   details   bullets shown in quick view
 *
 * A variant in a real store is the (color x size) pair. `variantId(product,
 * color, size)` below builds a deterministic key for that pair; point it at
 * your processor's real variant ids when you wire up checkout.
 */
(function () {
  'use strict';

  var IMG = 'assets/img/placeholder/';

  var categories = [
    { id: 'sets',      label: 'Sets',      image: IMG + 'cat-sets.svg',      blurb: 'Three pieces, one signature.' },
    { id: 'tops',      label: 'Tops',      image: IMG + 'cat-tops.svg',      blurb: 'Halters, ribbed tees, bodices.' },
    { id: 'bottoms',   label: 'Bottoms',   image: IMG + 'cat-bottoms.svg',   blurb: 'Fold-over flares and minis.' },
    { id: 'outerwear', label: 'Outerwear', image: IMG + 'cat-outerwear.svg', blurb: 'Zip hoodies and track jackets.' },
    { id: 'knitwear',  label: 'Knitwear',  image: IMG + 'cat-knitwear.svg',  blurb: 'Rib knits and soft cardigans.' },
    { id: 'dresses',   label: 'Dresses',   image: IMG + 'cat-dresses.svg',   blurb: 'Slips, minis, ribbon ties.' }
  ];

  var SIZES = function (soldOut) {
    soldOut = soldOut || [];
    return ['XS', 'S', 'M', 'L', 'XL'].map(function (s) {
      return { id: s.toLowerCase(), label: s, available: soldOut.indexOf(s) === -1 };
    });
  };

  var C = {
    pinkSugar: { id: 'pink-sugar', name: 'Pink Sugar',  hex: '#F7C6D5' },
    pinkPolka: { id: 'pink-polka', name: 'Pink Polka',  hex: '#F7C6D5', pattern: 'polka' },
    powder:    { id: 'powder',     name: 'Powder',      hex: '#FBEEF3' },
    cream:     { id: 'cream',      name: 'Cream',       hex: '#F6F1E9' },
    jet:       { id: 'jet',        name: 'Jet',         hex: '#141011' },
    jetPolka:  { id: 'jet-polka',  name: 'Jet Polka',   hex: '#141011', pattern: 'polka' },
    leopard:   { id: 'leopard',    name: 'Leopard',     hex: '#B98047', pattern: 'leopard' },
    chrome:    { id: 'chrome',     name: 'Chrome',      hex: '#C9CCD4' }
  };

  var products = [
    {
      id: 'ph-set-001', sku: 'PH-SET-001', handle: 'the-ph-set',
      name: 'The PH Set, Three-Piece', price: 16800, compareAt: 19800,
      currency: 'USD', category: 'sets', badge: 'Signature',
      colors: [C.pinkSugar, C.pinkPolka, C.jetPolka, C.jet, C.leopard],
      sizes: SIZES(),
      images: {
        primary: IMG + 'p-set-pink.svg',
        hover: IMG + 'p-set-pink-alt.svg',
        gallery: [IMG + 'p-set-pink.svg', IMG + 'p-set-pink-alt.svg', IMG + 'p-set-polka.svg']
      },
      details: [
        'Cropped zip hoodie, ruched halter bodice and fold-over flare pant',
        'Brushed cotton-modal rib, 280 gsm, garment washed',
        'PH monogram embroidered at the waistband',
        'Sold as a set — pieces also available separately'
      ]
    },
    {
      id: 'ph-set-002', sku: 'PH-SET-002', handle: 'the-ph-set-polka',
      name: 'The PH Set, Polka', price: 16800, compareAt: null,
      currency: 'USD', category: 'sets', badge: 'New',
      colors: [C.pinkPolka, C.jetPolka],
      sizes: SIZES(['XS']),
      images: {
        primary: IMG + 'p-set-polka.svg',
        hover: IMG + 'p-set-polka-alt.svg',
        gallery: [IMG + 'p-set-polka.svg', IMG + 'p-set-polka-alt.svg']
      },
      details: [
        'The signature three-piece in a hand-drawn polka print',
        'Print placement matched across all three pieces',
        'Brushed cotton-modal rib, 280 gsm'
      ]
    },
    {
      id: 'ph-set-003', sku: 'PH-SET-003', handle: 'the-ph-set-jet',
      name: 'The PH Set, Jet', price: 16800, compareAt: null,
      currency: 'USD', category: 'sets', badge: null,
      colors: [C.jet, C.leopard],
      sizes: SIZES(['XL']),
      images: {
        primary: IMG + 'p-set-jet.svg',
        hover: IMG + 'p-set-jet-alt.svg',
        gallery: [IMG + 'p-set-jet.svg', IMG + 'p-set-jet-alt.svg']
      },
      details: [
        'The signature three-piece in jet with a leopard halter option',
        'Silver-tone two-way zip, custom PH pull',
        'Brushed cotton-modal rib, 280 gsm'
      ]
    },
    {
      id: 'ph-out-001', sku: 'PH-OUT-001', handle: 'monogram-zip-hoodie',
      name: 'Monogram Zip Hoodie', price: 8800, compareAt: null,
      currency: 'USD', category: 'outerwear', badge: 'Best seller',
      colors: [C.pinkSugar, C.jet, C.pinkPolka, C.jetPolka],
      sizes: SIZES(),
      images: {
        primary: IMG + 'p-hoodie.svg',
        hover: IMG + 'p-hoodie-alt.svg',
        gallery: [IMG + 'p-hoodie.svg', IMG + 'p-hoodie-alt.svg']
      },
      details: [
        'Cropped, waist-shaped, two-way silver zip',
        'Drawcord hood with knotted metal tips',
        'Runs true to size — take one down for a closer fit'
      ]
    },
    {
      id: 'ph-top-001', sku: 'PH-TOP-001', handle: 'ruched-halter-bodice',
      name: 'Ruched Halter Bodice', price: 5200, compareAt: null,
      currency: 'USD', category: 'tops', badge: null,
      colors: [C.powder, C.leopard, C.pinkSugar, C.jet],
      sizes: SIZES(['L', 'XL']),
      images: {
        primary: IMG + 'p-halter.svg',
        hover: IMG + 'p-halter-alt.svg',
        gallery: [IMG + 'p-halter.svg', IMG + 'p-halter-alt.svg']
      },
      details: [
        'Gathered cups with an underbust seam',
        'Self-tie halter neck, fully adjustable',
        'Stretch rib — holds shape wash after wash'
      ]
    },
    {
      id: 'ph-btm-001', sku: 'PH-BTM-001', handle: 'fold-over-flare-pant',
      name: 'Fold-Over Flare Pant', price: 7800, compareAt: 9200,
      currency: 'USD', category: 'bottoms', badge: null,
      colors: [C.pinkSugar, C.jet, C.pinkPolka, C.jetPolka],
      sizes: SIZES(),
      images: {
        primary: IMG + 'p-flare.svg',
        hover: IMG + 'p-flare-alt.svg',
        gallery: [IMG + 'p-flare.svg', IMG + 'p-flare-alt.svg']
      },
      details: [
        'Fold-over waistband with PH monogram at the hip',
        '32" inseam, cut to break over a heel',
        'Also offered in petite and tall'
      ]
    },
    {
      id: 'ph-knt-001', sku: 'PH-KNT-001', handle: 'heart-knit-cardigan',
      name: 'Heart-Knit Cardigan', price: 11800, compareAt: null,
      currency: 'USD', category: 'knitwear', badge: 'New',
      colors: [C.pinkSugar, C.cream, C.jet],
      sizes: SIZES(['XS']),
      images: {
        primary: IMG + 'p-cardigan.svg',
        hover: IMG + 'p-cardigan-alt.svg',
        gallery: [IMG + 'p-cardigan.svg', IMG + 'p-cardigan-alt.svg']
      },
      details: [
        'Intarsia hearts knitted in, never printed on',
        'Merino-cotton blend with a mother-of-pearl button placket',
        'Cropped at the high hip'
      ]
    },
    {
      id: 'ph-drs-001', sku: 'PH-DRS-001', handle: 'bow-slip-dress',
      name: 'Bow Slip Dress', price: 13800, compareAt: null,
      currency: 'USD', category: 'dresses', badge: null,
      colors: [C.pinkSugar, C.powder, C.jet],
      sizes: SIZES(['S']),
      images: {
        primary: IMG + 'p-slip-dress.svg',
        hover: IMG + 'p-slip-dress-alt.svg',
        gallery: [IMG + 'p-slip-dress.svg', IMG + 'p-slip-dress-alt.svg']
      },
      details: [
        'Bias-cut satin with a bow at each shoulder',
        'Cowl neck, adjustable straps, midi length',
        'Lined through the body'
      ]
    },
    {
      id: 'ph-drs-002', sku: 'PH-DRS-002', handle: 'ribbon-tie-mini-dress',
      name: 'Ribbon-Tie Mini Dress', price: 12800, compareAt: null,
      currency: 'USD', category: 'dresses', badge: null,
      colors: [C.pinkPolka, C.powder, C.jet],
      sizes: SIZES(),
      images: {
        primary: IMG + 'p-mini-dress.svg',
        hover: IMG + 'p-mini-dress-alt.svg',
        gallery: [IMG + 'p-mini-dress.svg', IMG + 'p-mini-dress-alt.svg']
      },
      details: [
        'Corset-seamed bodice with ribbon lacing at the back',
        'Stretch poplin, fully lined',
        'Mini length, 34" from the shoulder'
      ]
    },
    {
      id: 'ph-out-002', sku: 'PH-OUT-002', handle: 'chrome-snap-track-jacket',
      name: 'Chrome-Snap Track Jacket', price: 14800, compareAt: null,
      currency: 'USD', category: 'outerwear', badge: null,
      colors: [C.chrome, C.pinkSugar, C.jet],
      sizes: SIZES(['XS', 'S']),
      images: {
        primary: IMG + 'p-track-jacket.svg',
        hover: IMG + 'p-track-jacket-alt.svg',
        gallery: [IMG + 'p-track-jacket.svg', IMG + 'p-track-jacket-alt.svg']
      },
      details: [
        'Mirror-finish snaps and a stand collar',
        'Water-repellent shell with a brushed jersey lining',
        'Relaxed through the shoulder'
      ]
    }
  ];

  window.PH = window.PH || {};
  window.PH.catalog = { categories: categories, products: products };

  /* Deterministic variant key for a (product, color, size) pair.
     Swap the body for your processor's real variant id lookup at checkout. */
  window.PH.variantId = function (product, colorId, sizeId) {
    return [product.sku, colorId, sizeId].join('--').toUpperCase();
  };

  window.PH.formatPrice = function (cents, currency) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: cents % 100 === 0 ? 0 : 2
    }).format(cents / 100);
  };
})();
