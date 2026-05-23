import {
  type Domain,
  type DNSRecord,
  type DNSAction,
  type CloudflareRecord,
} from "@is-pinoy-dev/schemas";
import { env } from "./env.js";

function toFQDN(subdomain: string) {
  return `${subdomain}.${env("DOMAIN")}`;
}

function toTXTRecordFQDN(provider: string) {
  return `_${provider}.${env("DOMAIN")}`;
}

function normalizeTXTValue(record: DNSRecord): string {
  if (record.type === "TXT") {
    const value = record.value;
    if (!value.startsWith('"') || !value.endsWith('"')) {
      return `"${value}"`;
    }
    return value;
  }
  return record.value;
}

function expandDomain(domain: Domain) {
  const baseFqdn = toFQDN(domain.subdomain);
  const result: { fqdn: string; record: DNSRecord }[] = [];

  for (const [type, records] of Object.entries(domain.records)) {
    if (!records) continue;
    const list = Array.isArray(records) ? records : [records];
    for (const record of list) {
      const dnsRecord = { type: type as DNSRecord["type"], ...record } as DNSRecord;
      let fqdn = baseFqdn;
      if (type === "TXT" && "provider" in record) {
        fqdn = toTXTRecordFQDN(record.provider as string);
      }
      result.push({ fqdn, record: dnsRecord });
    }
  }

  return result;
}

export function diff(
  desired: Domain[],
  actual: CloudflareRecord[],
): DNSAction[] {
  const actions: DNSAction[] = [];

  const activeDomains = desired.filter((d) => !d.destroy);
  const destroyedDomains = desired.filter((d) => d.destroy);

  const desiredFlat = activeDomains.flatMap(expandDomain);

  const destroyedFqdns = new Set(
    destroyedDomains.map((d) => toFQDN(d.subdomain)),
  );

  const destroyedTXTValues = new Set(
    destroyedDomains.flatMap((d) => {
      const result: string[] = [];
      for (const [type, records] of Object.entries(d.records)) {
        if (type !== "TXT" || !records) continue;
        const list = Array.isArray(records) ? records : [records];
        for (const record of list) {
          const value = record.value;
          result.push(
            value.startsWith('"') && value.endsWith('"') ? value : `"${value}"`,
          );
        }
      }
      return result;
    }),
  );

  // Track claimed actual records to prevent the same actual record from
  // matching multiple desired records (multi-value A/TXT records).
  const claimed = new Set<string>();

  for (const d of desiredFlat) {
    const normalizedContent = normalizeTXTValue(d.record);

    // Exact match (same fqdn + type + content) — already in sync, skip.
    const exactMatch = actual.find(
      (a) =>
        !claimed.has(a.id) &&
        a.name === d.fqdn &&
        a.type === d.record.type &&
        a.content === normalizedContent,
    );

    if (exactMatch) {
      claimed.add(exactMatch.id);
      continue;
    }

    // Same fqdn + type but different content — UPDATE the existing record.
    const updateTarget = actual.find(
      (a) =>
        !claimed.has(a.id) && a.name === d.fqdn && a.type === d.record.type,
    );

    if (updateTarget) {
      claimed.add(updateTarget.id);
      actions.push({ type: "UPDATE", id: updateTarget.id, fqdn: d.fqdn, record: d.record });
      continue;
    }

    // No matching actual record — CREATE.
    actions.push({ type: "CREATE", fqdn: d.fqdn, record: d.record });
  }

  for (const a of actual) {
    const isTXTRecordMatch =
      a.type === "TXT" && destroyedTXTValues.has(a.content);

    if (destroyedFqdns.has(a.name) || isTXTRecordMatch) {
      actions.push({ type: "DELETE", id: a.id, fqdn: a.name });
    }
  }

  return actions;
}
