import { Link, isRouteErrorResponse, useLoaderData } from "react-router"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { Container } from "@is-pinoy-dev/ui/components/container"
import { NavBar } from "~/components/nav-bar"
import {
  DnsBadge,
  HttpBadge,
  StatusBadge,
  SslBadge,
} from "~/components/status-badge"
import { fetchOwnerInfo } from "~/lib/owner"
import type { Route } from "./+types/subdomain"
import type { SubdomainStatus } from "~/types"

export const meta: Route.MetaFunction = ({ params }) => [
  { title: `${params.subdomain}.is-pinoy.dev — Status` },
]

export async function loader({ params, context }: Route.LoaderArgs) {
  const subdomain = params.subdomain
  const status = await context.cloudflare.env.STATUS_DB.prepare(
    "SELECT * FROM subdomain_status WHERE subdomain = ?"
  )
    .bind(subdomain)
    .first<SubdomainStatus>()

  if (!status) {
    throw new Response("Not Found", { status: 404 })
  }

  const owner = await fetchOwnerInfo(subdomain)
  return { status, owner }
}

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function daysUntil(iso: string | null): string {
  if (!iso) return ""
  const days = Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000)
  if (days < 0) return `${Math.abs(days)}d ago`
  return `in ${days}d`
}

function BackLink() {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground no-underline transition-colors duration-[140ms] hover:text-accent focus-visible:text-accent"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      Back to status
    </Link>
  )
}

/** Ruled row: label on the left, value on the right. */
function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-border py-4 last:border-b-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <span className="font-mono text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase sm:pt-0.5">
        {label}
      </span>
      <div className="text-sm text-foreground sm:text-right">{children}</div>
    </div>
  )
}

export default function SubdomainDetails() {
  const { status, owner } = useLoaderData<typeof loader>()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <Container className="max-w-[760px] py-14">
        <BackLink />

        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
          <a
            href={`https://${status.subdomain}.is-pinoy.dev`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-mono text-xl font-medium text-foreground no-underline transition-colors duration-[140ms] hover:text-accent focus-visible:text-accent sm:text-2xl"
          >
            {status.subdomain}.is-pinoy.dev
            <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
          </a>
          <StatusBadge status={status.overall} />
        </div>

        <div className="mt-10 flex flex-col border-t border-border">
          <Field label="DNS">
            <DnsBadge status={status.dns_status} />
          </Field>
          <Field label="Site">
            <HttpBadge status={status.http_status} />
          </Field>
          <Field label="SSL certificate">
            <SslBadge status={status.ssl_status} />
          </Field>
          <Field label="Certificate expires">
            <div className="flex flex-col gap-1 sm:items-end">
              <span>
                {formatDate(status.ssl_expires_at)}{" "}
                <span className="text-muted-foreground">
                  {daysUntil(status.ssl_expires_at)}
                </span>
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                {status.ssl_issuer ? `${status.ssl_issuer} · ` : ""}via CT logs
              </span>
            </div>
          </Field>
          <Field label="Since">{formatDate(status.since)}</Field>
          <Field label="Last checked">{formatDate(status.last_checked)}</Field>
        </div>

        {owner && (
          <div className="mt-10 flex items-center gap-4 border border-border bg-card p-5">
            <img
              src={`https://github.com/${owner.github}.png?size=96`}
              alt=""
              width={48}
              height={48}
              className="size-12 shrink-0 border border-border object-cover"
            />
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                Owner
              </span>
              <a
                href={`https://github.com/${owner.github}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sm font-medium text-accent underline-offset-4 hover:underline"
              >
                @{owner.github}
              </a>
            </div>
          </div>
        )}
      </Container>
    </div>
  )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const is404 = isRouteErrorResponse(error) && error.status === 404
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <Container className="max-w-[760px] py-14">
        <BackLink />
        <h1 className="mt-8 mb-0 text-3xl font-semibold tracking-[-0.03em] text-foreground">
          {is404 ? "Subdomain not found" : "Something went wrong"}
        </h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          {is404
            ? "There is no status data for this subdomain yet."
            : "Please try again later."}
        </p>
      </Container>
    </div>
  )
}
