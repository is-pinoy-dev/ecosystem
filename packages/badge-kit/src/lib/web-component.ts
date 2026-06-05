// ─── Interactive HTML badge web component ────────────────────────────────────
//
// Served verbatim at GET /badge.js. Defines <is-pinoy-badge>, a Shadow-DOM
// isolated custom element for real HTML pages (portfolios, docs, footers) where
// hover, animation, and pointer interaction are available — unlike the static
// SVG endpoints used in GitHub READMEs.
//
// Two effects beyond the static badge:
//   • tilt   — an "ID card" 3D tilt that rotates toward the cursor, with a
//              pointer-tracking glare highlight (holographic feel).
//   • shimmer — a configurable diagonal light sweep (off | sweep | loop | always).
//
// Authored as a plain string (no backticks, no ${} inside) so it can be embedded
// in this TS template literal and shipped to the browser without a build step.

export const WEB_COMPONENT_VERSION = '0.1.0'

export const WEB_COMPONENT_JS = `(function () {
  'use strict';
  if (typeof window === 'undefined' || window.customElements == null) return;
  if (window.customElements.get('is-pinoy-badge')) return;

  var FONTS = "@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Press+Start+2P&display=swap');";

  // Palettes mirror packages/badge-kit/src/lib/svg.ts so the HTML badge matches
  // the rendered SVG colors exactly.
  var PALETTES = {
    subdomain: {
      dark:     { bg: '#0D0D0D', bd: '#F5C800', sun: '#F5C800', lbl: '#666',    val: '#F5C800', sfx: '#777',    sh: 'rgba(245,200,0,0.2)' },
      gold:     { bg: '#F5C800', bd: '#0D0D0D', sun: '#0D0D0D', lbl: '#7a6000', val: '#0D0D0D', sfx: '#9a8020', sh: '#0D0D0D' },
      light:    { bg: '#FAFAF5', bd: '#0D0D0D', sun: '#F5C800', lbl: '#999',    val: '#0D0D0D', sfx: '#bbb',    sh: 'rgba(0,0,0,0.12)' },
      outlined: { bg: 'transparent', bd: '#F5C800', sun: '#F5C800', lbl: '#666', val: '#F5C800', sfx: '#777',   sh: null }
    },
    member: {
      dark:     { bg: '#0D0D0D', bd: '#333',    sun: '#F5C800', brand: '#F5C800', divider: '#222',            handle: '#777',    sh: '#333' },
      gold:     { bg: '#F5C800', bd: '#0D0D0D', sun: '#0D0D0D', brand: '#0D0D0D', divider: 'rgba(0,0,0,0.2)', handle: '#7a6000', sh: '#0D0D0D' },
      light:    { bg: '#FAFAF5', bd: '#0D0D0D', sun: '#F5C800', brand: '#0D0D0D', divider: '#ddd',            handle: '#555',    sh: 'rgba(0,0,0,0.12)' },
      outlined: { bg: 'transparent', bd: '#F5C800', sun: '#F5C800', brand: '#F5C800', divider: '#333',        handle: '#888',    sh: null }
    },
    'pinoy-made': {
      dark:     { bg: '#0D0D0D', bd: '#333',    sun: '#F5C800', text: '#FAFAF5', sh: '#333' },
      gold:     { bg: '#F5C800', bd: '#0D0D0D', sun: '#0D0D0D', text: '#0D0D0D', sh: '#0D0D0D' },
      light:    { bg: '#FAFAF5', bd: '#0D0D0D', sun: '#F5C800', text: '#0D0D0D', sh: 'rgba(0,0,0,0.12)' },
      outlined: { bg: 'transparent', bd: '#F5C800', sun: '#F5C800', text: '#F5C800', sh: null }
    },
    certified: {
      dark:     { bg: '#0D0D0D', bd: '#F5C800', sun: '#F5C800', eyebrow: '#555',    main: '#F5C800', sh: 'rgba(245,200,0,0.2)' },
      gold:     { bg: '#F5C800', bd: '#0D0D0D', sun: '#0D0D0D', eyebrow: '#7a6000', main: '#0D0D0D', sh: '#0D0D0D' },
      light:    { bg: '#FAFAF5', bd: '#0D0D0D', sun: '#F5C800', eyebrow: '#999',    main: '#0D0D0D', sh: 'rgba(0,0,0,0.12)' },
      outlined: { bg: 'transparent', bd: '#F5C800', sun: '#F5C800', eyebrow: '#666', main: '#F5C800', sh: null }
    }
  };

  var DEFAULT_THEME = { subdomain: 'dark', member: 'dark', 'pinoy-made': 'dark', certified: 'gold' };
  var TYPE_ALIASES = { 'deployed-on': 'subdomain', 'subdomain': 'subdomain', 'member': 'member', 'pinoy-made': 'pinoy-made', 'certified': 'certified' };
  var SHIMMER_MODES = { off: 1, sweep: 1, loop: 1, always: 1 };

  function sanitizeHandle(raw) {
    return String(raw || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function sun(size, color) {
    var rays = '';
    var angles = [0, 45, 90, 135, 180, 225, 270, 315];
    for (var i = 0; i < angles.length; i++) {
      rays += '<rect x="44" y="4" width="12" height="46" rx="2" fill="' + color + '" transform="rotate(' + angles[i] + ' 50 50)"/>';
    }
    return '<svg class="ipd-sun" width="' + size + '" height="' + size + '" viewBox="0 0 100 100" aria-hidden="true" focusable="false">' + rays + '</svg>';
  }

  function innerHtml(type, p, handle, label) {
    if (type === 'member') {
      return '<span class="ipd-row">'
        + sun(16, p.sun)
        + '<span class="ipd-brand" style="color:' + p.brand + '">is-pinoy.dev</span>'
        + '<span class="ipd-divider" style="background:' + p.divider + '"></span>'
        + '<span class="ipd-handle" style="color:' + p.handle + '">' + esc(handle) + '</span>'
        + '</span>';
    }
    if (type === 'pinoy-made') {
      return '<span class="ipd-row">'
        + sun(20, p.sun)
        + '<span class="ipd-value" style="color:' + p.text + '">PINOY-MADE</span>'
        + '</span>';
    }
    if (type === 'certified') {
      return '<span class="ipd-row">'
        + sun(26, p.sun)
        + '<span class="ipd-col">'
        + '<span class="ipd-eyebrow" style="color:' + p.eyebrow + '">// CERTIFIED</span>'
        + '<span class="ipd-value" style="color:' + p.main + '">PINOY DEV</span>'
        + '</span></span>';
    }
    // subdomain (a.k.a. deployed-on)
    return '<span class="ipd-row">'
      + sun(24, p.sun)
      + '<span class="ipd-sep"></span>'
      + '<span class="ipd-col">'
      + '<span class="ipd-eyebrow" style="color:' + p.lbl + '">' + esc(label) + '</span>'
      + '<span class="ipd-value" style="color:' + p.val + '">' + esc(handle)
      + '<span class="ipd-sfx" style="color:' + p.sfx + '">.is-pinoy.dev</span></span>'
      + '</span></span>';
  }

  function styles(p, shimmerColor) {
    var rest = p.sh ? ('5px 5px 0 ' + p.sh) : 'none';
    var press = p.sh ? ('2px 2px 0 ' + p.sh) : 'none';
    return FONTS
      + ':host{display:inline-block;}'
      + '*{box-sizing:border-box;border-radius:0;margin:0;padding:0;}'
      + '.ipd-card{position:relative;display:inline-flex;align-items:center;text-decoration:none;cursor:pointer;'
      +   'border:2px solid ' + p.bd + ';background:' + p.bg + ';overflow:hidden;'
      +   '--rsh:' + rest + ';--hsh:' + press + ';box-shadow:var(--rsh);'
      +   'transform:perspective(620px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg));'
      +   'transform-style:preserve-3d;transition:transform .12s ease-out,box-shadow .1s;will-change:transform;}'
      + '.ipd-card.t-member{padding:7px 10px;}'
      + '.ipd-card.t-subdomain,.ipd-card.t-certified{padding:12px 14px;}'
      + '.ipd-card.t-pinoy-made{padding:11px 14px;}'
      // classic pixel press when tilt is disabled
      + '.ipd-card.no-tilt{transform:none;}'
      + '.ipd-card.no-tilt:hover{transform:translate(3px,3px);box-shadow:var(--hsh);}'
      // pointer-tracking glare (the holographic ID-card sheen)
      + '.ipd-glare{position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .2s;z-index:2;'
      +   'background:radial-gradient(circle at var(--mx,50%) var(--my,50%),rgba(255,255,255,0.35),transparent 45%);'
      +   'mix-blend-mode:overlay;}'
      + '.ipd-card:hover .ipd-glare{opacity:1;}'
      // configurable diagonal shimmer sweep
      + '.ipd-shimmer{position:absolute;top:0;left:0;height:100%;width:60%;pointer-events:none;z-index:3;'
      +   'background:linear-gradient(100deg,transparent 8%,' + shimmerColor + ' 38%,' + shimmerColor + ' 62%,transparent 92%);'
      +   'transform:translateX(-180%) skewX(-18deg);}'
      + '.sh-off{display:none;}'
      + '.ipd-card:hover .sh-sweep{animation:ipd-shimmer .85s ease-out;}'
      + '.ipd-card:hover .sh-loop{animation:ipd-shimmer 1.6s linear infinite;}'
      + '.sh-always{animation:ipd-shimmer 2.6s linear infinite;}'
      + '@keyframes ipd-shimmer{from{transform:translateX(-180%) skewX(-18deg);}to{transform:translateX(300%) skewX(-18deg);}}'
      // content sits above the shadow rects, below glare/shimmer
      + '.ipd-inner{position:relative;z-index:1;}'
      + '.ipd-row{display:inline-flex;align-items:center;gap:10px;}'
      // nudge two-line content down ~1.5px: Press Start 2P leaves descender space
      // at the bottom of the value line, so the block otherwise reads top-heavy.
      + '.ipd-col{display:inline-flex;flex-direction:column;justify-content:center;gap:6px;transform:translateY(1.5px);}'
      + '.ipd-sep{align-self:stretch;width:1px;margin:3px 0;background:#2a2a2a;}'
      + '.ipd-divider{width:1px;height:11px;}'
      + ".ipd-eyebrow{font-family:'IBM Plex Mono',monospace;font-size:0.5rem;text-transform:uppercase;letter-spacing:0.12em;line-height:1;}"
      + ".ipd-value{font-family:'Press Start 2P',monospace;font-size:0.5rem;line-height:1;}"
      + ".ipd-sfx{font-family:'IBM Plex Mono',monospace;font-size:0.72em;}"
      + ".ipd-brand,.ipd-handle{font-family:'IBM Plex Mono',monospace;font-size:0.625rem;line-height:1;}"
      + '.ipd-sun{flex-shrink:0;display:block;}'
      // honor reduced-motion: no tilt, no sweep, no glare
      + '@media (prefers-reduced-motion: reduce){'
      +   '.ipd-card{transform:none !important;transition:none;}'
      +   '.ipd-shimmer{display:none !important;}'
      +   '.ipd-glare{display:none !important;}'
      + '}';
  }

  var prefersReducedMotion = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  var IsPinoyBadge = function () {
    var self = Reflect.construct(HTMLElement, [], IsPinoyBadge);
    self._root = self.attachShadow({ mode: 'open' });
    return self;
  };
  IsPinoyBadge.prototype = Object.create(HTMLElement.prototype);
  IsPinoyBadge.prototype.constructor = IsPinoyBadge;
  Object.setPrototypeOf(IsPinoyBadge, HTMLElement);

  IsPinoyBadge.observedAttributes = ['handle', 'type', 'theme', 'label', 'shimmer', 'shimmer-color', 'tilt'];

  IsPinoyBadge.prototype.connectedCallback = function () { this._render(); };
  IsPinoyBadge.prototype.attributeChangedCallback = function () {
    if (this._root) this._render();
  };

  IsPinoyBadge.prototype._render = function () {
    var type = TYPE_ALIASES[this.getAttribute('type') || ''] || 'subdomain';
    var pal = PALETTES[type];
    var theme = this.getAttribute('theme');
    if (!pal[theme]) theme = DEFAULT_THEME[type];
    var p = pal[theme];

    var handle = sanitizeHandle(this.getAttribute('handle')) || 'yourname';
    var label = (this.getAttribute('label') || 'DEPLOYED ON').toUpperCase();

    var shimmer = this.getAttribute('shimmer');
    if (!SHIMMER_MODES[shimmer]) shimmer = 'sweep';
    var shimmerColor = this.getAttribute('shimmer-color') || 'rgba(255,255,255,0.55)';

    var tiltAttr = this.getAttribute('tilt');
    var tilt = tiltAttr !== 'false' && tiltAttr !== 'off' && !prefersReducedMotion;

    var href = type === 'pinoy-made'
      ? 'https://is-pinoy.dev'
      : 'https://' + handle + '.is-pinoy.dev';

    var html = '<style>' + styles(p, shimmerColor) + '</style>'
      + '<a class="ipd-card t-' + type + (tilt ? '' : ' no-tilt') + '" part="card" '
      +   'href="' + esc(href) + '" target="_blank" rel="noopener" '
      +   'aria-label="' + esc(handle) + ' on is-pinoy.dev">'
      +   '<span class="ipd-glare" aria-hidden="true"></span>'
      +   '<span class="ipd-shimmer sh-' + shimmer + '" aria-hidden="true"></span>'
      +   '<span class="ipd-inner">' + innerHtml(type, p, handle, label) + '</span>'
      + '</a>';

    this._root.innerHTML = html;

    if (tilt) this._attachTilt(this._root.querySelector('.ipd-card'));
  };

  IsPinoyBadge.prototype._attachTilt = function (card) {
    if (!card) return;
    var MAX = 9; // degrees of rotation at the card edges
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      if (!r.width || !r.height) return;
      var px = (e.clientX - r.left) / r.width;
      var py = (e.clientY - r.top) / r.height;
      card.style.setProperty('--ry', ((px - 0.5) * 2 * MAX).toFixed(2) + 'deg');
      card.style.setProperty('--rx', ((0.5 - py) * 2 * MAX).toFixed(2) + 'deg');
      card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
      card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
    });
    card.addEventListener('pointerleave', function () {
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
      card.style.removeProperty('--mx');
      card.style.removeProperty('--my');
    });
  };

  window.customElements.define('is-pinoy-badge', IsPinoyBadge);
})();
`
