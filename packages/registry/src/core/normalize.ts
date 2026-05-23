import type { DNSRecord } from "@is-pinoy-dev/schemas";

export function normalizeRecordContent(record: DNSRecord): string {
  if (record.type === "TXT") {
    const value = record.value;
    return value.startsWith('"') && value.endsWith('"') ? value : `"${value}"`;
  }
  return record.value;
}
