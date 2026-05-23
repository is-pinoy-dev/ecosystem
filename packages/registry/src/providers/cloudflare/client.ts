import "dotenv/config";

import { type CloudflareRecord, type DNSRecord } from "@is-pinoy-dev/schemas";
import { env } from "../../core/env.js";

function normalizeContent(record: DNSRecord): string {
  if (record.type === "TXT") {
    const value = record.value;
    if (!value.startsWith('"') || !value.endsWith('"')) {
      return `"${value}"`;
    }
    return value;
  }
  return record.value;
}

async function cfRequest(
  path: string,
  method: string,
  body?: Record<string, unknown>,
): Promise<CloudflareRecord[] | CloudflareRecord> {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${env("CLOUDFLARE_ZONE_ID")}/${path}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${env("CLOUDFLARE_API_TOKEN")}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    },
  );

  const json = (await res.json()) as {
    success: boolean;
    result: CloudflareRecord;
    errors: unknown[];
  };

  if (!json.success) {
    throw new Error(JSON.stringify(json.errors));
  }

  return json.result;
}

export async function createRecord<TRecord extends DNSRecord>(
  record: TRecord,
  fqdn: string,
) {
  return cfRequest("dns_records", "POST", {
    type: record.type,
    name: fqdn,
    content: normalizeContent(record),
    ttl: record.ttl ?? 1,
    proxied: "proxied" in record ? record.proxied : false,
  });
}

export async function updateRecord<TRecord extends DNSRecord>(
  id: string,
  record: TRecord,
  fqdn: string,
) {
  return cfRequest(`dns_records/${id}`, "PUT", {
    type: record.type,
    name: fqdn,
    content: normalizeContent(record),
    ttl: record.ttl ?? 1,
    proxied: "proxied" in record ? record.proxied : false,
  });
}

export async function deleteRecord(id: string) {
  return cfRequest(`dns_records/${id}`, "DELETE");
}

export async function listRecords() {
  return cfRequest("dns_records?per_page=5000", "GET");
}
