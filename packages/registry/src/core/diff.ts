import {
  type Domain,
  type DNSRecord,
  type DNSAction,
  type CloudflareRecord,
} from "@is-pinoy-dev/schemas";
import { env } from "./env.js";
import { normalizeContent, normalizeRecordContent } from "./normalize.js";
import { verificationTargetFqdn } from "./vercel.js";

function toFQDN(subdomain: string) {
  return `${subdomain}.${env("DOMAIN")}`;
}

function toTXTRecordFQDN(provider: string, subdomain: string) {
  return `_${provider}.${subdomain}.${env("DOMAIN")}`;
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
        fqdn = toTXTRecordFQDN(record.provider as string, domain.subdomain);
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
  // Content is normalized on both sides so format differences (e.g. trailing
  // dots or casing in CNAME targets) do not produce false UPDATE actions.
  const exactMap = new Map<string, CloudflareRecord[]>();
  const byTypeMap = new Map<string, CloudflareRecord[]>();

  for (const a of actual) {
    const ek = `${a.name}:${a.type}:${normalizeContent(a.type, a.content)}`;
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

  // Vercel verification TXTs live at the shared challenge name and are
  // single-use: once no active domain file declares a value, it is an orphan
  // (e.g. removed by the cleanup flow after the domain verified). Deletion is
  // tightly scoped — only vc-domain-verify values whose embedded target is a
  // strict subdomain of the zone, so the org's own apex verification and any
  // unrelated TXT records are never touched.
  const vercelChallengeFqdn = toTXTRecordFQDN("vercel");
  const desiredChallengeValues = new Set(
    desiredFlat
      .filter((d) => d.fqdn === vercelChallengeFqdn)
      .map((d) => normalizeRecordContent(d.record)),
  );

  // The registry writes challenges at `_vercel.<zone>`, but legacy records
  // may sit at `_vercel.<subdomain>.<zone>` — cover both name shapes.
  function isVercelChallengeName(name: string): boolean {
    return (
      name === vercelChallengeFqdn ||
      (name.startsWith("_vercel.") && name.endsWith(`.${env("DOMAIN")}`))
    );
  }

  function isOrphanedVerification(a: CloudflareRecord): boolean {
    if (a.type !== "TXT" || !isVercelChallengeName(a.name)) return false;
    if (claimed.has(a.id)) return false;
    if (desiredChallengeValues.has(normalizeContent(a.type, a.content))) {
      return false;
    }
    const target = verificationTargetFqdn(a.content);
    return target !== null && target.endsWith(`.${env("DOMAIN")}`);
  }

  for (const a of actual) {
    const isTXTRecordMatch =
      a.type === "TXT" && destroyedTXTValues.has(a.content);

    if (
      destroyedFqdns.has(a.name) ||
      isTXTRecordMatch ||
      isOrphanedVerification(a)
    ) {
      actions.push({ type: "DELETE", id: a.id, fqdn: a.name });
    }
  }

  return actions;
}
