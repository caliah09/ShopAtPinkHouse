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
  function renderCategories() {
    var host = $('[data-categories]');
    if (!host) return;
    host.innerHTML = catalog.categories.map(function (c) {
      return '' +
        '<a class="cat" href="#shop" data-category-link="' + c.id + '">' +
          '<img src="' + c.image + '" alt="" data-slot="category-' + c.id + '" ' +
            'width="900" height="1200" loading="lazy">' +
          '<span class="cat__label">' +
            '<strong>' + c.label + '</strong>' +
            '<span>' + c.blurb + '</span>' +
          '</span>' +
        '</a>';
    }).join('');

    // Clicking a category card scrolls to the grid with that filter applied.
    $$('[data-category-link]', host).forEach(function (el) {
      el.addEventListener('click', function () {
        applyFilter(el.getAttribute('data-category-link'));
      });
    });
  }

  /* ======================================================================
     RENDER — product cards
     ====================================================================== */
  function swatchMarkup(color, i) {
    return '<button class="swatch" type="button"' +
      ' style="background-color:' + color.hex + '"' +
      (color.pattern ? ' data-pattern="' + color.pattern + '"' : '') +
      ' data-color="' + color.id + '"' +
      ' aria-pressed="' + (i === 0 ? 'true' : 'false') + '"' +
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
    var shown = p.colors.slice(0, 4);
    var extra = p.colors.length - shown.length;
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
          '<p class="card__price">' + priceMarkup(p) + '</p>' +
          '<div class="swatches">' +
            shown.map(swatchMarkup).join('') +
            (extra > 0 ? '<span class="swatch__more">+' + extra + '</span>' : '') +
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
          image: product.images.primary,
          colorId: colorId,
          colorName: (product.colors.filter(function (c) { return c.id === colorId; })[0] || {}).name,
          sizeId: sizeId,
          sizeLabel: (sizeId || '').toUpperCase(),
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
       Replace the body with a real handoff, e.g.
         fetch('/api/checkout', { method:'POST', body: JSON.stringify(Bag.lines) })
           .then(r => r.json()).then(({ url }) => location.assign(url));
       Line items already carry sku, variant, qty and integer-cent prices,
       which is exactly what Stripe Checkout and the Shopify Cart API expect. */
    checkout: function () {
      toast('Checkout isn’t connected yet');
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

  function openQuickView(productId) {
    var p = catalog.products.filter(function (x) { return x.id === productId; })[0];
    if (!p) return;
    qvState = {
      product: p,
      color: p.colors[0].id,
      size: (p.sizes.filter(function (s) { return s.available; })[0] || {}).id || null,
      image: 0
    };
    renderQuickView();
    openOverlay($('[data-quickview]'));
  }

  function renderQuickView() {
    var p = qvState.product;
    if (!p) return;
    var gallery = p.images.gallery && p.images.gallery.length
      ? p.images.gallery : [p.images.primary];
    var colorName = (p.colors.filter(function (c) { return c.id === qvState.color; })[0] || {}).name || '';

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

    /* --- quick view --- */
    if ((el = hit('[data-action="quick-view"]'))) {
      openQuickView(el.getAttribute('data-product-id')); return;
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

    /* --- card swatches (preview only: marks the selection) --- */
    if ((el = hit('.card .swatch'))) {
      $$('.swatch', el.closest('.swatches')).forEach(function (s) {
        s.setAttribute('aria-pressed', String(s === el));
      });
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
  renderCategories();
  renderFilters();
  renderGrid();
  renderBag();
  $('[data-year]').textContent = new Date().getFullYear();
})();
