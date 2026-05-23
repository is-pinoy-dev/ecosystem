import type { DNSRecord } from "@is-pinoy-dev/schemas";

/**
 * Normalizes a raw content string by record type so both local values and
 * Cloudflare-returned values can be compared on equal footing.
 *
 * - TXT: wraps bare values in double-quotes (CF always returns quoted TXT content)
 * - CNAME: strips trailing dot and lowercases (DNS is case-insensitive; some
 *   providers/resolvers append a trailing dot to the FQDN)
 */
export function normalizeContent(type: string, content: string): string {
  if (type === "TXT") {
    return content.startsWith('"') && content.endsWith('"')
      ? content
      : `"${content}"`;
  }
  if (type === "CNAME") {
    return content.replace(/\.$/, "").toLowerCase();
  }
  return content;
}

export function normalizeRecordContent(record: DNSRecord): string {
  return normalizeContent(record.type, record.value);
}
