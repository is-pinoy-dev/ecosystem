import { useLoaderData } from "react-router";
import { useState } from "react";
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

const DNS_LABEL: Record<SubdomainStatus["dns_status"], string> = {
  live: "✅ Live",
  propagating: "⏳ Propagating",
  error: "❌ Error",
};

const HTTP_LABEL: Record<SubdomainStatus["http_status"], string> = {
  up: "✅ Up",
  down: "❌ Down",
  unchecked: "—",
};

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
  const [search, setSearch] = useState("");

  const filtered = statuses.filter((s) =>
    s.subdomain.toLowerCase().includes(search.toLowerCase())
  );

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
    <main className="min-h-screen bg-background text-foreground p-6 md:p-10">
      <h1 className="font-pixel text-primary text-sm md:text-base mb-8 leading-loose">
        [ IS-PINOY.DEV STATUS ]
      </h1>

      <div className="flex flex-wrap gap-6 mb-8 font-pixel text-[9px]">
        <span className="text-green-400">{counts.operational} OPERATIONAL</span>
        <span className="text-primary">{counts.propagating} PROPAGATING</span>
        <span className="text-red-400">{counts.degraded} DEGRADED</span>
      </div>

      <input
        type="text"
        placeholder="SEARCH SUBDOMAIN..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm mb-6 px-4 py-2 bg-card border-2 border-border text-foreground font-pixel text-[9px] outline-none focus:border-primary"
      />

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
                  STATUS
                </th>
                <th className="text-left p-4 text-muted-foreground font-normal">
                  SINCE
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.subdomain}
                  className="border-b border-border hover:bg-card/50 transition-colors"
                >
                  <td className="p-4 text-foreground">
                    {s.subdomain}.is-pinoy.dev
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {DNS_LABEL[s.dns_status]}
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {HTTP_LABEL[s.http_status]}
                  </td>
                  <td className="p-4">
                    <StatusBadge status={s.overall} />
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {formatRelative(s.since)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {lastChecked && (
        <p className="mt-8 font-pixel text-muted-foreground text-[8px]">
          LAST CHECKED: {formatRelative(lastChecked)}
        </p>
      )}
    </main>
  );
}
