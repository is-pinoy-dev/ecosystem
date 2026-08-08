import { ScreenshotError } from "./errors"

const SUBDOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$/
const DNS_JSON_ENDPOINT = "https://cloudflare-dns.com/dns-query"

function normalizedIp(value: string): string {
  return value.replace(/^\[/, "").replace(/\]$/, "").toLowerCase()
}

export function isPrivateIpAddress(value: string): boolean {
  const ip = normalizedIp(value)
  const parts = ip.split(".")
  if (
    parts.length === 4 &&
    parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)
  ) {
    const [a, b] = parts.map(Number)
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    )
  }

  if (!ip.includes(":")) return false
  if (ip === "::" || ip === "::1") return true
  const groups = ip.split(":")
  const compact = groups.map((group) => group.replace(/^0+/, "") || "0")
  if (
    compact.length === 8 &&
    compact.slice(0, 7).every((group) => group === "0") &&
    (compact[7] === "0" || compact[7] === "1")
  ) {
    return true
  }
  if (ip.includes(".") && ip.includes("ffff:")) {
    return isPrivateIpAddress(ip.slice(ip.lastIndexOf(":") + 1))
  }

  const first = Number.parseInt(ip.split(":")[0] || "0", 16)
  return (
    (first & 0xfe00) === 0xfc00 ||
    (first & 0xffc0) === 0xfe80 ||
    (first & 0xffc0) === 0xfec0 ||
    (first & 0xff00) === 0xff00
  )
}

export function isValidPortfolioId(value: string): boolean {
  return (
    value.length >= 3 &&
    value.length <= 63 &&
    !value.includes(".") &&
    SUBDOMAIN_PATTERN.test(value)
  )
}

export function canonicalPortfolioUrl(portfolioId: string): URL {
  if (!isValidPortfolioId(portfolioId)) {
    throw new ScreenshotError(
      "disallowed_destination",
      "Invalid registered subdomain."
    )
  }
  return new URL(`https://${portfolioId}.is-pinoy.dev/`)
}

export function assertCanonicalPortfolioUrl(
  value: string | URL,
  portfolioId: string
): URL {
  const url = value instanceof URL ? value : new URL(value)
  const expectedHostname = `${portfolioId}.is-pinoy.dev`

  if (
    !isValidPortfolioId(portfolioId) ||
    url.protocol !== "https:" ||
    url.username !== "" ||
    url.password !== "" ||
    url.port !== "" ||
    url.hostname !== expectedHostname
  ) {
    throw new ScreenshotError("redirect_rejected")
  }

  return url
}

export function assertSafeResourceUrl(value: string): URL | null {
  const url = new URL(value)
  if (url.protocol === "data:" || url.protocol === "blob:") return null
  if (
    url.protocol !== "https:" ||
    url.username !== "" ||
    url.password !== "" ||
    url.port !== ""
  ) {
    throw new ScreenshotError("disallowed_destination")
  }

  const hostname = normalizedIp(url.hostname)
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    isPrivateIpAddress(hostname)
  ) {
    throw new ScreenshotError("disallowed_destination")
  }
  return url
}

interface DnsJsonResponse {
  Status?: number
  Answer?: { type?: number; data?: string }[]
}

export async function assertPublicDns(
  hostname: string,
  fetchImpl: typeof fetch = fetch
): Promise<void> {
  if (isPrivateIpAddress(hostname)) {
    throw new ScreenshotError("disallowed_destination")
  }

  const addresses: string[] = []
  for (const type of ["A", "AAAA"]) {
    const url = new URL(DNS_JSON_ENDPOINT)
    url.searchParams.set("name", hostname)
    url.searchParams.set("type", type)
    const response = await fetchImpl(url, {
      headers: { Accept: "application/dns-json" },
    })
    if (!response.ok) {
      throw new ScreenshotError("dns_connection_failure")
    }
    const body = (await response.json()) as DnsJsonResponse
    if (body.Status && body.Status !== 0) continue
    for (const answer of body.Answer ?? []) {
      if ((answer.type === 1 || answer.type === 28) && answer.data) {
        addresses.push(answer.data)
      }
    }
  }

  if (addresses.length === 0) {
    throw new ScreenshotError("dns_connection_failure")
  }
  if (addresses.some(isPrivateIpAddress)) {
    throw new ScreenshotError("disallowed_destination")
  }
}
