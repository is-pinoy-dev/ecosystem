import type { Domain, ResolvedDomains } from "@is-pinoy-dev/schemas";
import { env } from "./env.js";

// Vercel domain-verification cleanup.
//
// Vercel's `vc-domain-verify` TXT challenge is single-use: once the domain is
// attached and verified, the record is dead weight (re-verification always
// issues a fresh token). Verification status is not queryable from outside a
// user's Vercel account, but it is observable: a domain pointed at Vercel that
// is NOT attached/verified is answered by Vercel's edge with an
// `x-vercel-error` header (NOT_FOUND / DEPLOYMENT_NOT_FOUND), while a
// verified, working domain serves the user's site without it. This module
// identifies cleanup candidates, probes them, and strips the TXT entries from
// domain records — the decision to commit those edits stays with the caller.

export const VERCEL_VERIFICATION_PREFIX = "vc-domain-verify=";

const VERCEL_CNAME_PATTERN = /\.vercel-dns[a-z0-9-]*\.com\.?$/i;
const VERCEL_A_PATTERN = /^76\.76\.21\.\d{1,3}$/;

type TxtEntry = { value: string; provider?: string; ttl?: number };

function asList<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

export function isVercelVerificationTxt(record: TxtEntry): boolean {
  return (
    record.provider === "vercel" &&
    record.value.startsWith(VERCEL_VERIFICATION_PREFIX)
  );
}

/** True when the domain's records target Vercel (CNAME to vercel-dns or A 76.76.21.x). */
export function pointsAtVercel(records: Domain["records"]): boolean {
  const cnames = asList(records.CNAME);
  if (cnames.some((r) => VERCEL_CNAME_PATTERN.test(r.value))) return true;
  const aRecords = asList(records.A);
  return aRecords.some((r) => VERCEL_A_PATTERN.test(r.value));
}

export interface VercelCleanupCandidate {
  file: string;
  subdomain: string;
  fqdn: string;
  /** The vc-domain-verify TXT values that would be removed. */
  verificationValues: string[];
}

export interface VercelCleanupSkipped {
  file: string;
  subdomain: string;
  reason: string;
}

export interface VercelCleanupScan {
  candidates: VercelCleanupCandidate[];
  skipped: VercelCleanupSkipped[];
}

/**
 * Scans the registry for domains carrying a Vercel verification TXT record.
 * Domains whose records no longer point at Vercel are reported as skipped —
 * conservative by design: the probe below could not attribute a healthy
 * response to Vercel for them anyway.
 */
export function findVercelCleanupCandidates(
  domains: ResolvedDomains,
): VercelCleanupScan {
  const candidates: VercelCleanupCandidate[] = [];
  const skipped: VercelCleanupSkipped[] = [];

  for (const domain of domains) {
    if (domain.destroy) continue;

    const verificationValues = asList(domain.records.TXT)
      .filter(isVercelVerificationTxt)
      .map((r) => r.value);
    if (verificationValues.length === 0) continue;

    if (!pointsAtVercel(domain.records)) {
      skipped.push({
        file: domain.file,
        subdomain: domain.subdomain,
        reason: "records do not point at Vercel",
      });
      continue;
    }

    candidates.push({
      file: domain.file,
      subdomain: domain.subdomain,
      fqdn: `${domain.subdomain}.${env("DOMAIN")}`,
      verificationValues,
    });
  }

  return { candidates, skipped };
}

export type VercelProbeReason =
  | "ok"
  | "vercel-error"
  | "not-vercel"
  | "unreachable";

export interface VercelProbeResult {
  fqdn: string;
  /** Served by Vercel's edge with no x-vercel-error — i.e. attached and verified. */
  healthy: boolean;
  reason: VercelProbeReason;
  detail?: string;
  status?: number;
}

export interface VercelProbeOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

/**
 * Probes https://<fqdn>/ and classifies the response. The application's own
 * status code is irrelevant (a user's 404 page is still a verified domain) —
 * what matters is that Vercel's edge answered without an `x-vercel-error`.
 */
export async function probeVercelDomain(
  fqdn: string,
  options: VercelProbeOptions = {},
): Promise<VercelProbeResult> {
  const { fetchImpl = fetch, timeoutMs = 10_000 } = options;

  let response: Response;
  try {
    response = await fetchImpl(`https://${fqdn}/`, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    return {
      fqdn,
      healthy: false,
      reason: "unreachable",
      detail: err instanceof Error ? err.message : String(err),
    };
  }

  const vercelError = response.headers.get("x-vercel-error");
  if (vercelError) {
    return {
      fqdn,
      healthy: false,
      reason: "vercel-error",
      detail: vercelError,
      status: response.status,
    };
  }

  const server = response.headers.get("server") ?? "";
  const servedByVercel =
    /vercel/i.test(server) || response.headers.has("x-vercel-id");
  if (!servedByVercel) {
    return {
      fqdn,
      healthy: false,
      reason: "not-vercel",
      detail: server || "no server header",
      status: response.status,
    };
  }

  return { fqdn, healthy: true, reason: "ok", status: response.status };
}

export interface StripResult {
  records: Domain["records"];
  removed: string[];
}

/**
 * Returns a copy of the records with vc-domain-verify TXT entries removed.
 * Other TXT entries are preserved; the TXT key is dropped entirely when
 * nothing remains, and an array that shrinks to one entry collapses back to
 * the single-object form.
 */
export function stripVercelVerificationTxt(
  records: Domain["records"],
): StripResult {
  const txt = asList(records.TXT);
  const removed = txt.filter(isVercelVerificationTxt).map((r) => r.value);
  if (removed.length === 0) {
    return { records, removed };
  }

  const remaining = txt.filter((r) => !isVercelVerificationTxt(r));
  const next: Domain["records"] = { ...records };
  if (remaining.length === 0) {
    delete next.TXT;
  } else if (remaining.length === 1) {
    next.TXT = remaining[0];
  } else {
    next.TXT = remaining;
  }

  return { records: next, removed };
}

/**
 * Extracts the FQDN a vc-domain-verify value claims to verify, e.g.
 * `vc-domain-verify=juan.is-pinoy.dev,abc123` → `juan.is-pinoy.dev`.
 * Accepts Cloudflare's quoted TXT content form. Returns null for values
 * that are not verification challenges.
 */
export function verificationTargetFqdn(content: string): string | null {
  const unquoted =
    content.startsWith('"') && content.endsWith('"')
      ? content.slice(1, -1)
      : content;
  if (!unquoted.startsWith(VERCEL_VERIFICATION_PREFIX)) return null;
  const rest = unquoted.slice(VERCEL_VERIFICATION_PREFIX.length);
  const fqdn = rest.split(",")[0]?.trim().toLowerCase();
  return fqdn ? fqdn : null;
}
