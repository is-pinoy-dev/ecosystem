export type ScreenshotErrorCode =
  | "timeout"
  | "dns_connection_failure"
  | "tls_failure"
  | "redirect_rejected"
  | "disallowed_destination"
  | "http_error"
  | "blank_result"
  | "browser_rate_limit"
  | "upload_failure"
  | "unknown_failure"

const OWNER_MESSAGES: Record<ScreenshotErrorCode, string> = {
  timeout: "The portfolio took too long to load.",
  dns_connection_failure: "The portfolio could not be reached.",
  tls_failure: "The portfolio has a TLS configuration problem.",
  redirect_rejected: "The portfolio redirected to a disallowed destination.",
  disallowed_destination: "The portfolio destination is not allowed.",
  http_error: "The portfolio returned an unsuccessful response.",
  blank_result: "The captured preview was blank or unusable.",
  browser_rate_limit: "The screenshot service is temporarily rate limited.",
  upload_failure: "The preview could not be stored.",
  unknown_failure: "The preview could not be generated.",
}

export class ScreenshotError extends Error {
  constructor(
    public readonly code: ScreenshotErrorCode,
    message?: string
  ) {
    super(message ?? OWNER_MESSAGES[code])
    this.name = "ScreenshotError"
  }
}

export interface ClassifiedScreenshotError {
  code: ScreenshotErrorCode
  ownerMessage: string
}

/**
 * Did this throw because we ran out of patience, rather than because the page
 * broke? The capture treats the two differently: a page that loaded and then
 * kept chattering still gets photographed, while one that never arrived cannot.
 */
export function isNavigationTimeout(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const description = `${error.name} ${error.message}`.toLowerCase()
  return description.includes("timeout") || description.includes("timed out")
}

export function classifyScreenshotError(
  error: unknown
): ClassifiedScreenshotError {
  if (error instanceof ScreenshotError) {
    return { code: error.code, ownerMessage: OWNER_MESSAGES[error.code] }
  }

  const message = error instanceof Error ? error.message.toLowerCase() : ""
  let code: ScreenshotErrorCode = "unknown_failure"
  if (message.includes("timeout") || message.includes("timed out")) {
    code = "timeout"
  } else if (
    message.includes("dns") ||
    message.includes("enotfound") ||
    message.includes("connection")
  ) {
    code = "dns_connection_failure"
  } else if (
    message.includes("tls") ||
    message.includes("certificate") ||
    message.includes("ssl")
  ) {
    code = "tls_failure"
  } else if (message.includes("429") || message.includes("rate limit")) {
    code = "browser_rate_limit"
  }

  return { code, ownerMessage: OWNER_MESSAGES[code] }
}
