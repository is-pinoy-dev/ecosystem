import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Badge } from "@is-pinoy-dev/ui/components/badge"
import { StatusIndicator } from "@is-pinoy-dev/ui/components/status-indicator"
import { auth } from "@/auth"
import {
  domainFileUrl,
  NoDomains,
  syncLabel,
  syncTone,
} from "@/components/domain-list"
import { PageHeader } from "@/components/page-header"
import { getSubdomainsForOwner, type RegistrySubdomain } from "@/lib/domains"

export const metadata: Metadata = {
  title: "Domains",
}

// Registry record entries are either bare strings or objects shaped like
// { value, proxied?, provider?, ... }. Show the DNS value prominently and the
// remaining flags as quiet metadata instead of raw JSON.
function parseRecordValue(value: unknown): { value: string; meta: string[] } {
  if (typeof value === "string") return { value, meta: [] }
  if (Array.isArray(value)) {
    const parsed = value.map(parseRecordValue)
    return {
      value: parsed.map((p) => p.value).join(", "),
      meta: [...new Set(parsed.flatMap((p) => p.meta))],
    }
  }
  if (value && typeof value === "object" && "value" in value) {
    const { value: dnsValue, ...rest } = value as Record<string, unknown>
    return {
      value: String(dnsValue),
      meta: Object.entries(rest).map(([k, v]) =>
        v === true ? k : `${k}=${String(v)}`,
      ),
    }
  }
  return { value: JSON.stringify(value), meta: [] }
}

function formatDate(date: Date | null | undefined): string | null {
  if (!date) return null
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

/** One registry entry as a ruled section: header row, then a records table. */
function DomainSection({ domain }: { domain: RegistrySubdomain }) {
  const entries = Object.entries(domain.records)
  const registered = formatDate(domain.createdAt)
  const synced = formatDate(domain.lastSyncedAt)
  const meta = [
    registered && `Registered ${registered}`,
    synced && `Last synced ${synced}`,
  ].filter(Boolean)

  return (
    <section className="flex flex-col border-t border-border pt-5 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="flex min-w-0 items-center gap-2.5">
          <StatusIndicator tone={syncTone(domain.syncStatus)} />
          <span className="sr-only">{syncLabel(domain.syncStatus)}</span>
          <a
            href={`https://${domain.subdomain}.is-pinoy.dev`}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate font-mono text-base font-semibold text-foreground no-underline hover:text-accent hover:underline"
          >
            {domain.subdomain}.is-pinoy.dev
          </a>
          {domain.syncStatus === "failed" && (
            <Badge variant="destructive">SYNC FAILED</Badge>
          )}
        </span>
        <span className="flex flex-1 flex-wrap items-center justify-end gap-x-4 gap-y-1">
          {meta.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {meta.join(" · ")}
            </span>
          )}
          <a
            href={domainFileUrl(domain.subdomain)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] font-medium text-accent no-underline hover:underline"
          >
            View JSON
          </a>
        </span>
      </div>

      {domain.syncStatus === "failed" && domain.lastError && (
        <p className="mt-3 mb-0 border border-destructive/30 bg-destructive/10 px-3 py-2 font-mono text-xs/relaxed text-destructive">
          {domain.lastError}
        </p>
      )}

      <ul className="m-0 mt-3 mb-2 list-none p-0">
        {entries.map(([type, value]) => {
          const record = parseRecordValue(value)
          return (
            <li
              key={type}
              className="flex min-h-10 flex-wrap items-center gap-x-4 gap-y-1 border-b border-border/70 py-2 last:border-b-0"
            >
              <Badge variant="secondary" className="w-16 justify-center">
                {type.toUpperCase()}
              </Badge>
              <code className="min-w-0 flex-1 font-mono text-xs break-all text-foreground">
                {record.value}
              </code>
              {record.meta.map((item) => (
                <span
                  key={item}
                  className="font-mono text-[11px] text-muted-foreground"
                >
                  {item}
                </span>
              ))}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default async function DomainsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const { login } = session.user
  const { owned } = await getSubdomainsForOwner(login)

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Registry"
        title="Your domains"
        description="DNS records registered to your GitHub account. To change a record, edit its JSON file in the domains repository."
      />

      {owned.length > 0 ? (
        <div className="flex flex-col gap-5">
          {owned.map((domain) => (
            <DomainSection key={domain.subdomain} domain={domain} />
          ))}
        </div>
      ) : (
        <NoDomains login={login} />
      )}
    </div>
  )
}
