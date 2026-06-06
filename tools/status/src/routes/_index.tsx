import { useLoaderData } from "react-router";
import { NavBar } from "~/components/nav-bar";
import { StatusBadge } from "~/components/status-badge";
import type { Route } from "./+types/_index";
import type { SubdomainStatus } from "~/types";

export const meta: Route.MetaFunction = () => [
  { title: "is-pinoy.dev — Status" },
];

export async function loader({ context }: Route.LoaderArgs) {
  const { results } = await context.cloudflare.env.STATUS_DB.prepare(
    "SELECT * FROM subdomain_status ORDER BY subdomain ASC"
  ).all<SubdomainStatus>();
  return { statuses: results };
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function MetricCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "green" | "red" | "yellow" | "muted";
}) {
  const accentClass =
    accent === "green"
      ? "text-green-400"
      : accent === "red"
        ? "text-red-400"
        : accent === "yellow"
          ? "text-primary"
          : "text-foreground";

  return (
    <div className="flex flex-col gap-3 border-2 border-border p-5 shadow-[4px_4px_0px_#000]">
      <span className="font-pixel text-[8px] text-muted-foreground">{label}</span>
      <span className={`font-pixel text-lg ${accentClass}`}>{value}</span>
      {sub && (
        <span className="font-pixel text-[8px] text-muted-foreground">{sub}</span>
      )}
    </div>
  );
}

export default function StatusPage() {
  const { statuses } = useLoaderData<typeof loader>();

  const total = statuses.length;
  const operational = statuses.filter((s) => s.overall === "operational").length;
  const unstable = statuses.filter((s) => s.overall === "unstable").length;
  const propagating = statuses.filter((s) => s.overall === "propagating").length;
  const sslValid = statuses.filter((s) => s.ssl_status === "valid").length;
  const sslExpiring = statuses.filter((s) => s.ssl_status === "expiring").length;
  const sslExpired = statuses.filter((s) => s.ssl_status === "expired").length;
  const uptimePct =
    total > 0 ? Math.round((operational / total) * 100) : 0;

  const lastChecked =
    statuses.length > 0
      ? statuses.reduce(
          (latest, s) => (s.last_checked > latest ? s.last_checked : latest),
          statuses[0].last_checked
        )
      : null;

  const overallHealthy = unstable === 0 && propagating === 0;
  const overallStatus =
    unstable > 0
      ? "unstable"
      : propagating > 0
        ? "propagating"
        : total > 0
          ? "operational"
          : ("propagating" as const);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="pt-20 px-6 pb-6 md:px-10 md:pb-10 max-w-4xl mx-auto">
        <div className="mt-6 flex flex-wrap items-start gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="font-pixel text-[10px] text-muted-foreground">
              SYSTEM STATUS
            </h1>
            <div className="flex items-center gap-3">
              <StatusBadge status={overallStatus} />
              <span className="font-pixel text-[9px] text-foreground">
                {overallHealthy
                  ? "ALL SYSTEMS OPERATIONAL"
                  : unstable > 0
                    ? `${unstable} SUBDOMAIN${unstable > 1 ? "S" : ""} DEGRADED`
                    : `${propagating} SUBDOMAIN${propagating > 1 ? "S" : ""} PROPAGATING`}
              </span>
            </div>
          </div>
          {lastChecked && (
            <span className="font-pixel text-[8px] text-muted-foreground md:ml-auto self-end pb-0.5">
              UPDATED {formatRelative(lastChecked)}
            </span>
          )}
        </div>

        {total === 0 ? (
          <p className="mt-10 font-pixel text-muted-foreground text-[9px]">
            NO DATA YET — FIRST CHECK PENDING
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
            <MetricCard
              label="TOTAL SUBDOMAINS"
              value={total}
              sub="REGISTERED DOMAINS"
            />
            <MetricCard
              label="OPERATIONAL"
              value={operational}
              sub={`${uptimePct}% UPTIME RATE`}
              accent="green"
            />
            <MetricCard
              label="DEGRADED"
              value={unstable}
              sub={unstable === 0 ? "ALL CLEAR" : "NEEDS ATTENTION"}
              accent={unstable > 0 ? "red" : "muted"}
            />
            <MetricCard
              label="SSL VALID"
              value={sslValid}
              sub={`OF ${total} CHECKED`}
              accent="green"
            />
            <MetricCard
              label="SSL EXPIRING SOON"
              value={sslExpiring}
              sub="WITHIN 14 DAYS"
              accent={sslExpiring > 0 ? "yellow" : "muted"}
            />
            <MetricCard
              label="SSL EXPIRED"
              value={sslExpired}
              sub={sslExpired === 0 ? "NONE EXPIRED" : "ACTION REQUIRED"}
              accent={sslExpired > 0 ? "red" : "muted"}
            />
          </div>
        )}
      </main>
    </div>
  );
}
