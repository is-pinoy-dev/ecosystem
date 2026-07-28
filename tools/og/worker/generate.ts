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
  const background = "#FDFCFA"
  const surface = "#F2F0E9"
  const border = "#DED9CD"
  const foreground = "#0B1F44"
  const mutedForeground = "#667085"
  const accent = "#175CD3"
  const leftPanelWidth = 380
  const leftPanelCenter = leftPanelWidth / 2

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <rect x="0" y="0" width="1200" height="630" fill="${background}"/>
    <rect x="0" y="0" width="${leftPanelWidth}" height="630" fill="${surface}"/>
    <rect x="${leftPanelWidth}" y="0" width="1" height="630" fill="${border}"/>

    ${starburst(leftPanelCenter, 250, 110, accent)}
    <text x="${leftPanelCenter}" y="344" font-family="Geist" font-size="15" font-weight="600" fill="${mutedForeground}" text-anchor="middle" letter-spacing="1.8">IS-PINOY.DEV</text>

    <text x="460" y="266" font-family="Geist" font-size="14" font-weight="600" fill="${accent}" letter-spacing="1.8">404 — NOT FOUND</text>
    <text x="460" y="330" font-family="Geist" font-size="46" font-weight="600" fill="${foreground}" letter-spacing="-1">Subdomain not registered</text>
    <rect x="460" y="360" width="${1200 - 460 - 70}" height="1" fill="${border}"/>
    <text x="460" y="404" font-family="Geist" font-size="26" font-weight="600" fill="${mutedForeground}" letter-spacing="-0.5">${escapeXml(subdomain)}.is-pinoy.dev</text>

    <text x="${leftPanelCenter}" y="590" font-family="Geist" font-size="13" font-weight="600" fill="${mutedForeground}" text-anchor="middle" letter-spacing="0.8">FREE FOR FILIPINO DEVELOPERS</text>
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
