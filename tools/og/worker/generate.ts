export interface OgData {
  subdomain: string
  owner: string
  found: boolean
}

const BACKGROUND = "#FDFCFA"
const SURFACE = "#F2F0E9"
const BORDER = "#DED9CD"
const FOREGROUND = "#0B1F44"
const MUTED_FOREGROUND = "#667085"
const ACCENT = "#175CD3"

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

/**
 * Wordmark sizes for the caption bar under a screenshot, keyed on the whole
 * `<subdomain>.is-pinoy.dev` string rather than the label alone — the suffix is
 * thirteen characters and sizing without it overflows the card. The longest
 * registrable label still fits at the bottom of the scale.
 */
function captionFontSize(length: number): number {
  if (length <= 20) return 88
  if (length <= 26) return 76
  if (length <= 32) return 62
  if (length <= 42) return 48
  if (length <= 55) return 38
  return 28
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
  const background = BACKGROUND
  const surface = SURFACE
  const border = BORDER
  const foreground = FOREGROUND
  const mutedForeground = MUTED_FOREGROUND
  const accent = ACCENT
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

/**
 * The owner's GitHub avatar as a ringed circle, falling back to their initial
 * on a tinted disc when the avatar could not be fetched. Both cards draw one,
 * at different sizes, so the geometry is derived from the radius rather than
 * written out twice.
 */
function avatarMark(
  cx: number,
  cy: number,
  radius: number,
  owner: string,
  avatarDataUri: string | undefined,
  clipId: string
): string {
  const ring = `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${ACCENT}" stroke-width="2"/>`

  if (avatarDataUri) {
    return `<defs>
      <clipPath id="${clipId}">
        <circle cx="${cx}" cy="${cy}" r="${radius}"/>
      </clipPath>
    </defs>
    <image
      href="${avatarDataUri}"
      x="${cx - radius}"
      y="${cy - radius}"
      width="${radius * 2}"
      height="${radius * 2}"
      preserveAspectRatio="xMidYMid slice"
      clip-path="url(#${clipId})"
    />
    ${ring}`
  }

  return `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="#E8F0FC"/>
    <text
      x="${cx}"
      y="${cy + radius * 0.34}"
      font-family="Geist"
      font-size="${Math.round(radius * 0.92)}"
      font-weight="600"
      fill="${ACCENT}"
      text-anchor="middle"
    >${escapeXml(owner.slice(0, 1).toUpperCase())}</text>
    ${ring}`
}

/** Where the screenshot stops and the caption bar begins. */
const SCREENSHOT_HEIGHT = 412

/**
 * The branded card carries this in its background artwork. The screenshot card
 * has no artwork to carry it, so it sets the suffix in type — a share of
 * `juan.is-pinoy.dev` should say so, not just say `juan`.
 */
const SITE_SUFFIX = ".is-pinoy.dev"

/**
 * The card for a portfolio we have a capture of: the site itself across the
 * top, a caption bar naming the subdomain and its owner underneath.
 *
 * The screenshot is cropped from the top rather than centred — a portfolio's
 * hero is the part worth showing, and centring a 1440x900 capture into this
 * band would trade it for whatever sits mid-page. Type never overlaps the
 * screenshot: a 1px rule separates them, so legibility does not depend on what
 * the captured site happens to look like.
 */
function buildScreenshotSvg(
  data: OgData,
  screenshotDataUri: string,
  avatarDataUri?: string
): string {
  const { subdomain, owner } = data
  const fontSize = captionFontSize(subdomain.length + SITE_SUFFIX.length)

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <rect x="0" y="0" width="1200" height="630" fill="${BACKGROUND}"/>
    <image
      href="${screenshotDataUri}"
      x="0"
      y="0"
      width="1200"
      height="${SCREENSHOT_HEIGHT}"
      preserveAspectRatio="xMidYMin slice"
    />
    <rect x="0" y="${SCREENSHOT_HEIGHT}" width="1200" height="1" fill="${BORDER}"/>
    <text
      x="70"
      y="522"
      font-family="Geist"
      font-size="${fontSize}"
      font-weight="600"
      letter-spacing="-2"
    ><tspan fill="${ACCENT}">${escapeXml(subdomain)}</tspan><tspan fill="${FOREGROUND}">${SITE_SUFFIX}</tspan></text>
    ${avatarMark(92, 572, 22, owner, avatarDataUri, "github-avatar")}
    <text
      x="126"
      y="580"
      font-family="Geist"
      font-size="24"
      font-weight="600"
      letter-spacing="-0.5"
      fill="${FOREGROUND}"
    >@${escapeXml(owner)}</text>
    <text
      x="1130"
      y="580"
      font-family="Geist"
      font-size="13"
      font-weight="600"
      fill="${MUTED_FOREGROUND}"
      text-anchor="end"
      letter-spacing="1.8"
    >IS-PINOY.DEV</text>
  </svg>`
}

export function buildSvg(
  data: OgData,
  backgroundDataUri: string,
  avatarDataUri?: string,
  screenshotDataUri?: string
): string {
  const { subdomain, owner, found } = data

  if (!found) return buildNotFoundSvg(subdomain)
  // A registered portfolio we have captured shows the captured site; the
  // branded background is what stands in until the first capture lands.
  if (screenshotDataUri) {
    return buildScreenshotSvg(data, screenshotDataUri, avatarDataUri)
  }

  const fontSize = subdomainFontSize(subdomain.length)

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <image href="${backgroundDataUri}" x="0" y="0" width="1200" height="630" preserveAspectRatio="xMidYMid slice"/>
    ${avatarMark(94, 116, 24, owner, avatarDataUri, "github-avatar")}
    <text
      x="132"
      y="126"
      font-family="Geist"
      font-size="27"
      font-weight="600"
      letter-spacing="-0.5"
      fill="${FOREGROUND}"
    >@${escapeXml(owner)}</text>
    <text
      x="70"
      y="276"
      font-family="Geist"
      font-size="${fontSize}"
      font-weight="600"
      letter-spacing="-2"
      fill="${ACCENT}"
    >${escapeXml(subdomain)}</text>
  </svg>`
}
