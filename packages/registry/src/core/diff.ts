import {
  type Domain,
  type DNSRecord,
  type DNSAction,
  type CloudflareRecord,
} from "@is-pinoy-dev/schemas";
import { env } from "./env.js";
import { normalizeRecordContent } from "./normalize.js";

function toFQDN(subdomain: string) {
  return `${subdomain}.${env("DOMAIN")}`;
}

function toTXTRecordFQDN(provider: string) {
  return `_${provider}.${env("DOMAIN")}`;
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

  // Build O(1) lookup maps keyed by "fqdn:type:content" and "fqdn:type".
  const exactMap = new Map<string, CloudflareRecord[]>();
  const byTypeMap = new Map<string, CloudflareRecord[]>();

  for (const a of actual) {
    const ek = `${a.name}:${a.type}:${a.content}`;
    const tk = `${a.name}:${a.type}`;
    if (!exactMap.has(ek)) exactMap.set(ek, []);
    exactMap.get(ek)!.push(a);
    if (!byTypeMap.has(tk)) byTypeMap.set(tk, []);
    byTypeMap.get(tk)!.push(a);
  }

  // Track claimed records so each actual record is matched at most once
  // (prevents double-matching when a domain has multiple records of the same type).
  const claimed = new Set<string>();

  for (const d of desiredFlat) {
    const normalizedContent = normalizeRecordContent(d.record);
    const desiredProxied = "proxied" in d.record ? (d.record.proxied ?? false) : false;
    const desiredTTL = d.record.ttl ?? 1;

    const ek = `${d.fqdn}:${d.record.type}:${normalizedContent}`;
    const contentMatches = exactMap.get(ek) ?? [];
    const contentMatch = contentMatches.find((a) => !claimed.has(a.id));

    if (contentMatch) {
      claimed.add(contentMatch.id);
      // Content matches but proxied or TTL may still differ.
      const actualProxied = contentMatch.proxied ?? false;
      const actualTTL = contentMatch.ttl ?? 1;
      const proxiedChanged = actualProxied !== desiredProxied;
      // Cloudflare forces TTL=1 on proxied records, so skip TTL check for those.
      const ttlChanged = !desiredProxied && actualTTL !== desiredTTL;

      if (proxiedChanged || ttlChanged) {
        actions.push({ type: "UPDATE", id: contentMatch.id, fqdn: d.fqdn, record: d.record });
      }
      continue;
    }

    // Same fqdn+type but different content — UPDATE an unclaimed record.
    const tk = `${d.fqdn}:${d.record.type}`;
    const typeCandidates = byTypeMap.get(tk) ?? [];
    const updateTarget = typeCandidates.find((a) => !claimed.has(a.id));

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
