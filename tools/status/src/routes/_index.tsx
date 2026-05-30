import { Link, useLoaderData, useNavigate } from "react-router";
import { useState } from "react";
import { ChevronRight, ExternalLink } from "lucide-react";
import { DnsBadge, HttpBadge, StatusBadge, SslBadge } from "~/components/status-badge";
import { NavBar } from "~/components/nav-bar";
import { StatusInfoPopover } from "~/components/status-info-popover";
import type { Route } from "./+types/_index";
import type { OverallStatus, SubdomainStatus } from "~/types";

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

export default function StatusPage() {
  const { statuses } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OverallStatus | null>(null);

  const filtered = statuses.filter((s) => {
    const matchesSearch = s.subdomain.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === null || s.overall === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const counts = {
    operational: statuses.filter((s) => s.overall === "operational").length,
    propagating: statuses.filter((s) => s.overall === "propagating").length,
    degraded: statuses.filter((s) => s.overall === "degraded").length,
  };

  const lastChecked =
    statuses.length > 0
      ? statuses.reduce(
          (latest, s) => (s.last_checked > latest ? s.last_checked : latest),
          statuses[0].last_checked
        )
      : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="pt-20 px-6 pb-6 md:px-10 md:pb-10 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center gap-6 mb-8 mt-4 font-pixel text-[9px]">
        <span className="text-green-400">{counts.operational} OPERATIONAL</span>
        <span className="text-primary">{counts.propagating} PROPAGATING</span>
        <span className="text-red-400">{counts.degraded} DEGRADED</span>
        {lastChecked && (
          <span className="text-muted-foreground sm:ml-auto">
            UPDATED {formatRelative(lastChecked)}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input
          type="text"
          placeholder="SEARCH SUBDOMAIN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs px-4 py-2 bg-card border-2 border-border text-foreground font-pixel text-[9px] outline-none focus:border-primary"
        />
        {(
          [
            { value: null, label: "ALL" },
            { value: "operational" as const, label: "OPERATIONAL" },
            { value: "propagating" as const, label: "PROPAGATING" },
            { value: "degraded" as const, label: "DEGRADED" },
          ] satisfies { value: OverallStatus | null; label: string }[]
        ).map(({ value, label }) => (
          <button
            key={label}
            onClick={() => setStatusFilter(value)}
            className={`px-3 py-2 font-pixel text-[8px] border-2 transition-colors cursor-pointer ${
              statusFilter === value
                ? "bg-primary text-black border-primary"
                : "bg-transparent text-muted-foreground border-border hover:border-primary hover:text-primary"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="font-pixel text-muted-foreground text-[9px]">
          {statuses.length === 0
            ? "NO DATA YET — FIRST CHECK PENDING"
            : "NO RESULTS"}
        </p>
      ) : (
        <div className="overflow-x-auto border-2 border-border shadow-[4px_4px_0px_#000]">
          <table className="w-full text-[9px] font-pixel">
            <thead>
              <tr className="border-b-2 border-border bg-card">
                <th className="text-left p-4 text-muted-foreground font-normal">
                  SUBDOMAIN
                </th>
                <th className="text-left p-4 text-muted-foreground font-normal">
                  DNS
                </th>
                <th className="text-left p-4 text-muted-foreground font-normal">
                  SITE
                </th>
                <th className="text-left p-4 text-muted-foreground font-normal">
                  SSL
                </th>
                <th className="text-left p-4 text-muted-foreground font-normal">
                  <span className="inline-flex items-center gap-2">
                    STATUS
                    <StatusInfoPopover />
                  </span>
                </th>
                <th className="text-left p-4 text-muted-foreground font-normal">
                  SINCE
                </th>
                <th className="p-4">
                  <span className="sr-only">Details</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.subdomain}
                  onClick={() => navigate(`/${s.subdomain}`)}
                  className="group border-b border-border hover:bg-card/50 transition-colors cursor-pointer"
                >
                  <td className="p-4 font-mono text-xs">
                    <span className="inline-flex items-center gap-2">
                      <Link
                        to={`/${s.subdomain}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-foreground group-hover:text-primary transition-colors"
                      >
                        {s.subdomain}.is-pinoy.dev
                      </Link>
                      <a
                        href={`https://${s.subdomain}.is-pinoy.dev`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Open ${s.subdomain}.is-pinoy.dev in a new tab`}
                        className="text-muted-foreground hover:text-primary"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </span>
                  </td>
                  <td className="p-4">
                    <DnsBadge status={s.dns_status} />
                  </td>
                  <td className="p-4">
                    <HttpBadge status={s.http_status} />
                  </td>
                  <td className="p-4">
                    <SslBadge status={s.ssl_status} />
                  </td>
                  <td className="p-4">
                    <StatusBadge status={s.overall} />
                  </td>
                  <td className="p-4 text-muted-foreground font-mono text-xs">
                    {formatRelative(s.since)}
                  </td>
                  <td className="p-4">
                    <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      </main>
    </div>
  );
}
