/* ShopAtPinkHouse — site behaviour
 * ---------------------------------------------------------------------------
 * Rendering (categories, product grid, quick view) plus the small amount of
 * interaction the preview needs. No build step, no dependencies.
 *
 * COMMERCE BOUNDARY
 * `Bag` below is a real in-memory line-item model: add, change quantity,
 * remove, subtotal. That is deliberate — it is the part a storefront needs
 * regardless of who processes the payment. What it does NOT do is check out.
 * `Bag.checkout()` is the single seam: point it at Stripe Checkout, the
 * Shopify cart API, or your own /checkout route and the rest of the page
 * keeps working untouched.
 */
(function () {
  'use strict';

  var catalog = window.PH.catalog;
  var fmt = window.PH.formatPrice;
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  /* ======================================================================
     RENDER — categories
     ====================================================================== */
  /* The rail above the grid: the three pieces the set is made of, as detail
     crops. Editorial, not a filter. */
  function renderPieces() {
    var host = $('[data-pieces]');
    if (!host) return;
    host.innerHTML = catalog.pieces.map(function (c) {
      return '' +
        '<a class="cat" href="#shop">' +
          '<img src="' + c.image + '" alt="' + c.label + '" ' +
            'data-slot="piece-' + c.id + '" width="900" height="1200" loading="lazy">' +
          '<span class="cat__label">' +
            '<strong>' + c.label + '</strong>' +
            '<span>' + c.blurb + '</span>' +
          '</span>' +
        '</a>';
    }).join('');
  }


  /* ======================================================================
     PIXEL LETTERING
     A 5x7 bitmap font drawn as SVG rects. The arcade banner needs a real
     pixel face and the CSP blocks font CDNs, so the letterforms ship as
     data rather than as a download.
     ====================================================================== */
  var PIXEL_FONT = {
    A: '01110,10001,10001,11111,10001,10001,10001',
    B: '11110,10001,10001,11110,10001,10001,11110',
    C: '01110,10001,10000,10000,10000,10001,01110',
    D: '11110,10001,10001,10001,10001,10001,11110',
    E: '11111,10000,10000,11110,10000,10000,11111',
    F: '11111,10000,10000,11110,10000,10000,10000',
    G: '01110,10001,10000,10111,10001,10001,01111',
    H: '10001,10001,10001,11111,10001,10001,10001',
    I: '11111,00100,00100,00100,00100,00100,11111',
    J: '00111,00010,00010,00010,00010,10010,01100',
    K: '10001,10010,10100,11000,10100,10010,10001',
    L: '10000,10000,10000,10000,10000,10000,11111',
    M: '10001,11011,10101,10101,10001,10001,10001',
    N: '10001,11001,10101,10011,10001,10001,10001',
    O: '01110,10001,10001,10001,10001,10001,01110',
    P: '11110,10001,10001,11110,10000,10000,10000',
    Q: '01110,10001,10001,10001,10101,10010,01101',
    R: '11110,10001,10001,11110,10100,10010,10001',
    S: '01111,10000,10000,01110,00001,00001,11110',
    T: '11111,00100,00100,00100,00100,00100,00100',
    U: '10001,10001,10001,10001,10001,10001,01110',
    V: '10001,10001,10001,10001,10001,01010,00100',
    W: '10001,10001,10001,10101,10101,11011,10001',
    X: '10001,10001,01010,00100,01010,10001,10001',
    Y: '10001,10001,01010,00100,00100,00100,00100',
    Z: '11111,00001,00010,00100,01000,10000,11111'
  };

  function pixelSvg(text) {
    var GAP = 1, SPACE = 3, H = 7;
    var glyphs = [], x = 0, i, ch, rows;

    for (i = 0; i < text.length; i++) {
      ch = text.charAt(i).toUpperCase();
      if (ch === ' ') { x += SPACE + GAP; continue; }
      rows = PIXEL_FONT[ch];
      if (!rows) { x += SPACE + GAP; continue; }
      glyphs.push({ x: x, rows: rows.split(',') });
      x += 5 + GAP;
    }
    var W = Math.max(x - GAP, 1);

    function layer(dx, dy, fill) {
      var out = '<g transform="translate(' + dx + ',' + dy + ')" fill="' + fill + '">';
      glyphs.forEach(function (g) {
        g.rows.forEach(function (row, ry) {
          for (var rx = 0; rx < row.length; rx++) {
            if (row.charAt(rx) === '1') {
              out += '<rect x="' + (g.x + rx) + '" y="' + ry + '" width="1" height="1"/>';
            }
          }
        });
      });
      return out + '</g>';
    }

    // stepped shadow underneath, gradient fill on top — the arcade bevel
    return '<svg class="pixel__svg" viewBox="-1 -1 ' + (W + 3) + ' ' + (H + 3) +
      '" shape-rendering="crispEdges" role="img" aria-hidden="true">' +
      '<defs><linearGradient id="pxg" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#FFFFFF"/>' +
        '<stop offset=".55" stop-color="#FDEAF2"/>' +
        '<stop offset="1" stop-color="#F5A9C8"/>' +
      '</linearGradient></defs>' +
      layer(2, 2, '#B62E63') +
      layer(1, 1, '#E9508D') +
      layer(0, 0, 'url(#pxg)') +
      '</svg>';
  }

  function renderPixelHeadings() {
    $$('[data-pixel]').forEach(function (el) {
      el.insertAdjacentHTML('beforeend', pixelSvg(el.getAttribute('data-pixel')));
    });
  }

  /* ======================================================================
     DRESSING ROOM — outfit selector
     Reads the same catalog as the grid: one look per colourway.
     ====================================================================== */
  var looks = [];
  var lookIndex = 0;

  function buildLooks() {
    // one entry per product, since each product is a colourway of the set
    looks = catalog.products.map(function (p) {
      var c = p.colors.filter(function (x) { return x.id === p.colorId; })[0] || p.colors[0];
      return { product: p, color: c };
    });
  }

  function renderLooks() {
    var host = $('[data-looks]');
    if (!host) return;
    host.innerHTML = looks.map(function (l, i) {
      return '' +
        '<button class="look" type="button" data-look="' + i + '"' +
          ' data-name="' + l.color.name.toLowerCase() + '"' +
          ' aria-pressed="' + (i === lookIndex) + '">' +
          '<span class="look__frame">' +
            '<img src="' + l.product.images.primary + '" alt="" loading="lazy">' +
          '</span>' +
          '<span class="look__name">' + l.color.name + '</span>' +
        '</button>';
    }).join('') +
    '<a class="look look--all" href="#shop">' +
      '<span class="look__frame look__frame--all">' +
        '<svg viewBox="0 0 100 62" aria-hidden="true"><use href="#i-bow"/></svg>' +
      '</span>' +
      '<span class="look__name">View all</span>' +
    '</a>';
  }

  function renderStage() {
    var l = looks[lookIndex];
    if (!l) return;
    // on-body photography when a colourway has it, the flat-lay otherwise
    var img = $('[data-stage-img]');
    img.src = l.color.model || l.product.images.primary;
    img.alt = l.product.name + ' in ' + l.color.name;

    $('[data-stage-meta]').innerHTML =
      '<p class="stage__name">' + l.product.name + '</p>' +
      '<p class="stage__color">' + l.color.name + '</p>' +
      '<p class="stage__price">' + fmt(l.product.price, l.product.currency) + '</p>' +
      '<button class="btn btn--pink" type="button" data-action="quick-view" ' +
        'data-product-id="' + l.product.id + '">Shop this look</button>';

    $$('[data-look]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(Number(b.getAttribute('data-look')) === lookIndex));
    });

    // re-trigger the dress-in animation
    var screen = $('.stage__screen');
    screen.classList.remove('is-swapping');
    void screen.offsetWidth;
    screen.classList.add('is-swapping');
  }

  function stepLook(delta) {
    lookIndex = (lookIndex + delta + looks.length) % looks.length;
    renderStage();
  }

  function filterLooks(term) {
    term = (term || '').trim().toLowerCase();
    var shown = 0;
    $$('[data-look]').forEach(function (b) {
      var match = !term || b.getAttribute('data-name').indexOf(term) !== -1;
      b.hidden = !match;
      if (match) shown++;
    });
    var none = $('[data-looks-none]');
    if (none) none.hidden = !(term && shown === 0);
  }

  /* ======================================================================
     RENDER — product cards
     ====================================================================== */
  function swatchMarkup(color, selectedId) {
    return '<button class="swatch" type="button"' +
      ' style="background-color:' + color.hex + '"' +
      (color.pattern ? ' data-pattern="' + color.pattern + '"' : '') +
      ' data-color="' + color.id + '"' +
      ' data-image="' + color.image + '" data-hover="' + color.hover + '"' +
      ' aria-pressed="' + (color.id === selectedId) + '"' +
      ' aria-label="' + color.name + '"></button>';
  }

  function priceMarkup(p) {
    if (p.compareAt && p.compareAt > p.price) {
      return '<span class="card__now--sale">' + fmt(p.price, p.currency) + '</span>' +
             '<span class="card__was">' + fmt(p.compareAt, p.currency) + '</span>';
    }
    return '<span>' + fmt(p.price, p.currency) + '</span>';
  }

  function cardMarkup(p) {
    return '' +
      '<article class="card" data-product-id="' + p.id + '" data-category="' + p.category + '">' +
        '<div class="card__media">' +
          '<img class="card__main" src="' + p.images.primary + '" alt="' + p.name + '" ' +
            'data-slot="product-' + p.handle + '" width="1080" height="1440" loading="lazy">' +
          '<img class="card__hover" src="' + p.images.hover + '" alt="" aria-hidden="true" ' +
            'width="1080" height="1440" loading="lazy">' +
          (p.badge ? '<span class="card__badge" data-badge="' + p.badge + '">' + p.badge + '</span>' : '') +
          '<button class="card__wish" type="button" aria-pressed="false" ' +
            'aria-label="Save ' + p.name + '"><svg><use href="#i-heart"/></svg></button>' +
          '<button class="card__quick" type="button" data-action="quick-view" ' +
            'data-product-id="' + p.id + '">Quick view</button>' +
        '</div>' +
        '<div class="card__body">' +
          '<h3 class="card__name">' + p.name + '</h3>' +
          '<p class="card__color" data-card-color>' + p.colorName + '</p>' +
          '<p class="card__price">' + priceMarkup(p) + '</p>' +
          '<div class="swatches">' +
            p.colors.map(function (c) { return swatchMarkup(c, p.colorId); }).join('') +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function renderGrid() {
    var host = $('[data-grid]');
    if (!host) return;
    host.innerHTML = catalog.products.map(cardMarkup).join('') +
      '<p class="grid__empty" data-grid-empty hidden>Nothing in this category yet.</p>';
  }

  /* ======================================================================
     FILTERS
     ====================================================================== */
  function renderFilters() {
    var host = $('[data-filters]');
    if (!host) return;
    var used = catalog.categories.filter(function (c) {
      return catalog.products.some(function (p) { return p.category === c.id; });
    });
    // Nothing to filter between until a second category is stocked.
    if (used.length < 2) { host.hidden = true; return; }
    host.hidden = false;
    host.innerHTML =
      '<button type="button" data-filter="all" aria-pressed="true">All</button>' +
      used.map(function (c) {
        return '<button type="button" data-filter="' + c.id + '" aria-pressed="false">' +
               c.label + '</button>';
      }).join('');

    $$('[data-filter]', host).forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyFilter(btn.getAttribute('data-filter'));
      });
    });
  }

  function applyFilter(id) {
    $$('[data-filter]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-filter') === id));
    });
    var visible = 0;
    $$('.card').forEach(function (card) {
      var match = id === 'all' || card.getAttribute('data-category') === id;
      card.classList.toggle('is-hidden', !match);
      if (match) visible++;
    });
    var empty = $('[data-grid-empty]');
    if (empty) empty.hidden = visible !== 0;
  }

  /* ======================================================================
     BAG — line-item model. Stops short of payment on purpose.
     ====================================================================== */
  var Bag = {
    lines: [],

    add: function (product, colorId, sizeId, qty) {
      qty = qty || 1;
      var variant = window.PH.variantId(product, colorId, sizeId);
      var color = product.colors.filter(function (c) { return c.id === colorId; })[0]
                  || product.colors[0];
      var size = product.sizes.filter(function (s) { return s.id === sizeId; })[0];
      var line = this.lines.filter(function (l) { return l.variant === variant; })[0];
      if (line) {
        line.qty += qty;
      } else {
        this.lines.push({
          variant: variant,
          productId: product.id,
          sku: product.sku,
          name: product.name,
          price: product.price,
          currency: product.currency,
          image: color.image,
          colorId: colorId,
          colorName: color.name,
          sizeId: sizeId,
          sizeLabel: (sizeId || '').toUpperCase(),
          shopifyVariantId: size && size.shopifyVariantId,
          qty: qty
        });
      }
      this.changed();
    },

    setQty: function (variant, qty) {
      this.lines = this.lines.reduce(function (acc, l) {
        if (l.variant === variant) {
          if (qty > 0) { l.qty = qty; acc.push(l); }
        } else { acc.push(l); }
        return acc;
      }, []);
      this.changed();
    },

    remove: function (variant) { this.setQty(variant, 0); },

    count: function () {
      return this.lines.reduce(function (n, l) { return n + l.qty; }, 0);
    },

    subtotal: function () {
      return this.lines.reduce(function (n, l) { return n + l.price * l.qty; }, 0);
    },

    /* ---- THE SEAM -------------------------------------------------------
       Hands off to the real Shopify store. When every line in the bag has a
       real Shopify variant id (set in catalog.js as sizes[].shopifyVariantId,
       via SHOPIFY_VARIANTS), this builds a cart permalink that lands the
       shopper on Shopify with those exact items already in their cart:
         https://{domain}/cart/{variantId}:{qty},{variantId}:{qty}
       A line without a variant id (its colourway isn't in Shopify yet) can't
       be added that way, so it falls back to just opening the storefront. */
    checkout: function () {
      var domain = window.PH.SHOPIFY_DOMAIN;
      var allLinked = this.lines.length > 0 &&
        this.lines.every(function (l) { return l.shopifyVariantId; });
      var url;
      if (allLinked) {
        var parts = this.lines.map(function (l) {
          return l.shopifyVariantId + ':' + l.qty;
        });
        url = 'https://' + domain + '/cart/' + parts.join(',');
      } else {
        if (this.lines.length) toast('Some items aren’t in the store yet — opening the shop');
        url = 'https://' + domain;
      }
      // A popup blocker can silently swallow window.open even on a genuine
      // click — it returns null/undefined rather than throwing. Fall back to
      // navigating the current tab so "Checkout" never does nothing.
      var win = window.open(url, '_blank', 'noopener');
      if (!win) location.assign(url);
    },

    changed: function () {
      document.dispatchEvent(new CustomEvent('bag:change', { detail: { bag: this } }));
    }
  };
  window.PH.bag = Bag;

  function renderBag() {
    var body = $('[data-bag-body]');
    var count = Bag.count();

    $('[data-bag-count]').textContent = String(count);
    $('[data-bag-head]').textContent = count ? '(' + count + ')' : '';
    $('[data-bag-subtotal]').textContent = fmt(Bag.subtotal(), 'USD');
    $('[data-checkout]').disabled = count === 0;

    if (!count) {
      body.innerHTML =
        '<div class="bag-empty">' +
          '<svg class="decal" viewBox="0 0 100 62"><use href="#i-bow"/></svg>' +
          '<p>Your bag is empty.</p>' +
          '<a class="tlink" href="#shop" data-close-bag>Start shopping</a>' +
        '</div>';
      return;
    }

    body.innerHTML = Bag.lines.map(function (l) {
      return '' +
        '<div class="bag-line" data-variant="' + l.variant + '">' +
          '<img src="' + l.image + '" alt="">' +
          '<div class="bag-line__meta">' +
            '<span class="bag-line__name">' + l.name + '</span>' +
            '<span class="bag-line__opt">' + l.colorName + ' · Size ' + l.sizeLabel + '</span>' +
            '<span class="bag-line__opt">' + fmt(l.price, l.currency) + '</span>' +
            '<div class="bag-line__row">' +
              '<span class="qty">' +
                '<button type="button" data-qty="-1" aria-label="Decrease quantity">' +
                  '<svg width="14" height="14"><use href="#i-minus"/></svg></button>' +
                '<span>' + l.qty + '</span>' +
                '<button type="button" data-qty="1" aria-label="Increase quantity">' +
                  '<svg width="14" height="14"><use href="#i-plus"/></svg></button>' +
              '</span>' +
              '<button class="bag-line__remove" type="button" data-remove>Remove</button>' +
            '</div>' +
          '</div>' +
        '</div>';
    }).join('');
  }

  /* ======================================================================
     QUICK VIEW  — the product detail layout
     ====================================================================== */
  var qvState = { product: null, color: null, size: null, image: 0 };

  function openQuickView(productId, colorId) {
    var p = catalog.products.filter(function (x) { return x.id === productId; })[0];
    if (!p) return;
    qvState = {
      product: p,
      color: colorId || p.colorId,
      size: (p.sizes.filter(function (s) { return s.available; })[0] || {}).id || null,
      image: 0
    };
    renderQuickView();
    openOverlay($('[data-quickview]'));
  }

  function renderQuickView() {
    var p = qvState.product;
    if (!p) return;
    // Gallery follows the selected colourway, since each carries its own shots.
    var color = p.colors.filter(function (c) { return c.id === qvState.color; })[0] || p.colors[0];
    var gallery = [color.image, color.hover];
    var colorName = color.name;
    if (qvState.image >= gallery.length) qvState.image = 0;

    $('[data-quickview-panel]').innerHTML = '' +
      '<button class="quickview__close" type="button" data-close-quickview aria-label="Close">' +
        '<svg width="22" height="22"><use href="#i-close"/></svg></button>' +

      '<div class="qv__media">' +
        '<div class="qv__hero"><img src="' + gallery[qvState.image] + '" alt="' + p.name + '"></div>' +
        (gallery.length > 1 ? '<div class="qv__thumbs">' + gallery.map(function (src, i) {
          return '<button type="button" data-thumb="' + i + '" aria-pressed="' +
                 (i === qvState.image) + '" aria-label="View image ' + (i + 1) + '">' +
                 '<img src="' + src + '" alt=""></button>';
        }).join('') + '</div>' : '') +
      '</div>' +

      '<div class="qv__info">' +
        '<p class="eyebrow"><svg class="decal"><use href="#i-star"/></svg> ' + p.sku + '</p>' +
        '<h2 class="qv__name">' + p.name + '</h2>' +
        '<p class="qv__price">' + priceMarkup(p) + '</p>' +

        '<div class="qv__group">' +
          '<span class="qv__glabel">Colour: <b>' + colorName + '</b></span>' +
          '<div class="qv__swatches">' + p.colors.map(function (c) {
            return '<button class="swatch" type="button" style="background-color:' + c.hex + '"' +
              (c.pattern ? ' data-pattern="' + c.pattern + '"' : '') +
              ' data-qv-color="' + c.id + '" aria-pressed="' + (c.id === qvState.color) + '"' +
              ' aria-label="' + c.name + '"></button>';
          }).join('') + '</div>' +
        '</div>' +

        '<div class="qv__group">' +
          '<span class="qv__glabel">Size</span>' +
          '<div class="sizes">' + p.sizes.map(function (s) {
            return '<button type="button" data-qv-size="' + s.id + '"' +
              (s.available ? '' : ' disabled') +
              ' aria-pressed="' + (s.id === qvState.size) + '">' + s.label + '</button>';
          }).join('') + '</div>' +
        '</div>' +

        '<button class="btn btn--block" type="button" data-action="add-to-bag"' +
          ' data-product-id="' + p.id + '">Add to bag</button>' +

        '<ul class="qv__details">' + p.details.map(function (d) {
          return '<li>' + d + '</li>';
        }).join('') + '</ul>' +

        '<p class="qv__note">Free shipping over $125 · 30-day returns</p>' +
      '</div>';
  }

  /* ======================================================================
     OVERLAY PLUMBING — scrim, focus handling, escape
     ====================================================================== */
  var openPanel = null;
  var lastFocus = null;

  function openOverlay(el) {
    lastFocus = document.activeElement;
    openPanel = el;
    el.classList.add('is-open');
    el.setAttribute('aria-hidden', 'false');
    $('[data-scrim]').classList.add('is-open');
    document.body.style.overflow = 'hidden';
    var focusable = el.querySelector('button, a[href], input');
    if (focusable) focusable.focus();
  }

  function closeOverlay() {
    if (!openPanel) return;
    openPanel.classList.remove('is-open');
    openPanel.setAttribute('aria-hidden', 'true');
    openPanel = null;
    $('[data-scrim]').classList.remove('is-open');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* Keep tab focus inside whatever panel is open. */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeOverlay(); return; }
    if (e.key !== 'Tab' || !openPanel) return;
    var items = $$('button, a[href], input, [tabindex]:not([tabindex="-1"])', openPanel)
      .filter(function (el) { return !el.disabled && el.offsetParent !== null; });
    if (!items.length) return;
    var first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ======================================================================
     TOAST
     ====================================================================== */
  var toastTimer;
  function toast(msg) {
    var el = $('[data-toast]');
    el.innerHTML = '<svg class="decal"><use href="#i-heart"/></svg>' + msg;
    el.classList.add('is-open');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-open'); }, 2800);
  }

  /* ======================================================================
     EVENT DELEGATION — one listener for the whole page
     ====================================================================== */
  document.addEventListener('click', function (e) {
    var t = e.target;
    var hit = function (sel) { return t.closest(sel); };
    var el;

    /* --- overlays --- */
    if (hit('[data-open-bag]')) { renderBag(); openOverlay($('#bag')); return; }
    if (hit('[data-close-bag]') || hit('[data-close-quickview]') || hit('[data-scrim]')) {
      closeOverlay(); return;
    }
    if (hit('[data-open-nav]')) { openOverlay($('#mobile-nav')); return; }
    if (hit('[data-close-nav]')) { closeOverlay(); return; }

    /* --- dressing room --- */
    if ((el = hit('[data-look-step]'))) {
      stepLook(Number(el.getAttribute('data-look-step'))); return;
    }
    if ((el = hit('[data-look]'))) {
      lookIndex = Number(el.getAttribute('data-look')); renderStage(); return;
    }

    /* --- quick view --- */
    if ((el = hit('[data-action="quick-view"]'))) {
      // open on whichever colourway the card is showing; the stage button
      // lives outside the grid, so fall back to the product's own default
      var fromCard = el.closest('.card');
      openQuickView(el.getAttribute('data-product-id'),
                    fromCard && fromCard.getAttribute('data-color'));
      return;
    }
    if ((el = hit('[data-thumb]'))) {
      qvState.image = Number(el.getAttribute('data-thumb')); renderQuickView(); return;
    }
    if ((el = hit('[data-qv-color]'))) {
      qvState.color = el.getAttribute('data-qv-color'); renderQuickView(); return;
    }
    if ((el = hit('[data-qv-size]'))) {
      qvState.size = el.getAttribute('data-qv-size'); renderQuickView(); return;
    }

    /* --- add to bag --- */
    if ((el = hit('[data-action="add-to-bag"]'))) {
      var p = qvState.product;
      if (!p) return;
      if (!qvState.size) { toast('Choose a size first'); return; }
      Bag.add(p, qvState.color, qvState.size);
      closeOverlay();
      toast('Added to your bag');
      return;
    }

    /* --- bag line controls --- */
    if ((el = hit('[data-qty]'))) {
      var lineEl = el.closest('[data-variant]');
      var v = lineEl.getAttribute('data-variant');
      var line = Bag.lines.filter(function (l) { return l.variant === v; })[0];
      if (line) Bag.setQty(v, line.qty + Number(el.getAttribute('data-qty')));
      return;
    }
    if ((el = hit('[data-remove]'))) {
      Bag.remove(el.closest('[data-variant]').getAttribute('data-variant')); return;
    }
    if (hit('[data-checkout]')) { Bag.checkout(); return; }

    /* --- card swatches: swap the card's photography to that colourway --- */
    if ((el = hit('.card .swatch'))) {
      var card = el.closest('.card');
      $$('.swatch', el.closest('.swatches')).forEach(function (s) {
        s.setAttribute('aria-pressed', String(s === el));
      });
      $('.card__main', card).src = el.getAttribute('data-image');
      $('.card__hover', card).src = el.getAttribute('data-hover');
      $('[data-card-color]', card).textContent = el.getAttribute('aria-label');
      // keep quick view in step with what the shopper is looking at
      card.setAttribute('data-color', el.getAttribute('data-color'));
      return;
    }

    /* --- wishlist --- */
    if ((el = hit('.card__wish'))) {
      var on = el.getAttribute('aria-pressed') === 'true';
      el.setAttribute('aria-pressed', String(!on));
      toast(on ? 'Removed from saved' : 'Saved for later');
      return;
    }
  });

  document.addEventListener('bag:change', renderBag);

  var lookSearch = $('[data-look-search]');
  if (lookSearch) {
    lookSearch.addEventListener('input', function () { filterLooks(lookSearch.value); });
  }

  /* ======================================================================
     NEWSLETTER
     ====================================================================== */
  var form = $('[data-signup]');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = $('#email');
      var note = $('[data-signup-note]');
      var ok = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(input.value.trim());
      // Front end only. Point this at your ESP (Klaviyo, Mailchimp) to go live.
      note.textContent = ok
        ? 'You’re on the list. Check your inbox to confirm.'
        : 'That email doesn’t look right — check and try again.';
      if (ok) { form.reset(); }
    });
  }

  /* ======================================================================
     ANNOUNCEMENT ROTATION
     ====================================================================== */
  var items = $$('.announce__item');
  if (items.length > 1 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var idx = 0;
    setInterval(function () {
      items[idx].classList.remove('is-active');
      idx = (idx + 1) % items.length;
      items[idx].classList.add('is-active');
    }, 4200);
  }

  /* ======================================================================
     MARQUEE — duplicate the group so the loop is seamless
     ====================================================================== */
  var track = $('[data-marquee]');
  if (track) {
    var group = track.firstElementChild;
    for (var i = 0; i < 3; i++) {
      var clone = group.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    }
  }

  /* ======================================================================
     SCROLL REVEAL
     ====================================================================== */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    $$('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    $$('.reveal').forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ======================================================================
     BOOT
     ====================================================================== */
  renderPixelHeadings();
  buildLooks();
  renderLooks();
  renderStage();
  renderPieces();
  renderFilters();
  renderGrid();
  renderBag();
  $('[data-year]').textContent = new Date().getFullYear();
})();
