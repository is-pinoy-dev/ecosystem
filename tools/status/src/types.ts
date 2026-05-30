// Shared types mirrored from worker/types.ts
// The worker/ directory is excluded from the frontend tsconfig,
// so we re-declare these types here for use in src/.

export type DnsStatus = "live" | "propagating" | "error";
export type HttpStatus = "up" | "down" | "unchecked";
export type OverallStatus = "operational" | "degraded" | "propagating";

export interface SubdomainCheck {
  subdomain: string;
  dns_status: DnsStatus;
  http_status: HttpStatus;
  overall: OverallStatus;
  last_checked: string;
}

export interface SubdomainStatus extends SubdomainCheck {
  since: string;
}
