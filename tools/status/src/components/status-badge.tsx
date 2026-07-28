import { Badge } from "@is-pinoy-dev/ui/components/badge"
import { StatusIndicator } from "@is-pinoy-dev/ui/components/status-indicator"
import type { DnsStatus, HttpStatus, OverallStatus, SslStatus } from "~/types"

type Tone = "success" | "warning" | "destructive" | "neutral"

type Config = {
  label: string
  tone: Tone
}

// Status is carried by the label text as well as the colour, so the badge stays
// readable without relying on colour alone.
const TONE_CLASSES: Record<Tone, string> = {
  success: "border-success/40 text-success",
  warning: "border-warning/40 text-warning",
  destructive: "border-destructive/40 text-destructive",
  neutral: "border-border text-muted-foreground",
}

function StatusPill({ label, tone }: Config) {
  return (
    <Badge variant="outline" className={`gap-1.5 ${TONE_CLASSES[tone]}`}>
      <StatusIndicator
        tone={tone === "neutral" ? "neutral" : tone}
        className="size-1.5"
      />
      {label}
    </Badge>
  )
}

const OVERALL_CONFIG: Record<OverallStatus, Config> = {
  operational: { label: "Operational", tone: "success" },
  propagating: { label: "Propagating", tone: "warning" },
  unstable: { label: "Degraded", tone: "destructive" },
}

const DNS_CONFIG: Record<DnsStatus, Config> = {
  live: { label: "Live", tone: "success" },
  propagating: { label: "Propagating", tone: "warning" },
  error: { label: "Error", tone: "destructive" },
}

const HTTP_CONFIG: Record<HttpStatus, Config> = {
  up: { label: "Up", tone: "success" },
  down: { label: "Down", tone: "destructive" },
  unchecked: { label: "Not checked", tone: "neutral" },
}

const SSL_CONFIG: Record<SslStatus, Config> = {
  valid: { label: "Valid", tone: "success" },
  expiring: { label: "Expiring", tone: "warning" },
  expired: { label: "Expired", tone: "destructive" },
  unknown: { label: "Unknown", tone: "neutral" },
}

export function StatusBadge({ status }: { status: OverallStatus }) {
  return <StatusPill {...OVERALL_CONFIG[status]} />
}

export function DnsBadge({ status }: { status: DnsStatus }) {
  return <StatusPill {...DNS_CONFIG[status]} />
}

export function HttpBadge({ status }: { status: HttpStatus }) {
  return <StatusPill {...HTTP_CONFIG[status]} />
}

export function SslBadge({ status }: { status: SslStatus | null }) {
  return <StatusPill {...SSL_CONFIG[status ?? "unknown"]} />
}
