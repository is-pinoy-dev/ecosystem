export interface OgData {
  subdomain: string;
  owner: string;
  found: boolean;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function subdomainFontSize(len: number): number {
  if (len <= 6) return 60;
  if (len <= 9) return 50;
  if (len <= 13) return 40;
  if (len <= 18) return 30;
  if (len <= 24) return 22;
  if (len <= 32) return 16;
  return 12;
}

function grid(): string {
  const lines: string[] = [];
  for (let x = 0; x <= 1200; x += 40) {
    lines.push(
      `<line x1="${x}" y1="0" x2="${x}" y2="630" stroke="#F5C800" stroke-width="0.5" stroke-opacity="0.07"/>`
    );
  }
  for (let y = 0; y <= 630; y += 40) {
    lines.push(
      `<line x1="0" y1="${y}" x2="1200" y2="${y}" stroke="#F5C800" stroke-width="0.5" stroke-opacity="0.07"/>`
    );
  }
  return lines.join("");
}

function scanlines(): string {
  const lines: string[] = [];
  for (let y = 2; y <= 630; y += 4) {
    lines.push(
      `<line x1="0" y1="${y}" x2="1200" y2="${y}" stroke="#000000" stroke-width="1.5" stroke-opacity="0.12"/>`
    );
  }
  return lines.join("");
}

function pixelCorners(color: string): string {
  const L = 24; // arm length
  const T = 4;  // thickness
  const M = 20; // margin from inner edge (after the 8px bar)
  const iY = 8; // inner top edge (after top bar)
  const bY = 622; // inner bottom edge (before bottom bar)

  return [
    // top-left
    `<rect x="${M}" y="${iY + M}" width="${L}" height="${T}" fill="${color}"/>`,
    `<rect x="${M}" y="${iY + M}" width="${T}" height="${L}" fill="${color}"/>`,
    // top-right
    `<rect x="${1200 - M - L}" y="${iY + M}" width="${L}" height="${T}" fill="${color}"/>`,
    `<rect x="${1200 - M - T}" y="${iY + M}" width="${T}" height="${L}" fill="${color}"/>`,
    // bottom-left
    `<rect x="${M}" y="${bY - M - T}" width="${L}" height="${T}" fill="${color}"/>`,
    `<rect x="${M}" y="${bY - M - L}" width="${T}" height="${L}" fill="${color}"/>`,
    // bottom-right
    `<rect x="${1200 - M - L}" y="${bY - M - T}" width="${L}" height="${T}" fill="${color}"/>`,
    `<rect x="${1200 - M - T}" y="${bY - M - L}" width="${T}" height="${L}" fill="${color}"/>`,
  ].join("");
}

// Decorative pixel dots scattered around the background
function pixelDots(color: string, opacity: number): string {
  const positions = [
    [80, 120], [160, 200], [1060, 140], [1100, 300], [1060, 480],
    [80, 480], [140, 560], [300, 80], [900, 80], [1000, 560],
    [220, 540], [960, 540], [480, 80], [720, 80], [400, 560],
    [800, 560], [60, 340], [1140, 340],
  ];
  return positions
    .map(([x, y]) => `<rect x="${x}" y="${y}" width="4" height="4" fill="${color}" fill-opacity="${opacity}"/>`)
    .join("");
}

export function buildSvg(data: OgData): string {
  const { subdomain, owner, found } = data;

  const BASE = "#0D0D0D";
  const YELLOW = "#F5C800";
  const YELLOW_DARK = "#D4A800";
  const MUTED = "#444444";
  const DIM = "#2A2A2A";
  const OWNER_COLOR = "#888888";
  const GREEN = "#39D353";

  if (!found) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
      <rect width="1200" height="630" fill="${BASE}"/>
      ${grid()}
      ${scanlines()}
      <rect x="0" y="0" width="1200" height="8" fill="${MUTED}"/>
      <rect x="0" y="622" width="1200" height="8" fill="${MUTED}"/>
      ${pixelCorners(MUTED)}
      ${pixelDots(MUTED, 0.6)}
      <text x="600" y="270" font-family="Press Start 2P" font-size="11" fill="${MUTED}" text-anchor="middle" letter-spacing="3">404</text>
      <text x="600" y="320" font-family="Press Start 2P" font-size="20" fill="${DIM}" text-anchor="middle">SUBDOMAIN NOT FOUND</text>
      <text x="600" y="380" font-family="Press Start 2P" font-size="13" fill="#1e1e1e" text-anchor="middle">${escapeXml(subdomain)}.is-pinoy.dev</text>
      <text x="60" y="590" font-family="Press Start 2P" font-size="11" fill="${MUTED}" letter-spacing="2">IS-PINOY.DEV</text>
    </svg>`;
  }

  const fs = subdomainFontSize(subdomain.length);
  const boxPadV = 36;
  const boxH = fs + boxPadV * 2;

  // Vertically center the content block in the body (y=105 to y=550)
  const bodyStart = 105;
  const bodyEnd = 548;
  const domainLineH = 28;
  const ownerLineH = 18;
  const contentH = boxH + 48 + domainLineH + 36 + ownerLineH;
  const boxY = bodyStart + Math.floor((bodyEnd - bodyStart - contentH) / 2);

  const textBaselineInBox = boxY + boxPadV + fs;
  const domainY = boxY + boxH + 56;
  const ownerDotCY = domainY + 42;
  const ownerTextY = ownerDotCY + 6;

  const BOX_X = 60;
  const BOX_W = 1080;
  const ACCENT_W = 8;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <!-- background -->
    <rect width="1200" height="630" fill="${BASE}"/>
    ${grid()}
    ${pixelDots(YELLOW, 0.08)}

    <!-- top / bottom bars -->
    <rect x="0" y="0" width="1200" height="8" fill="${YELLOW}"/>
    <rect x="0" y="622" width="1200" height="8" fill="${YELLOW}"/>

    <!-- pixel corner brackets -->
    ${pixelCorners(YELLOW)}

    <!-- header separator -->
    <line x1="60" y1="100" x2="1140" y2="100" stroke="${YELLOW}" stroke-width="1" stroke-opacity="0.15"/>

    <!-- IS-PINOY.DEV branding, top-left -->
    <text x="60" y="62" font-family="Press Start 2P" font-size="13" fill="${YELLOW}" letter-spacing="2">IS-PINOY.DEV</text>

    <!-- FREE FOR FILIPINOS badge, top-right -->
    <rect x="852" y="30" width="288" height="44" fill="${YELLOW}"/>
    <rect x="852" y="30" width="${ACCENT_W}" height="44" fill="${YELLOW_DARK}"/>
    <rect x="${852 + 288 - ACCENT_W}" y="30" width="${ACCENT_W}" height="44" fill="${YELLOW_DARK}"/>
    <text x="996" y="58" font-family="Press Start 2P" font-size="9" fill="${BASE}" text-anchor="middle" letter-spacing="1">FREE FOR FILIPINOS</text>

    <!-- subdomain highlight box -->
    <rect x="${BOX_X}" y="${boxY}" width="${BOX_W}" height="${boxH}" fill="${YELLOW}"/>
    <rect x="${BOX_X}" y="${boxY}" width="${ACCENT_W}" height="${boxH}" fill="${YELLOW_DARK}"/>
    <rect x="${BOX_X + BOX_W - ACCENT_W}" y="${boxY}" width="${ACCENT_W}" height="${boxH}" fill="${YELLOW_DARK}"/>

    <!-- subdomain text -->
    <text x="600" y="${textBaselineInBox}" font-family="Press Start 2P" font-size="${fs}" fill="${BASE}" text-anchor="middle">${escapeXml(subdomain)}</text>

    <!-- .is-pinoy.dev suffix -->
    <text x="600" y="${domainY}" font-family="Press Start 2P" font-size="22" fill="${MUTED}" text-anchor="middle">.is-pinoy.dev</text>

    <!-- owner: green status dot + github username -->
    <rect x="${600 - 10 - 8}" y="${ownerDotCY - 8}" width="8" height="8" fill="${GREEN}"/>
    <rect x="${600 - 10 - 6}" y="${ownerDotCY - 10}" width="4" height="2" fill="${GREEN}"/>
    <rect x="${600 - 10 - 6}" y="${ownerDotCY + 6}" width="4" height="2" fill="${GREEN}"/>
    <rect x="${600 - 10 - 10}" y="${ownerDotCY - 6}" width="2" height="4" fill="${GREEN}"/>
    <rect x="${600 - 10 - 0}" y="${ownerDotCY - 6}" width="2" height="4" fill="${GREEN}"/>
    <text x="${600 - 10 + 8}" y="${ownerTextY}" font-family="Press Start 2P" font-size="14" fill="${OWNER_COLOR}">@${escapeXml(owner)}</text>

    <!-- footer separator -->
    <line x1="60" y1="556" x2="1140" y2="556" stroke="${YELLOW}" stroke-width="1" stroke-opacity="0.15"/>

    <!-- footer: branding left, tagline right -->
    <text x="60" y="590" font-family="Press Start 2P" font-size="11" fill="${YELLOW}" letter-spacing="2">IS-PINOY.DEV</text>
    <text x="1140" y="590" font-family="Press Start 2P" font-size="9" fill="${MUTED}" text-anchor="end">Open source · Free forever</text>

    <!-- scanlines overlay -->
    ${scanlines()}
  </svg>`;
}
