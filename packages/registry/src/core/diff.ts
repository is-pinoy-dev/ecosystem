import {
  type Domain,
  type DNSRecord,
  dnsActionSchema,
  type DNSAction,
  type CloudflareRecord,
} from "@is-pinoy/schemas";
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

  for (const d of desiredFlat) {
    const match = actual.find(
      (a) => a.name === d.fqdn && a.type === d.record.type,
    );

    if (!match) {
      const action: DNSAction = {
        type: "CREATE",
        fqdn: d.fqdn,
        record: d.record,
      };
      actions.push(dnsActionSchema.parse(action));
      continue;
    }

    if (match.content !== normalizeTXTValue(d.record)) {
      const action: DNSAction = {
        type: "UPDATE",
        id: match.id,
        fqdn: d.fqdn,
        record: d.record,
      };
      actions.push(dnsActionSchema.parse(action));
    }
  }

  for (const a of actual) {
    const isTXTRecordMatch =
      a.type === "TXT" && destroyedTXTValues.has(a.content);

    if (destroyedFqdns.has(a.name) || isTXTRecordMatch) {
      const action: DNSAction = {
        type: "DELETE",
        id: a.id,
        fqdn: a.name,
      };
      actions.push(dnsActionSchema.parse(action));
    }
  }

  return actions;
}
