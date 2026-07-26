export interface OgData {
  subdomain: string
  owner: string
  found: boolean
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function subdomainFontSize(length: number): number {
  if (length <= 5) return 120
  if (length <= 8) return 112
  if (length <= 11) return 104
  if (length <= 14) return 92
  if (length <= 18) return 78
  if (length <= 24) return 62
  if (length <= 30) return 52
  if (length <= 36) return 44
  return 38
}

/** 8-ray starburst logo mark — matches the is-pinoy.dev brand mark. */
function starburst(
  cx: number,
  cy: number,
  size: number,
  color: string
): string {
  const ry = size * 0.18
  const rx = size * 0.042
  const gap = size * 0.09
  const offset = gap + ry
  return Array.from(
    { length: 8 },
    (_, index) =>
      `<ellipse cx="${cx}" cy="${cy - offset}" rx="${rx}" ry="${ry}" fill="${color}" transform="rotate(${index * 45} ${cx} ${cy})"/>`
  ).join("")
}

function buildNotFoundSvg(subdomain: string): string {
  const background = "#0D0D0D"
  const surface = "#1A1A1A"
  const muted = "#444444"
  const leftPanelWidth = 380
  const leftPanelCenter = leftPanelWidth / 2

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <rect x="0" y="0" width="${leftPanelWidth}" height="630" fill="${surface}"/>
    <rect x="${leftPanelWidth}" y="0" width="4" height="630" fill="${muted}"/>
    <rect x="${leftPanelWidth + 4}" y="0" width="${1200 - leftPanelWidth - 4}" height="630" fill="${background}"/>

    ${starburst(leftPanelCenter, 250, 110, muted)}
    <text x="${leftPanelCenter}" y="340" font-family="Press Start 2P" font-size="10" fill="${muted}" text-anchor="middle" letter-spacing="2">IS-PINOY.DEV</text>

    <text x="796" y="268" font-family="Press Start 2P" font-size="11" fill="${muted}" text-anchor="middle" letter-spacing="3">404</text>
    <text x="796" y="316" font-family="Press Start 2P" font-size="18" fill="#2A2A2A" text-anchor="middle">SUBDOMAIN NOT FOUND</text>
    <rect x="${leftPanelWidth + 80}" y="328" width="${1200 - leftPanelWidth - 80 - 60}" height="2" fill="${muted}" fill-opacity="0.3"/>
    <text x="796" y="378" font-family="Press Start 2P" font-size="12" fill="#252525" text-anchor="middle">${escapeXml(subdomain)}.is-pinoy.dev</text>

    <text x="${leftPanelCenter}" y="590" font-family="Press Start 2P" font-size="8" fill="#3A3A3A" text-anchor="middle" letter-spacing="1">FREE FOR FILIPINOS</text>
  </svg>`
}

export function buildSvg(
  data: OgData,
  backgroundDataUri: string,
  avatarDataUri?: string
): string {
  const { subdomain, owner, found } = data

  if (!found) return buildNotFoundSvg(subdomain)

  const fontSize = subdomainFontSize(subdomain.length)
  const ownerInitial = owner.slice(0, 1).toUpperCase()
  const avatar = avatarDataUri
    ? `<image
        href="${avatarDataUri}"
        x="70"
        y="92"
        width="48"
        height="48"
        preserveAspectRatio="xMidYMid slice"
        clip-path="url(#github-avatar)"
      />`
    : `<circle cx="94" cy="116" r="24" fill="#E8F0FC"/>
      <text
        x="94"
        y="124"
        font-family="Geist"
        font-size="22"
        font-weight="600"
        fill="#175CD3"
        text-anchor="middle"
      >${escapeXml(ownerInitial)}</text>`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <defs>
      <clipPath id="github-avatar">
        <circle cx="94" cy="116" r="24"/>
      </clipPath>
    </defs>
    <image href="${backgroundDataUri}" x="0" y="0" width="1200" height="630" preserveAspectRatio="xMidYMid slice"/>
    ${avatar}
    <circle cx="94" cy="116" r="24" fill="none" stroke="#175CD3" stroke-width="2"/>
    <text
      x="132"
      y="126"
      font-family="Geist"
      font-size="27"
      font-weight="600"
      letter-spacing="-0.5"
      fill="#0B1F44"
    >@${escapeXml(owner)}</text>
    <text
      x="70"
      y="276"
      font-family="Geist"
      font-size="${fontSize}"
      font-weight="600"
      letter-spacing="-2"
      fill="#175CD3"
    >${escapeXml(subdomain)}</text>
  </svg>`
}
