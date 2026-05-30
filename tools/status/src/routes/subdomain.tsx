import { Link, isRouteErrorResponse, useLoaderData } from "react-router";
import { ExternalLink } from "lucide-react";
import { NavBar } from "~/components/nav-bar";
import {
  DnsBadge,
  HttpBadge,
  StatusBadge,
  SslBadge,
} from "~/components/status-badge";
import { fetchOwnerInfo } from "~/lib/owner";
import type { Route } from "./+types/subdomain";
import type { SubdomainStatus } from "~/types";

export const meta: Route.MetaFunction = ({ params }) => [
  { title: `${params.subdomain}.is-pinoy.dev — Status` },
];

export async function loader({ params, context }: Route.LoaderArgs) {
  const subdomain = params.subdomain;
  const status = await context.cloudflare.env.STATUS_DB.prepare(
    "SELECT * FROM subdomain_status WHERE subdomain = ?"
  )
    .bind(subdomain)
    .first<SubdomainStatus>();

  if (!status) {
    throw new Response("Not Found", { status: 404 });
  }

  const owner = await fetchOwnerInfo(subdomain);
  return { status, owner };
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function daysUntil(iso: string | null): string {
  if (!iso) return "";
  const days = Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return `${Math.abs(days)}d ago`;
  return `in ${days}d`;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-pixel text-[8px] text-muted-foreground">{label}</span>
      <div className="font-mono text-xs text-foreground">{children}</div>
    </div>
  );
}

export default function SubdomainDetails() {
  const { status, owner } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="pt-20 px-6 pb-6 md:px-10 md:pb-10 max-w-3xl mx-auto">
        <Link
          to="/"
          className="font-pixel text-[8px] text-muted-foreground hover:text-primary"
        >
          ← BACK
        </Link>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <a
            href={`https://${status.subdomain}.is-pinoy.dev`}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 font-mono text-base md:text-lg text-foreground"
          >
            <span className="underline decoration-primary underline-offset-4 group-hover:text-primary transition-colors">
              {status.subdomain}.is-pinoy.dev
            </span>
            <ExternalLink className="h-4 w-4 text-primary shrink-0" />
          </a>
          <StatusBadge status={status.overall} />
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 border-2 border-border p-6 shadow-[4px_4px_0px_#000]">
          <Field label="DNS">
            <DnsBadge status={status.dns_status} />
          </Field>
          <Field label="SITE">
            <HttpBadge status={status.http_status} />
          </Field>
          <Field label="SSL CERTIFICATE">
            <SslBadge status={status.ssl_status} />
          </Field>
          <Field label="CERTIFICATE EXPIRES">
            <span>
              {formatDate(status.ssl_expires_at)}{" "}
              <span className="text-muted-foreground">
                {daysUntil(status.ssl_expires_at)}
              </span>
            </span>
            <div className="mt-1 font-pixel text-[7px] text-muted-foreground">
              {status.ssl_issuer ? `${status.ssl_issuer} · ` : ""}VIA CT LOGS
            </div>
          </Field>
          <Field label="SINCE">{formatDate(status.since)}</Field>
          <Field label="LAST CHECKED">{formatDate(status.last_checked)}</Field>
        </div>

        {owner && (
          <div className="mt-6 flex items-center gap-4 border-2 border-border p-6 shadow-[4px_4px_0px_#000]">
            <img
              src={`https://github.com/${owner.github}.png?size=64`}
              alt={owner.github}
              width={48}
              height={48}
              className="shrink-0 border-2 border-primary [image-rendering:pixelated]"
            />
            <div className="flex flex-col gap-2">
              <a
                href={`https://github.com/${owner.github}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sm text-foreground hover:text-primary"
              >
                @{owner.github}
              </a>
              <span className="font-pixel text-[8px] text-muted-foreground">
                OWNER
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const is404 = isRouteErrorResponse(error) && error.status === 404;
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="pt-20 px-6 pb-6 md:px-10 md:pb-10 max-w-3xl mx-auto">
        <Link
          to="/"
          className="font-pixel text-[8px] text-muted-foreground hover:text-primary"
        >
          ← BACK
        </Link>
        <p className="mt-8 font-pixel text-[10px] text-muted-foreground">
          {is404
            ? "SUBDOMAIN NOT FOUND — NO STATUS DATA."
            : "SOMETHING WENT WRONG — TRY AGAIN LATER."}
        </p>
      </main>
    </div>
  );
}
