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
  if (len <= 5) return 68;
  if (len <= 8) return 56;
  if (len <= 11) return 46;
  if (len <= 15) return 36;
  if (len <= 20) return 28;
  if (len <= 27) return 20;
  if (len <= 35) return 15;
  return 11;
}

/** 8-ray starburst logo mark — matches is-pinoy.dev brand mark */
function starburst(cx: number, cy: number, size: number, color: string): string {
  const ry = size * 0.18;
  const rx = size * 0.042;
  const gap = size * 0.09;
  const offset = gap + ry;
  return Array.from({ length: 8 }, (_, i) =>
    `<ellipse cx="${cx}" cy="${cy - offset}" rx="${rx}" ry="${ry}" fill="${color}" transform="rotate(${i * 45} ${cx} ${cy})"/>`
  ).join("");
}

export function buildSvg(data: OgData): string {
  const { subdomain, owner, found } = data;

  const YELLOW = "#F5C800";
  const YELLOW_DARK = "#D4A800";
  const BG = "#0D0D0D";
  const SURFACE = "#1A1A1A";
  const MUTED = "#444444";
  const OWNER_COLOR = "#888888";
  const GREEN = "#39D353";

  // left panel width
  const LP = 380;
  const LCX = LP / 2; // left panel center x

  if (!found) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
      <!-- left panel -->
      <rect x="0" y="0" width="${LP}" height="630" fill="${SURFACE}"/>
      <rect x="${LP}" y="0" width="4" height="630" fill="${MUTED}"/>
      <!-- right panel -->
      <rect x="${LP + 4}" y="0" width="${1200 - LP - 4}" height="630" fill="${BG}"/>

      <!-- logo mark (muted) -->
      ${starburst(LCX, 250, 110, MUTED)}
      <text x="${LCX}" y="340" font-family="Press Start 2P" font-size="10" fill="${MUTED}" text-anchor="middle" letter-spacing="2">IS-PINOY.DEV</text>

      <!-- 404 content -->
      <text x="796" y="268" font-family="Press Start 2P" font-size="11" fill="${MUTED}" text-anchor="middle" letter-spacing="3">404</text>
      <text x="796" y="316" font-family="Press Start 2P" font-size="18" fill="#2A2A2A" text-anchor="middle">SUBDOMAIN NOT FOUND</text>
      <rect x="${LP + 80}" y="328" width="${1200 - LP - 80 - 60}" height="2" fill="${MUTED}" fill-opacity="0.3"/>
      <text x="796" y="378" font-family="Press Start 2P" font-size="12" fill="#252525" text-anchor="middle">${escapeXml(subdomain)}.is-pinoy.dev</text>

      <!-- bottom left: FREE FOR FILIPINOS -->
      <text x="${LCX}" y="590" font-family="Press Start 2P" font-size="8" fill="#3A3A3A" text-anchor="middle" letter-spacing="1">FREE FOR FILIPINOS</text>
    </svg>`;
  }

  const fs = subdomainFontSize(subdomain.length);

  // vertically center content block in right panel
  const RCX = LP + 4 + (1200 - LP - 4) / 2; // right panel center x ≈ 792
  const blockH = fs + 24 + 30 + 40 + 20; // text + underline gap + domain + gap + owner
  const subY = Math.round(315 - blockH / 2 + fs);
  const underlineY = subY + 14;
  const domainY = underlineY + 38;
  const ownerY = domainY + 50;

  const ownerDotX = Math.round(RCX - ((owner.length * fs * 0.42) / 2 + 20));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <!-- left panel -->
    <rect x="0" y="0" width="${LP}" height="630" fill="${YELLOW}"/>

    <!-- starburst logo in dark on yellow -->
    ${starburst(LCX, 238, 120, BG)}

    <!-- IS-PINOY.DEV label -->
    <text x="${LCX}" y="336" font-family="Press Start 2P" font-size="11" fill="${BG}" text-anchor="middle" letter-spacing="2">IS-PINOY.DEV</text>

    <!-- thin separator -->
    <rect x="40" y="358" width="${LP - 80}" height="2" fill="${YELLOW_DARK}"/>

    <!-- FREE FOR FILIPINOS -->
    <text x="${LCX}" y="388" font-family="Press Start 2P" font-size="8" fill="${YELLOW_DARK}" text-anchor="middle" letter-spacing="1">FREE FOR FILIPINOS</text>

    <!-- divider bar -->
    <rect x="${LP}" y="0" width="4" height="630" fill="${BG}"/>

    <!-- right panel background -->
    <rect x="${LP + 4}" y="0" width="${1200 - LP - 4}" height="630" fill="${BG}"/>

    <!-- subtle top + bottom accent lines on right panel -->
    <rect x="${LP + 4}" y="0" width="${1200 - LP - 4}" height="4" fill="${YELLOW}" fill-opacity="0.15"/>
    <rect x="${LP + 4}" y="626" width="${1200 - LP - 4}" height="4" fill="${YELLOW}" fill-opacity="0.15"/>

    <!-- pixel corner marks (top-right, bottom-right) -->
    <rect x="${1200 - 44}" y="20" width="20" height="3" fill="${YELLOW}" fill-opacity="0.4"/>
    <rect x="${1200 - 27}" y="20" width="3" height="20" fill="${YELLOW}" fill-opacity="0.4"/>
    <rect x="${1200 - 44}" y="607" width="20" height="3" fill="${YELLOW}" fill-opacity="0.4"/>
    <rect x="${1200 - 27}" y="587" width="3" height="20" fill="${YELLOW}" fill-opacity="0.4"/>

    <!-- pixel corner marks (top-left of right panel) -->
    <rect x="${LP + 24}" y="20" width="20" height="3" fill="${YELLOW}" fill-opacity="0.4"/>
    <rect x="${LP + 24}" y="20" width="3" height="20" fill="${YELLOW}" fill-opacity="0.4"/>
    <rect x="${LP + 24}" y="607" width="20" height="3" fill="${YELLOW}" fill-opacity="0.4"/>
    <rect x="${LP + 24}" y="587" width="3" height="20" fill="${YELLOW}" fill-opacity="0.4"/>

    <!-- subdomain hero text -->
    <text x="${RCX}" y="${subY}" font-family="Press Start 2P" font-size="${fs}" fill="${YELLOW}" text-anchor="middle">${escapeXml(subdomain)}</text>

    <!-- yellow underline -->
    <rect x="${LP + 60}" y="${underlineY}" width="${1200 - LP - 60 - 44}" height="3" fill="${YELLOW}" fill-opacity="0.25"/>

    <!-- .is-pinoy.dev -->
    <text x="${RCX}" y="${domainY}" font-family="Press Start 2P" font-size="20" fill="${MUTED}" text-anchor="middle">.is-pinoy.dev</text>

    <!-- green pixel dot + @owner -->
    <rect x="${ownerDotX - 10}" y="${ownerY - 10}" width="8" height="8" fill="${GREEN}" fill-opacity="0.9"/>
    <text x="${ownerDotX + 4}" y="${ownerY}" font-family="Press Start 2P" font-size="13" fill="${OWNER_COLOR}">@${escapeXml(owner)}</text>
  </svg>`;
}
