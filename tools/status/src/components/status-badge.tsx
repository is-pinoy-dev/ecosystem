import type { DnsStatus, HttpStatus, OverallStatus, SslStatus } from "~/types";

type Config = {
  label: string;
  dot: string;
  badge: string;
  pulse?: boolean;
  blink?: boolean;
};

function Badge({ label, dot, badge, pulse, blink }: Config) {
  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1.5 font-pixel text-[8px] ${badge}`}
    >
      <span
        className={`inline-block w-1.5 h-1.5 flex-shrink-0 ${dot} ${pulse ? "animate-pulse" : ""}`}
        style={blink ? { animation: "pixel-blink 1s step-end infinite" } : undefined}
      />
      {label}
    </span>
  );
}

const OVERALL_CONFIG: Record<OverallStatus, Config> = {
  operational: {
    label: "OPERATIONAL",
    dot: "bg-green-500",
    badge: "bg-green-500/10 border border-green-500/40 text-green-400",
    pulse: true,
  },
  propagating: {
    label: "PROPAGATING",
    dot: "bg-primary",
    badge: "bg-primary/10 border border-primary/40 text-primary",
    blink: true,
  },
  unstable: {
    label: "DEGRADED",
    dot: "bg-red-500",
    badge: "bg-red-500/10 border border-red-500/40 text-red-400",
  },
};

const DNS_CONFIG: Record<DnsStatus, Config> = {
  live: {
    label: "LIVE",
    dot: "bg-green-500",
    badge: "bg-green-500/10 border border-green-500/40 text-green-400",
    pulse: true,
  },
  propagating: {
    label: "PROPAGATING",
    dot: "bg-primary",
    badge: "bg-primary/10 border border-primary/40 text-primary",
    blink: true,
  },
  error: {
    label: "ERROR",
    dot: "bg-red-500",
    badge: "bg-red-500/10 border border-red-500/40 text-red-400",
  },
};

const HTTP_CONFIG: Record<HttpStatus, Config> = {
  up: {
    label: "UP",
    dot: "bg-green-500",
    badge: "bg-green-500/10 border border-green-500/40 text-green-400",
    pulse: true,
  },
  down: {
    label: "DOWN",
    dot: "bg-red-500",
    badge: "bg-red-500/10 border border-red-500/40 text-red-400",
  },
  unchecked: {
    label: "—",
    dot: "bg-muted-foreground/40",
    badge: "bg-muted/20 border border-border text-muted-foreground",
  },
};

const SSL_CONFIG: Record<SslStatus, Config> = {
  valid: {
    label: "VALID",
    dot: "bg-green-500",
    badge: "bg-green-500/10 border border-green-500/40 text-green-400",
    pulse: true,
  },
  expiring: {
    label: "EXPIRING",
    dot: "bg-primary",
    badge: "bg-primary/10 border border-primary/40 text-primary",
    blink: true,
  },
  expired: {
    label: "EXPIRED",
    dot: "bg-red-500",
    badge: "bg-red-500/10 border border-red-500/40 text-red-400",
  },
  unknown: {
    label: "—",
    dot: "bg-muted-foreground/40",
    badge: "bg-muted/20 border border-border text-muted-foreground",
  },
};

export function StatusBadge({ status }: { status: OverallStatus }) {
  return <Badge {...OVERALL_CONFIG[status]} />;
}

export function DnsBadge({ status }: { status: DnsStatus }) {
  return <Badge {...DNS_CONFIG[status]} />;
}

export function HttpBadge({ status }: { status: HttpStatus }) {
  return <Badge {...HTTP_CONFIG[status]} />;
}

export function SslBadge({ status }: { status: SslStatus | null }) {
  return <Badge {...SSL_CONFIG[status ?? "unknown"]} />;
}
