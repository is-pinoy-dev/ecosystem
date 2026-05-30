import type { DnsStatus, HttpStatus, OverallStatus } from "./types";

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
