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

// Verification TXTs live at a shared, provider-scoped name rather than a
// per-subdomain one: Vercel's own ownership check resolves at the
// registrable-domain boundary, which — since is-pinoy.dev is not on the
// Public Suffix List — is is-pinoy.dev itself, not <subdomain>.is-pinoy.dev.
// A per-subdomain TXT name is simply never queried by Vercel, so it can't be
// used until the zone is PSL-listed. Multiple subdomains' challenges safely
// coexist at this one name because DNS allows multiple TXT records per name,
// and the matching logic below disambiguates them by embedded target.
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

/**
 * Match key for the fqdn+type UPDATE fallback. Plain "fqdn:type" is enough
 * for record types that only ever have one value per domain (A, CNAME), but
 * TXT verification records from *different* subdomains legitimately share
 * the same fqdn+type at the shared challenge name — matching on that alone
 * would let one subdomain's desired record steal and overwrite another
 * subdomain's actual challenge value. When the content carries a
 * vc-domain-verify target, fold it into the key so only records for the
 * *same* subdomain are considered candidates for an UPDATE.
 */
function typeMatchKey(fqdn: string, type: string, content: string): string {
  const target = type === "TXT" ? verificationTargetFqdn(content) : null;
  return target ? `${fqdn}:${type}:${target}` : `${fqdn}:${type}`;
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
    const tk = typeMatchKey(a.name, a.type, a.content);
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

    // Same fqdn+type (and, for TXT, same embedded target) but different
    // content — UPDATE an unclaimed record.
    const tk = typeMatchKey(d.fqdn, d.record.type, d.record.value);
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

  // Vercel verification TXTs are single-use: once a domain is verified the
  // record is dead weight, and the cleanup flow may strip it from the domain
  // file while it still lingers in Cloudflare. If a domain still declares its
  // record, the matching loop above already claimed the actual record for
  // its embedded target (as either an exact match or an UPDATE) — any
  // unclaimed TXT at a `_vercel.*` name is therefore an orphan. This also
  // catches stray `_vercel.<subdomain>.<zone>`-shaped records from before the
  // shared-name scheme. Deletion is tightly scoped to values whose embedded
  // target is a strict subdomain of the zone, so the org's own apex
  // verification and unrelated TXT records are never touched.
  function isOrphanedVerification(a: CloudflareRecord): boolean {
    if (a.type !== "TXT" || claimed.has(a.id)) return false;
    if (!a.name.startsWith("_vercel.") || !a.name.endsWith(`.${env("DOMAIN")}`)) {
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
