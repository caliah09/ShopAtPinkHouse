/* ShopAtPinkHouse — catalog data
 * ---------------------------------------------------------------------------
 * COMMERCE READINESS
 * This file is the single source of product truth. Every card, swatch, size
 * chip and quick-view panel is rendered from it, so nothing about the layout
 * is hard-coded to a specific product.
 *
 * To go live, replace `window.PH.catalog` with data fetched from your backend
 * (Shopify Storefront API, Stripe Products, a headless CMS). Keep the shape
 * below and no markup or CSS has to change:
 *
 *   id        stable internal id
 *   sku       the id you hand to the payment processor
 *   handle    URL slug -> /products/<handle> when product pages exist
 *   name      display name
 *   colorId   which entry in `colors` this card leads with
 *   price     INTEGER MINOR UNITS (cents). Never floats -- money in cents is
 *             what Stripe/Shopify expect and it avoids rounding drift.
 *   compareAt integer cents or null; renders a struck-through "was" price.
 *             Left null everywhere -- set it when you actually run a promotion.
 *   currency  ISO 4217
 *   category  must match a `categories` id below
 *   badge     optional flag chip ("New", "Best seller", ...)
 *   colors    [{ id, name, hex, pattern?, image, hover }] -- the swatch row.
 *             Each carries its own photography, so clicking a swatch swaps the
 *             card image without a page load.
 *   sizes     [{ id, label, available }] -- `available:false` renders sold out
 *   details   bullets shown in quick view
 *
 * A variant in a real store is the (colour x size) pair. `variantId()` builds a
 * deterministic key for that pair; point it at your processor's real variant
 * ids when you wire up checkout.
 */
(function () {
  'use strict';

  var P = 'assets/img/product/';

  /* The five colourways, each with its own photography. Shared by every card
     so the swatch row always shows the full range.
     `model` is the slot for on-body photography: set it to an image path and
     the outfit selector shows that instead of the flat-lay. */
  var COLORWAYS = [
    { id: 'pink-sugar', name: 'Pink Sugar',  hex: '#F5C4D3',
      image: P + 'set-pink-sugar.webp', hover: P + 'set-pink-sugar-detail.webp',
      model: null },
    { id: 'pink-polka', name: 'Pink Polka',  hex: '#F5C4D3', pattern: 'polka',
      image: P + 'set-pink-polka.webp', hover: P + 'set-pink-polka-detail.webp',
      model: null },
    { id: 'jet-polka',  name: 'Jet Polka',   hex: '#141011', pattern: 'polka',
      image: P + 'set-jet-polka.webp',  hover: P + 'set-jet-polka-detail.webp',
      model: null },
    { id: 'leopard',    name: 'Leopard',     hex: '#B98047', pattern: 'leopard',
      image: P + 'set-leopard.webp',    hover: P + 'set-leopard-detail.webp',
      model: null }
  ];

  /* Product categories. Only one is stocked today, so the filter row hides
     itself — add a second category and it reappears with no code change. */
  var categories = [
    { id: 'sets', label: 'Sets' }
  ];

  /* The editorial rail above the grid. Not a filter — these are the three
     pieces the set is made of, shot as detail crops. */
  var pieces = [
    { id: 'hoodie', label: 'The Hoodie', image: 'assets/img/piece/hoodie.webp',
      blurb: 'Cropped, two-way zip' },
    { id: 'halter', label: 'The Halter', image: 'assets/img/piece/halter.webp',
      blurb: 'Ruched, self-tie neck' },
    { id: 'flare',  label: 'The Flare',  image: 'assets/img/piece/flare.webp',
      blurb: 'Fold-over, monogrammed' }
  ];

  /* Real Shopify variant IDs, product -> size -> numeric id. Only Pink Sugar
     is live in Shopify so far; add a colourway here as it's created in the
     store. When a size has an id, checkout() in site.js can build a real
     Shopify cart permalink for it instead of just opening the storefront. */
  var SHOPIFY_VARIANTS = {
    'pink-sugar': {
      xs: '47859640762499', s: '47859640795267', m: '47859640828035',
      l: '47859640860803', xl: '47859640893571'
    }
  };

  var SIZES = function (soldOut, shopifyIds) {
    soldOut = soldOut || [];
    return ['XS', 'S', 'M', 'L', 'XL'].map(function (s) {
      var id = s.toLowerCase();
      return {
        id: id, label: s, available: soldOut.indexOf(s) === -1,
        shopifyVariantId: (shopifyIds && shopifyIds[id]) || null
      };
    });
  };

  var DETAILS = [
    'Cropped zip hoodie, ruched halter bodice and fold-over flare pant',
    'Brushed rib jersey — soft, stretchy, holds its shape',
    'PH monogram embroidered at the waistband',
    'Two-way silver zip with a knotted drawcord hood',
    'Sold as a three-piece set'
  ];

  /* One SKU per colourway, which is how they are actually stocked. */
  var SPEC = [
    ['pink-sugar', 'Signature',   []],
    ['pink-polka', 'New',         ['XS']],
    ['jet-polka',  null,          []],
    ['leopard',    'Best seller', ['XS', 'S']]
  ];

  var products = SPEC.map(function (row, i) {
    var colorId = row[0];
    var color = COLORWAYS.filter(function (c) { return c.id === colorId; })[0];
    return {
      id: 'ph-set-' + colorId,
      sku: 'PH-SET-' + String(i + 1).padStart(3, '0'),
      handle: 'the-ph-set-' + colorId,
      name: 'The PH Set, Three-Piece',
      colorId: colorId,
      colorName: color.name,
      price: 8000,
      compareAt: null,
      currency: 'USD',
      category: 'sets',
      badge: row[1],
      colors: COLORWAYS,
      sizes: SIZES(row[2], SHOPIFY_VARIANTS[colorId]),
      images: { primary: color.image, hover: color.hover,
                gallery: [color.image, color.hover] },
      details: DETAILS
    };
  });

  window.PH = window.PH || {};

  /* Your Shopify store. checkout() in site.js opens this to hand off the
     purchase — see the comment there for how to upgrade to a real prefilled
     cart once products exist in Shopify. */
  window.PH.SHOPIFY_DOMAIN = 'shopatpinkhouse.myshopify.com';

  window.PH.catalog = {
    categories: categories,
    pieces: pieces,
    products: products
  };

  /* Deterministic variant key for a (product, colour, size) pair.
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
