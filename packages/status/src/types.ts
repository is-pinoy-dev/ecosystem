export type DnsStatus = "live" | "propagating" | "error";
export type HttpStatus = "up" | "down" | "unchecked";
export type OverallStatus = "operational" | "degraded" | "propagating";
export type SslStatus = "valid" | "expiring" | "expired" | "unknown";

export interface SslResult {
  status: SslStatus;
  expiresAt: string | null;
  issuer: string | null;
}

export interface SubdomainCheck {
  subdomain: string;
  dns_status: DnsStatus;
  http_status: HttpStatus;
  overall: OverallStatus;
  ssl_status: SslStatus | null;
  ssl_expires_at: string | null;
  ssl_issuer: string | null;
  ssl_checked_at: string | null;
  last_checked: string;
}

export interface SubdomainStatus extends SubdomainCheck {
  since: string;
}
