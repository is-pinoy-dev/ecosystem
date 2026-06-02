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
  if (len <= 10) return 44;
  if (len <= 15) return 34;
  if (len <= 20) return 26;
  if (len <= 28) return 20;
  return 16;
}

function gridLines(): string {
  const lines: string[] = [];
  for (let x = 0; x <= 1200; x += 24) {
    lines.push(
      `<line x1="${x}" y1="0" x2="${x}" y2="630" stroke="#F5C800" stroke-width="0.5" stroke-opacity="0.04"/>`
    );
  }
  for (let y = 0; y <= 630; y += 24) {
    lines.push(
      `<line x1="0" y1="${y}" x2="1200" y2="${y}" stroke="#F5C800" stroke-width="0.5" stroke-opacity="0.04"/>`
    );
  }
  return lines.join("");
}

export function buildSvg(data: OgData): string {
  const { subdomain, owner, found } = data;
  const fs = subdomainFontSize(subdomain.length);
  const boxY = 215;
  const boxH = fs * 2 + 12;

  if (!found) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
      <rect width="1200" height="630" fill="#0D0D0D"/>
      ${gridLines()}
      <rect x="0" y="0" width="1200" height="6" fill="#F5C800"/>
      <rect x="0" y="624" width="1200" height="6" fill="#F5C800"/>
      <text x="600" y="295" font-family="Press Start 2P" font-size="22" fill="#444444" text-anchor="middle">SUBDOMAIN NOT FOUND</text>
      <text x="600" y="360" font-family="Press Start 2P" font-size="13" fill="#2a2a2a" text-anchor="middle">${escapeXml(subdomain)}.is-pinoy.dev</text>
      <text x="60" y="580" font-family="Press Start 2P" font-size="11" fill="#F5C800" letter-spacing="2">IS-PINOY.DEV</text>
    </svg>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <rect width="1200" height="630" fill="#0D0D0D"/>
    ${gridLines()}
    <rect x="0" y="0" width="1200" height="6" fill="#F5C800"/>
    <rect x="0" y="624" width="1200" height="6" fill="#F5C800"/>
    <rect x="840" y="60" width="320" height="44" fill="none" stroke="#F5C800" stroke-width="2"/>
    <text x="1000" y="88" font-family="Press Start 2P" font-size="9" fill="#F5C800" text-anchor="middle" letter-spacing="1">FREE FOR FILIPINOS</text>
    <rect x="100" y="${boxY}" width="1000" height="${boxH}" fill="#F5C800"/>
    <text x="600" y="${boxY + boxH - 10}" font-family="Press Start 2P" font-size="${fs}" fill="#0D0D0D" text-anchor="middle">${escapeXml(subdomain)}</text>
    <text x="600" y="${boxY + boxH + 64}" font-family="Press Start 2P" font-size="20" fill="#666666" text-anchor="middle">.is-pinoy.dev</text>
    <text x="600" y="${boxY + boxH + 120}" font-family="Press Start 2P" font-size="13" fill="#888888" text-anchor="middle">@${escapeXml(owner)}</text>
    <text x="60" y="580" font-family="Press Start 2P" font-size="11" fill="#F5C800" letter-spacing="2">IS-PINOY.DEV</text>
    <text x="1140" y="580" font-family="Press Start 2P" font-size="9" fill="#444444" text-anchor="end">Open source · Free forever</text>
  </svg>`;
}
