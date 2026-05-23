import "dotenv/config";

import { type CloudflareRecord, type DNSRecord } from "@is-pinoy-dev/schemas";
import { env } from "../../core/env.js";
import { normalizeRecordContent } from "../../core/normalize.js";

async function cfRequest<T>(
  path: string,
  method: string,
  body?: Record<string, unknown>,
): Promise<T> {
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
    result: T;
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
  return cfRequest<CloudflareRecord>("dns_records", "POST", {
    type: record.type,
    name: fqdn,
    content: normalizeRecordContent(record),
    ttl: record.ttl ?? 1,
    proxied: "proxied" in record ? record.proxied : false,
  });
}

export async function updateRecord<TRecord extends DNSRecord>(
  id: string,
  record: TRecord,
  fqdn: string,
) {
  return cfRequest<CloudflareRecord>(`dns_records/${id}`, "PUT", {
    type: record.type,
    name: fqdn,
    content: normalizeRecordContent(record),
    ttl: record.ttl ?? 1,
    proxied: "proxied" in record ? record.proxied : false,
  });
}

export async function deleteRecord(id: string) {
  return cfRequest<CloudflareRecord>(`dns_records/${id}`, "DELETE");
}

export async function listRecords() {
  return cfRequest<CloudflareRecord[]>("dns_records?per_page=5000", "GET");
}
