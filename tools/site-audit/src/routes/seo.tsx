/** biome-ignore-all lint/suspicious/noCommentText: <explanation> */
import { useState } from "react"
import { useOutletContext } from "react-router"
import { Button } from "@is-pinoy-dev/ui/components/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@is-pinoy-dev/ui/components/accordion"
import type { AuditResult } from "@is-pinoy-dev/schemas"
import type { AuditContext } from "./layout"
import { AuditTable } from "../components/audit-table"
import { StatusBadge } from "../components/status-badge"
import { IssueList } from "../components/issue-list"
import {
  FacebookCard,
  TwitterLargeCard,
  TwitterSummaryCard,
  LinkedInCard,
} from "../components/og-previews"

type SeoTab = "overview" | "issues" | "headings" | "links" | "images" | "schema" | "social"
type SocialTab = "og" | "twitter" | "linkedin" | "facebook"
type LinkFilter = "all" | "internal" | "external"

const SEO_TABS: { id: SeoTab; label: string }[] = [
  { id: "overview", label: "OVERVIEW" },
  { id: "issues", label: "ISSUES" },
  { id: "headings", label: "HEADINGS" },
  { id: "links", label: "LINKS" },
  { id: "images", label: "IMAGES" },
  { id: "schema", label: "SCHEMA" },
  { id: "social", label: "SOCIAL" },
]

function SubTabBar({
  tabs,
  active,
  onSelect,
  small,
}: {
  tabs: { id: string; label: string }[]
  active: string
  onSelect: (id: string) => void
  small?: boolean
}) {
  return (
    <div className="-mx-6 overflow-x-auto px-6">
      <div className="flex w-fit border-2 border-border shadow-[3px_3px_0_var(--color-muted)]">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className={[
              "border-r-2 border-border last:border-r-0",
              small
                ? "px-2 py-1 font-pixel text-[7px]"
                : "px-3 py-1.5 font-pixel text-[8px] md:px-4 md:py-2 md:text-[9px]",
              active === id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

function StatBox({
  label,
  value,
  valueClass,
}: {
  label: string
  value: number | string
  valueClass?: string
}) {
  return (
    <div className="border-2 border-border bg-card p-3 text-center">
      <p className="font-pixel text-[9px] text-muted-foreground">{label}</p>
      <p
        className={[
          "font-pixel text-[18px]",
          valueClass ?? "text-primary",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  )
}

const CORE_LABELS = [
  "URL",
  "Title",
  "Meta Description",
  "Canonical URL",
  "Robots",
  "X-Robots-Tag",
  "Keywords",
  "Publisher",
  "Word Count",
  "HTML lang",
]

const HEADING_LABELS = ["H1 Count", "H2 Count", "H3 Count", "H4 Count", "H5 Count", "H6 Count"]

const H_TAGS = ["h1", "h2", "h3", "h4", "h5", "h6"] as const

function OverviewTab({ data }: { data: AuditResult }) {
  const coreFields = data.seo.fields.filter((f) => CORE_LABELS.includes(f.label))
  const technicalFields = data.seo.fields.filter(
    (f) => !CORE_LABELS.includes(f.label) && !HEADING_LABELS.includes(f.label)
  )
  const counts = data.details.headingCounts

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="font-pixel text-[11px] text-primary">// CORE</p>
        <AuditTable fields={coreFields} />
      </div>

      <div className="space-y-2">
        <p className="font-pixel text-[11px] text-primary">// HEADING STRUCTURE</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {H_TAGS.map((tag) => {
            const count = counts[tag] ?? 0
            const isBad = tag === "h1" && (count === 0 || count > 1)
            return (
              <StatBox
                key={tag}
                label={tag.toUpperCase()}
                value={count}
                valueClass={isBad ? "text-destructive" : "text-primary"}
              />
            )
          })}
        </div>
      </div>

      <div className="space-y-2">
        <p className="font-pixel text-[11px] text-primary">// SUMMARY</p>
        <div className="grid grid-cols-2 gap-2">
          <StatBox label="IMAGES" value={data.details.images.total} />
          <StatBox label="LINKS" value={data.details.links.total} />
        </div>
      </div>

      <div className="space-y-2">
        <p className="font-pixel text-[11px] text-primary">// TECHNICAL</p>
        <AuditTable fields={technicalFields} />
      </div>
    </div>
  )
}

function HeadingsTab({ data }: { data: AuditResult }) {
  const headings = data.details.headings

  return (
    <div className="space-y-4">
      <p className="font-pixel text-[11px] text-primary">
        // HEADINGS — {headings.length} TOTAL
      </p>
      {headings.length === 0 ? (
        <p className="font-pixel text-[10px] text-muted-foreground">
          NO HEADINGS FOUND
        </p>
      ) : (
        <div className="border-2 border-border bg-card">
          <div className="grid grid-cols-[auto_1fr] gap-4 border-b-2 border-border px-4 py-2">
            <p className="font-pixel text-[11px] text-muted-foreground">TAG</p>
            <p className="font-pixel text-[11px] text-muted-foreground">TEXT</p>
          </div>
          {headings.map((h, i) => (
            <div
              key={`${h.tag}-${i}`}
              className={[
                "grid grid-cols-[auto_1fr] gap-4 border-b border-border/50 px-4 py-2 last:border-b-0",
                i % 2 === 1 ? "bg-muted/20" : "",
              ].join(" ")}
            >
              <p className="font-pixel text-[10px] text-primary">
                {h.tag.toUpperCase()}
              </p>
              <p className="font-mono text-[11px] text-foreground">{h.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const LINK_FILTER_TABS: { id: LinkFilter; label: string }[] = [
  { id: "all", label: "ALL" },
  { id: "internal", label: "INTERNAL" },
  { id: "external", label: "EXTERNAL" },
]

function LinksTab({ data }: { data: AuditResult }) {
  const [filter, setFilter] = useState<LinkFilter>("all")
  const { links } = data.details

  const allLinks = [
    ...links.internalLinks.map((l) => ({ ...l, type: "INT" as const })),
    ...links.externalLinks.map((l) => ({ ...l, type: "EXT" as const })),
  ]
  const filtered =
    filter === "internal"
      ? allLinks.filter((l) => l.type === "INT")
      : filter === "external"
        ? allLinks.filter((l) => l.type === "EXT")
        : allLinks

  const shown = filtered.slice(0, 100)
  const extra = filtered.length - shown.length

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatBox label="TOTAL" value={links.total} />
        <StatBox label="UNIQUE" value={links.unique} />
        <StatBox label="INTERNAL" value={links.internal} />
        <StatBox label="EXTERNAL" value={links.external} />
      </div>

      <SubTabBar
        tabs={LINK_FILTER_TABS}
        active={filter}
        onSelect={(id) => setFilter(id as LinkFilter)}
        small
      />

      {shown.length === 0 ? (
        <p className="font-pixel text-[10px] text-muted-foreground">
          NO LINKS FOUND
        </p>
      ) : (
        <div className="border-2 border-border bg-card">
          <div className="grid grid-cols-[2fr_1fr_auto] gap-3 border-b-2 border-border px-4 py-2">
            <p className="font-pixel text-[11px] text-muted-foreground">URL</p>
            <p className="font-pixel text-[11px] text-muted-foreground">TEXT</p>
            <p className="font-pixel text-[11px] text-muted-foreground">TYPE</p>
          </div>
          {shown.map((link, i) => (
            <div
              key={`${link.href}-${i}`}
              className={[
                "grid grid-cols-[2fr_1fr_auto] items-center gap-3 border-b border-border/50 px-4 py-2 last:border-b-0",
                i % 2 === 1 ? "bg-muted/20" : "",
              ].join(" ")}
            >
              <p className="truncate font-mono text-[10px] text-foreground">
                {link.href}
              </p>
              <p className="truncate font-mono text-[10px] text-muted-foreground">
                {link.text || "—"}
              </p>
              <span
                className={[
                  "font-pixel text-[8px]",
                  link.type === "INT"
                    ? "text-primary"
                    : "text-muted-foreground",
                ].join(" ")}
              >
                {link.type}
              </span>
            </div>
          ))}
          {extra > 0 && (
            <p className="border-t border-border/50 px-4 py-2 font-pixel text-[9px] text-muted-foreground">
              +{extra} MORE
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function ImagesTab({ data }: { data: AuditResult }) {
  const { images } = data.details
  const shown = images.list.slice(0, 50)
  const extra = images.list.length - shown.length

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <StatBox label="TOTAL" value={images.total} />
        <StatBox
          label="NO ALT"
          value={images.withoutAlt}
          valueClass={
            images.withoutAlt > 0 ? "text-destructive" : "text-primary"
          }
        />
        <StatBox
          label="NO TITLE"
          value={images.withoutTitle}
          valueClass={
            images.withoutTitle > 0 ? "text-yellow-400" : "text-primary"
          }
        />
      </div>

      {shown.length === 0 ? (
        <p className="font-pixel text-[10px] text-muted-foreground">
          NO IMAGES FOUND
        </p>
      ) : (
        <div className="border-2 border-border bg-card">
          <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-3 border-b-2 border-border px-4 py-2">
            <p className="font-pixel text-[11px] text-muted-foreground">SRC</p>
            <p className="font-pixel text-[11px] text-muted-foreground">ALT</p>
            <p className="font-pixel text-[11px] text-muted-foreground">
              TITLE
            </p>
            <p className="font-pixel text-[11px] text-muted-foreground">
              STATUS
            </p>
          </div>
          {shown.map((img, i) => {
            const status = !img.alt ? "fail" : !img.title ? "warn" : "pass"
            return (
              <div
                key={`${img.src}-${i}`}
                className={[
                  "grid grid-cols-[2fr_1fr_1fr_auto] items-center gap-3 border-b border-border/50 px-4 py-2 last:border-b-0",
                  i % 2 === 1 ? "bg-muted/20" : "",
                ].join(" ")}
              >
                <p className="truncate font-mono text-[10px] text-foreground">
                  {img.src}
                </p>
                <p className="truncate font-mono text-[10px] text-muted-foreground">
                  {img.alt ?? <span className="text-destructive">—</span>}
                </p>
                <p className="truncate font-mono text-[10px] text-muted-foreground">
                  {img.title ?? "—"}
                </p>
                <StatusBadge status={status} />
              </div>
            )
          })}
          {extra > 0 && (
            <p className="border-t border-border/50 px-4 py-2 font-pixel text-[9px] text-muted-foreground">
              +{extra} MORE
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function SchemaTab({ data }: { data: AuditResult }) {
  const { jsonLdSchemas, hreflangLinks } = data.details
  const hasData = jsonLdSchemas.length > 0 || hreflangLinks.length > 0

  if (!hasData) {
    return (
      <p className="font-pixel text-[10px] text-muted-foreground">
        NO STRUCTURED DATA FOUND
      </p>
    )
  }

  return (
    <div className="space-y-6">
      {jsonLdSchemas.length > 0 && (
        <div className="space-y-2">
          <p className="font-pixel text-[11px] text-primary">
            // JSON-LD SCHEMAS
          </p>
          <div className="border-2 border-border bg-card shadow-[4px_4px_0_var(--color-muted)]">
            <Accordion type="multiple" className="divide-y divide-border">
              {jsonLdSchemas.map((schema, i) => (
                <AccordionItem key={i} value={String(i)} className="border-b-0">
                  <AccordionTrigger className="px-4 py-3 hover:bg-muted/30 hover:no-underline [&>svg]:!ml-4 [&>svg]:shrink-0">
                    <div className="flex items-center gap-3">
                      <span className="font-pixel text-[10px] text-foreground">
                        {schema.type ?? "Unknown"}
                      </span>
                      <StatusBadge status={schema.isValid ? "pass" : "fail"} />
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-3">
                    <pre className="mt-2 overflow-x-auto border border-border/50 bg-background p-3 font-mono text-[10px] break-all whitespace-pre-wrap text-foreground">
                      {(() => {
                        try {
                          return JSON.stringify(JSON.parse(schema.raw), null, 2)
                        } catch {
                          return schema.raw
                        }
                      })()}
                    </pre>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      )}

      {hreflangLinks.length > 0 && (
        <div className="space-y-2">
          <p className="font-pixel text-[11px] text-primary">// HREFLANG</p>
          <div className="border-2 border-border bg-card">
            <div className="grid grid-cols-[auto_1fr] gap-4 border-b-2 border-border px-4 py-2">
              <p className="font-pixel text-[11px] text-muted-foreground">
                LANG
              </p>
              <p className="font-pixel text-[11px] text-muted-foreground">
                HREF
              </p>
            </div>
            {hreflangLinks.map((link, i) => (
              <div
                key={`${link.lang}-${i}`}
                className={[
                  "grid grid-cols-[auto_1fr] gap-4 border-b border-border/50 px-4 py-2 last:border-b-0",
                  i % 2 === 1 ? "bg-muted/20" : "",
                ].join(" ")}
              >
                <p className="font-pixel text-[10px] text-primary">
                  {link.lang}
                </p>
                <p className="font-mono text-[11px] break-all text-foreground">
                  {link.href}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const SOCIAL_TABS: { id: SocialTab; label: string }[] = [
  { id: "og", label: "OPEN GRAPH" },
  { id: "twitter", label: "X / TWITTER" },
  { id: "linkedin", label: "LINKEDIN" },
  { id: "facebook", label: "FACEBOOK" },
]

function SocialTab({ data }: { data: AuditResult }) {
  const [tab, setTab] = useState<SocialTab>("og")
  const getOg = (label: string) =>
    data.og.fields.find((f) => f.label === label)?.value ?? null

  const ogFields = data.og.fields.filter((f) => f.label.startsWith("og:"))
  const twitterFields = data.og.fields.filter((f) =>
    f.label.startsWith("twitter:")
  )

  const ogImage = getOg("og:image")
  const ogTitle = getOg("og:title")
  const ogDescription = getOg("og:description")
  const ogSiteName = getOg("og:site_name")
  const ogUrl = getOg("og:url")
  const twitterCard = getOg("twitter:card")
  const twitterImage = getOg("twitter:image")
  const twitterTitle = getOg("twitter:title")
  const twitterDescription = getOg("twitter:description")
  const twitterSite = getOg("twitter:site")

  const twImage = twitterImage ?? ogImage
  const twTitle = twitterTitle ?? ogTitle
  const twDescription = twitterDescription ?? ogDescription
  const isLargeCard = !twitterCard || twitterCard === "summary_large_image"

  return (
    <div className="space-y-4">
      <SubTabBar
        tabs={SOCIAL_TABS}
        active={tab}
        onSelect={(id) => setTab(id as SocialTab)}
        small
      />

      {tab === "og" && (
        <div className="space-y-4">
          <AuditTable fields={ogFields} />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-1 font-pixel text-[9px] tracking-wider text-muted-foreground uppercase">
                Facebook
              </p>
              <FacebookCard
                image={ogImage}
                title={ogTitle}
                description={ogDescription}
                siteName={ogSiteName}
                url={ogUrl}
              />
            </div>
            <div>
              <p className="mb-1 font-pixel text-[9px] tracking-wider text-muted-foreground uppercase">
                LinkedIn
              </p>
              <LinkedInCard
                image={ogImage}
                title={ogTitle}
                siteName={ogSiteName}
                url={ogUrl}
              />
            </div>
          </div>
        </div>
      )}

      {tab === "twitter" && (
        <div className="space-y-4">
          <AuditTable fields={twitterFields} />
          <div>
            <p className="mb-1 font-pixel text-[9px] tracking-wider text-muted-foreground uppercase">
              {`Twitter / X — ${isLargeCard ? "large card" : "summary"}`}
            </p>
            {isLargeCard ? (
              <TwitterLargeCard
                image={twImage}
                title={twTitle}
                description={twDescription}
                site={twitterSite}
              />
            ) : (
              <TwitterSummaryCard
                image={twImage}
                title={twTitle}
                description={twDescription}
                site={twitterSite}
              />
            )}
          </div>
        </div>
      )}

      {tab === "linkedin" && (
        <div className="space-y-4">
          <p className="font-pixel text-[9px] text-muted-foreground">
            LinkedIn uses OpenGraph tags. Edit og: fields to update this
            preview.
          </p>
          <LinkedInCard
            image={ogImage}
            title={ogTitle}
            siteName={ogSiteName}
            url={ogUrl}
          />
        </div>
      )}

      {tab === "facebook" && (
        <div className="space-y-4">
          <p className="font-pixel text-[9px] text-muted-foreground">
            Facebook uses OpenGraph tags. Edit og: fields to update this
            preview.
          </p>
          <FacebookCard
            image={ogImage}
            title={ogTitle}
            description={ogDescription}
            siteName={ogSiteName}
            url={ogUrl}
          />
        </div>
      )}
    </div>
  )
}

export function meta() {
  return [
    { title: "SEO — Site Audit | is-pinoy.dev" },
    { name: "description", content: "SEO audit details" },
  ]
}

export default function Seo() {
  const { state, runAudit } = useOutletContext<AuditContext>()
  const [activeTab, setActiveTab] = useState<SeoTab>("overview")

  if (state.status === "loading") {
    return (
      <p className="animate-pulse font-pixel text-xs text-primary">
        SCANNING...
      </p>
    )
  }

  if (state.status === "error") {
    return (
      <div className="space-y-4">
        <p className="font-pixel text-xs text-destructive">
          ERROR: {state.message}
        </p>
        <Button onClick={() => runAudit()} variant="outline-shadow">
          RETRY
        </Button>
      </div>
    )
  }

  const { seo } = state.data
  const passed = seo.fields.filter((f) => f.status === "pass").length

  return (
    <div className="space-y-4">
      <p className="font-pixel text-[11px] text-primary">
        // SEO — {passed}/{seo.fields.length} PASSED
      </p>

      <SubTabBar
        tabs={SEO_TABS}
        active={activeTab}
        onSelect={(id) => setActiveTab(id as SeoTab)}
      />

      {activeTab === "overview" && <OverviewTab data={state.data} />}
      {activeTab === "issues" && <IssueList seo={state.data.seo} og={state.data.og} />}
      {activeTab === "headings" && <HeadingsTab data={state.data} />}
      {activeTab === "links" && <LinksTab data={state.data} />}
      {activeTab === "images" && <ImagesTab data={state.data} />}
      {activeTab === "schema" && <SchemaTab data={state.data} />}
      {activeTab === "social" && <SocialTab data={state.data} />}
    </div>
  )
}
