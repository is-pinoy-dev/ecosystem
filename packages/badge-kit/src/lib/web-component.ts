// ─── Interactive HTML badge web component ────────────────────────────────────
//
// Served verbatim at GET /badge.js. Defines <is-pinoy-badge>, a Shadow-DOM
// isolated custom element for real HTML pages (portfolios, docs, footers).
//
// It mirrors the static SVG badges (packages/badge-kit/src/lib/svg.ts) exactly
// — same Banig Grid palette, same 8-ray sun mark, same IBM Plex Mono voice —
// and adds only a single quiet hover: a 140ms border/opacity shift. The old
// arcade effects (3D tilt, holographic glare, diagonal shimmer, pixel shadow)
// are retired along with the retro design system; motion is now limited to
// color, border, and small opacity changes per the v2.0 spec.
//
// Authored as a plain string (no backticks, no ${} inside) so it can be embedded
// in this TS template literal and shipped to the browser without a build step.

export const WEB_COMPONENT_VERSION = '0.3.0'

export const WEB_COMPONENT_JS = `(function () {
  'use strict';
  if (typeof window === 'undefined' || window.customElements == null) return;
  if (window.customElements.get('is-pinoy-badge')) return;

  var FONTS = "@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap');";

  // Palettes mirror packages/badge-kit/src/lib/svg.ts so the HTML badge matches
  // the rendered SVG colors exactly (Banig Grid v2.0).
  var PALETTES = {
    light:    { surface: '#FFFFFF', text: '#0B1F44', muted: '#667085', border: '#DED9CD', markBg: '#0B1F44', mark: '#F5C800', divider: '#DED9CD', hover: '#0B1F44' },
    dark:     { surface: '#0B1F44', text: '#FAF9F5', muted: '#9DABC6', border: '#24365F', markBg: '#F5C800', mark: '#0B1F44', divider: '#24365F', hover: '#F5C800' },
    gold:     { surface: '#F5C800', text: '#0B1F44', muted: '#7A6600', border: '#D4A800', markBg: '#0B1F44', mark: '#F5C800', divider: 'rgba(11,31,68,0.22)', hover: '#0B1F44' },
    outlined: { surface: 'transparent', text: '#F5C800', muted: '#B08A00', border: '#F5C800', markBg: 'transparent', mark: '#F5C800', divider: 'rgba(245,200,0,0.4)', hover: '#D4A800' }
  };

  var DEFAULT_THEME = 'light';
  var TYPE_ALIASES = { 'deployed-on': 'subdomain', 'subdomain': 'subdomain', 'member': 'member', 'pinoy-made': 'pinoy-made', 'certified': 'certified' };

  function sanitizeHandle(raw) {
    return String(raw || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
  }

  var HEX = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

  // Validate a color attribute the same way the SVG endpoint does: hex or the
  // 'transparent' keyword only, so nothing unsafe reaches the inline styles.
  function parseColor(raw) {
    if (!raw) return null;
    var v = String(raw).trim();
    if (v.toLowerCase() === 'transparent') return 'transparent';
    if (HEX.test(v)) return v.charAt(0) === '#' ? v : '#' + v;
    return null;
  }

  // Layer validated color attributes on top of a theme palette (mirrors
  // applyOverrides in svg.ts). 'border' also drives the divider.
  function applyOverrides(base, el) {
    var map = { bg: 'surface', text: 'text', muted: 'muted', border: 'border', mark: 'mark', markbg: 'markBg' };
    var p = {}, key;
    for (key in base) { if (Object.prototype.hasOwnProperty.call(base, key)) p[key] = base[key]; }
    for (var attr in map) {
      if (!Object.prototype.hasOwnProperty.call(map, attr)) continue;
      var c = parseColor(el.getAttribute(attr));
      if (c) p[map[attr]] = c;
    }
    if (parseColor(el.getAttribute('border'))) p.divider = parseColor(el.getAttribute('border'));
    return p;
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // The official 8-ray is-pinoy.dev sun, on a 100x100 grid (mirrors SUN_RAY in
  // packages/badge-kit/src/lib/svg.ts).
  var SUN_RAY = 'M50 6.5 C46.8 7 46.2 12 46.5 19 C46.8 27 48.1 35 48.6 40.5 C48.85 43.2 51.15 43.2 51.4 40.5 C51.9 35 53.2 27 53.5 19 C53.8 12 53.2 7 50 6.5 Z';
  function mark(color) {
    var angles = [0, 45, 90, 135, 180, 225, 270, 315];
    var rays = '';
    for (var i = 0; i < angles.length; i++) {
      rays += '<path d="' + SUN_RAY + '" transform="rotate(' + angles[i] + ' 50 50)"/>';
    }
    return '<svg class="ipd-glyph" viewBox="0 0 100 100" fill="' + color + '" aria-hidden="true" focusable="false">' + rays + '</svg>';
  }

  function body(type, p, handle, label) {
    if (type === 'member') {
      return '<span class="ipd-row">'
        + '<span class="ipd-brand" style="color:' + p.text + '">is-pinoy.dev</span>'
        + '<span class="ipd-bar" style="background:' + p.divider + '"></span>'
        + '<span class="ipd-handle" style="color:' + p.muted + '">' + esc(handle) + '</span>'
        + '</span>';
    }
    if (type === 'pinoy-made') {
      return '<span class="ipd-value ipd-track" style="color:' + p.text + '">PINOY-MADE</span>';
    }
    if (type === 'certified') {
      return '<span class="ipd-col">'
        + '<span class="ipd-eyebrow" style="color:' + p.muted + '">CERTIFIED</span>'
        + '<span class="ipd-value" style="color:' + p.text + '">PINOY DEV</span>'
        + '</span>';
    }
    // subdomain (a.k.a. deployed-on)
    return '<span class="ipd-col">'
      + '<span class="ipd-eyebrow" style="color:' + p.muted + '">' + esc(label) + '</span>'
      + '<span class="ipd-value" style="color:' + p.text + '">' + esc(handle)
      + '<span class="ipd-sfx" style="color:' + p.muted + '">.is-pinoy.dev</span></span>'
      + '</span>';
  }

  function styles(p) {
    return FONTS
      + ':host{display:inline-block;}'
      + '*{box-sizing:border-box;border-radius:0;margin:0;padding:0;}'
      + '.ipd-card{position:relative;display:inline-flex;align-items:stretch;text-decoration:none;cursor:pointer;'
      +   'border:1px solid ' + p.border + ';background:' + p.surface + ';'
      +   'transition:border-color .14s ease,box-shadow .14s ease;}'
      + '.ipd-card:hover{border-color:' + p.hover + ';box-shadow:inset 0 0 0 1px ' + p.hover + ';}'
      + '.ipd-mark{flex:0 0 auto;align-self:stretch;aspect-ratio:1;display:grid;place-items:center;'
      +   'background:' + p.markBg + ';border-right:1px solid ' + p.divider + ';}'
      + '.ipd-glyph{width:66%;height:66%;display:block;}'
      + '.ipd-body{display:flex;align-items:center;}'
      + '.ipd-card.t-member .ipd-body{padding:0 12px;}'
      + '.ipd-card.t-pinoy-made .ipd-body{padding:0 14px;}'
      + '.ipd-card.t-subdomain .ipd-body,.ipd-card.t-certified .ipd-body{padding:0 14px;}'
      + '.ipd-row{display:inline-flex;align-items:center;gap:10px;}'
      + '.ipd-col{display:inline-flex;flex-direction:column;justify-content:center;gap:5px;}'
      + '.ipd-bar{width:1px;height:12px;}'
      + ".ipd-eyebrow{font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:500;text-transform:uppercase;letter-spacing:0.12em;line-height:1;}"
      + ".ipd-value{font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:600;line-height:1;white-space:nowrap;}"
      + '.ipd-track{letter-spacing:0.08em;}'
      + ".ipd-sfx{font-weight:400;}"
      + ".ipd-brand{font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:600;line-height:1;}"
      + ".ipd-handle{font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:400;line-height:1;}"
      // On-brand sun motion (opt-in via the animate attribute). It moves only
      // the sun mark -- an echo of the animated sun banner, not arcade motion.
      // The sun is 8-fold symmetric, so a 45deg step reads as a full turn.
      + '@keyframes ipd-spin{to{transform:rotate(360deg);}}'
      + '.ipd-card.a-spin .ipd-glyph{transform-origin:50% 50%;animation:ipd-spin 14s linear infinite;}'
      + '.ipd-card.a-hover .ipd-glyph{transform-origin:50% 50%;transition:transform .5s cubic-bezier(.34,1.5,.64,1);}'
      + '.ipd-card.a-hover:hover .ipd-glyph{transform:rotate(45deg);}'
      + '@media (prefers-reduced-motion: reduce){'
      +   '.ipd-card{transition:none;}'
      +   '.ipd-glyph{animation:none!important;transition:none!important;transform:none!important;}'
      + '}';
  }

  // Per-type card height keeps the square mark cell proportional.
  var HEIGHTS = { 'subdomain': 48, 'certified': 48, 'member': 30, 'pinoy-made': 36 };

  var IsPinoyBadge = function () {
    var self = Reflect.construct(HTMLElement, [], IsPinoyBadge);
    self._root = self.attachShadow({ mode: 'open' });
    return self;
  };
  IsPinoyBadge.prototype = Object.create(HTMLElement.prototype);
  IsPinoyBadge.prototype.constructor = IsPinoyBadge;
  Object.setPrototypeOf(IsPinoyBadge, HTMLElement);

  IsPinoyBadge.observedAttributes = ['handle', 'type', 'theme', 'label', 'icon', 'animate', 'bg', 'text', 'muted', 'border', 'mark', 'markbg'];

  var MARK_OFF = { 'false': 1, 'off': 1, '0': 1, 'no': 1 };
  var ANIM = { spin: 1, hover: 1 };

  IsPinoyBadge.prototype.connectedCallback = function () { this._render(); };
  IsPinoyBadge.prototype.attributeChangedCallback = function () {
    if (this._root) this._render();
  };

  IsPinoyBadge.prototype._render = function () {
    var type = TYPE_ALIASES[this.getAttribute('type') || ''] || 'subdomain';
    var theme = this.getAttribute('theme');
    if (!PALETTES[theme]) theme = DEFAULT_THEME;
    var p = applyOverrides(PALETTES[theme], this);

    var handle = sanitizeHandle(this.getAttribute('handle')) || 'yourname';
    var label = (this.getAttribute('label') || 'DEPLOYED ON').toUpperCase();

    var href = type === 'pinoy-made'
      ? 'https://is-pinoy.dev'
      : 'https://' + handle + '.is-pinoy.dev';

    var h = HEIGHTS[type];
    var showMark = !MARK_OFF[(this.getAttribute('icon') || '').toLowerCase()];
    var anim = (this.getAttribute('animate') || '').toLowerCase();
    var animClass = showMark && ANIM[anim] ? ' a-' + anim : '';

    var html = '<style>' + styles(p) + '</style>'
      + '<a class="ipd-card t-' + type + animClass + '" part="card" style="height:' + h + 'px" '
      +   'href="' + esc(href) + '" target="_blank" rel="noopener" '
      +   'aria-label="' + esc(handle) + ' on is-pinoy.dev">'
      +   (showMark ? '<span class="ipd-mark">' + mark(p.mark) + '</span>' : '')
      +   '<span class="ipd-body">' + body(type, p, handle, label) + '</span>'
      + '</a>';

    this._root.innerHTML = html;
  };

  window.customElements.define('is-pinoy-badge', IsPinoyBadge);
})();
`
