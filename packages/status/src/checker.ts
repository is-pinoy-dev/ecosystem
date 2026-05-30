import type { DnsStatus, HttpStatus, OverallStatus, SslResult, SslStatus } from "./types.js";

interface DohResponse {
  Status: number;
  Answer?: unknown[];
}

export async function checkDns(fqdn: string): Promise<DnsStatus> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    const headers = { accept: "application/dns-json" };
    const signal = controller.signal;

    const aRes = await fetch(
      `https://1.1.1.1/dns-query?name=${fqdn}&type=A`,
      { headers, signal }
    );
    const a = (await aRes.json()) as DohResponse;
    if (a.Status === 0 && (a.Answer?.length ?? 0) > 0) return "live";

    const cnameRes = await fetch(
      `https://1.1.1.1/dns-query?name=${fqdn}&type=CNAME`,
      { headers, signal }
    );
    const cname = (await cnameRes.json()) as DohResponse;
    if (cname.Status === 0 && (cname.Answer?.length ?? 0) > 0) return "live";

    return "propagating";
  } catch {
    return "error";
  } finally {
    clearTimeout(timer);
  }
}

const UP_STATUSES = new Set([401, 403]);

export async function checkHttp(fqdn: string): Promise<HttpStatus> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`https://${fqdn}`, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
    });
    if (res.ok || UP_STATUSES.has(res.status)) return "up";
    return "down";
  } catch {
    return "down";
  } finally {
    clearTimeout(timer);
  }
}

export function deriveOverall(dns: DnsStatus, http: HttpStatus): OverallStatus {
  if (dns === "propagating") return "propagating";
  if (dns === "error") return "degraded";
  if (http === "up") return "operational";
  return "degraded";
}

interface CrtShEntry {
  not_after: string;
  issuer_name: string;
}

const SSL_EXPIRING_DAYS = 14;

export async function checkSsl(
  fqdn: string,
  httpReachable: boolean
): Promise<SslResult> {
  if (!httpReachable) {
    return { status: "unknown", expiresAt: null, issuer: null };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(
      `https://crt.sh/?q=${encodeURIComponent(fqdn)}&output=json`,
      {
        headers: { "User-Agent": "is-pinoy.dev status worker" },
        signal: controller.signal,
      }
    );
    if (!res.ok) return { status: "unknown", expiresAt: null, issuer: null };

    const entries = (await res.json()) as CrtShEntry[];
    if (!Array.isArray(entries) || entries.length === 0) {
      return { status: "unknown", expiresAt: null, issuer: null };
    }

    // crt.sh emits timezone-less not_after (e.g. "2026-08-28T23:59:59"), which
    // Date parses as local time. Correct only because the Worker runtime is UTC.
    const latest = entries.reduce((a, b) =>
      new Date(b.not_after).getTime() > new Date(a.not_after).getTime() ? b : a
    );
    const expiresAt = new Date(latest.not_after).toISOString();
    const daysLeft =
      (new Date(expiresAt).getTime() - Date.now()) / 86_400_000;
    const status: SslStatus =
      daysLeft < 0 ? "expired" : daysLeft < SSL_EXPIRING_DAYS ? "expiring" : "valid";

    return { status, expiresAt, issuer: latest.issuer_name ?? null };
  } catch {
    return { status: "unknown", expiresAt: null, issuer: null };
  } finally {
    clearTimeout(timer);
  }
}
