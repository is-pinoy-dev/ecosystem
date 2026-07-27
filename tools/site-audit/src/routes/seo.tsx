import { useState } from "react"
import { useOutletContext } from "react-router"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@is-pinoy-dev/ui/components/accordion"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@is-pinoy-dev/ui/components/tabs"
import type { AuditResult } from "@is-pinoy-dev/schemas"
import type { AuditContext } from "./layout"
import { AuditTable } from "../components/audit-table"
import { StatusBadge } from "../components/status-badge"
import { IssueList } from "../components/issue-list"
import { ErrorState, ScanningState } from "../components/audit-states"
import {
  FacebookCard,
  TwitterLargeCard,
  TwitterSummaryCard,
  LinkedInCard,
} from "../components/og-previews"

type SeoTab =
  | "overview"
  | "issues"
  | "headings"
  | "links"
  | "images"
  | "schema"
  | "social"
type SocialTab = "og" | "twitter" | "linkedin" | "facebook"
type LinkFilter = "all" | "internal" | "external"

const SEO_TABS: { id: SeoTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "issues", label: "Issues" },
  { id: "headings", label: "Headings" },
  { id: "links", label: "Links" },
  { id: "images", label: "Images" },
  { id: "schema", label: "Schema" },
  { id: "social", label: "Social" },
]

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="m-0 font-mono text-xs font-semibold tracking-[0.12em] text-accent uppercase">
      {children}
    </p>
  )
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="m-0 text-sm text-muted-foreground">{children}</p>
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
    <div className="flex flex-col gap-1 border border-border bg-card p-4 text-center">
      <p className="m-0 font-mono text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
        {label}
      </p>
      <p
        className={`m-0 text-2xl font-semibold tracking-[-0.02em] ${
          valueClass ?? "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  )
}

/** Header row for the dense data tables below. */
function TableHead({ columns }: { columns: string[] }) {
  return (
    <>
      {columns.map((column) => (
        <p
          key={column}
          className="m-0 font-mono text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase"
        >
          {column}
        </p>
      ))}
    </>
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

const HEADING_LABELS = [
  "H1 Count",
  "H2 Count",
  "H3 Count",
  "H4 Count",
  "H5 Count",
  "H6 Count",
]

const H_TAGS = ["h1", "h2", "h3", "h4", "h5", "h6"] as const

function OverviewTab({ data }: { data: AuditResult }) {
  const coreFields = data.seo.fields.filter((f) =>
    CORE_LABELS.includes(f.label)
  )
  const technicalFields = data.seo.fields.filter(
    (f) => !CORE_LABELS.includes(f.label) && !HEADING_LABELS.includes(f.label)
  )
  const counts = data.details.headingCounts

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Eyebrow>Core</Eyebrow>
        <AuditTable fields={coreFields} />
      </div>

      <div className="flex flex-col gap-3">
        <Eyebrow>Heading structure</Eyebrow>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {H_TAGS.map((tag) => {
            const count = counts[tag] ?? 0
            const isBad = tag === "h1" && (count === 0 || count > 1)
            return (
              <StatBox
                key={tag}
                label={tag.toUpperCase()}
                value={count}
                valueClass={isBad ? "text-destructive" : "text-foreground"}
              />
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Eyebrow>Summary</Eyebrow>
        <div className="grid grid-cols-2 gap-3">
          <StatBox label="Images" value={data.details.images.total} />
          <StatBox label="Links" value={data.details.links.total} />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Eyebrow>Technical</Eyebrow>
        <AuditTable fields={technicalFields} />
      </div>
    </div>
  )
}

function HeadingsTab({ data }: { data: AuditResult }) {
  const headings = data.details.headings

  return (
    <div className="flex flex-col gap-4">
      <Eyebrow>Headings — {headings.length} total</Eyebrow>
      {headings.length === 0 ? (
        <EmptyNote>No headings found.</EmptyNote>
      ) : (
        <div className="overflow-x-auto border border-border bg-card">
          <div className="min-w-[520px]">
            <div className="grid grid-cols-[auto_1fr] gap-4 border-b border-border px-4 py-2.5">
              <TableHead columns={["Tag", "Text"]} />
            </div>
            <div className="divide-y divide-border">
              {headings.map((h, i) => (
                <div
                  key={`${h.tag}-${i}`}
                  className="grid grid-cols-[auto_1fr] gap-4 px-4 py-2.5"
                >
                  <p className="m-0 w-8 font-mono text-[13px] font-medium text-accent">
                    {h.tag.toUpperCase()}
                  </p>
                  <p className="m-0 text-sm text-foreground">{h.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const LINK_FILTER_TABS: { id: LinkFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "internal", label: "Internal" },
  { id: "external", label: "External" },
]

function LinksTab({ data }: { data: AuditResult }) {
  const [filter, setFilter] = useState<LinkFilter>("all")
  const { links } = data.details

  const allLinks = [
    ...links.internalLinks.map((l) => ({ ...l, type: "Internal" as const })),
    ...links.externalLinks.map((l) => ({ ...l, type: "External" as const })),
  ]
  const filtered =
    filter === "internal"
      ? allLinks.filter((l) => l.type === "Internal")
      : filter === "external"
        ? allLinks.filter((l) => l.type === "External")
        : allLinks

  const shown = filtered.slice(0, 100)
  const extra = filtered.length - shown.length

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBox label="Total" value={links.total} />
        <StatBox label="Unique" value={links.unique} />
        <StatBox label="Internal" value={links.internal} />
        <StatBox label="External" value={links.external} />
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as LinkFilter)}>
        <TabsList>
          {LINK_FILTER_TABS.map(({ id, label }) => (
            <TabsTrigger key={id} value={id}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {shown.length === 0 ? (
        <EmptyNote>No links found.</EmptyNote>
      ) : (
        <div className="overflow-x-auto border border-border bg-card">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-[2fr_1fr_auto] gap-4 border-b border-border px-4 py-2.5">
              <TableHead columns={["URL", "Text", "Type"]} />
            </div>
            <div className="divide-y divide-border">
              {shown.map((link, i) => (
                <div
                  key={`${link.href}-${i}`}
                  className="grid grid-cols-[2fr_1fr_auto] items-center gap-4 px-4 py-2.5"
                >
                  <p className="m-0 truncate font-mono text-[13px] text-foreground">
                    {link.href}
                  </p>
                  <p className="m-0 truncate text-sm text-muted-foreground">
                    {link.text || "—"}
                  </p>
                  <span className="font-mono text-xs text-muted-foreground">
                    {link.type}
                  </span>
                </div>
              ))}
            </div>
            {extra > 0 && (
              <p className="m-0 border-t border-border px-4 py-2.5 text-sm text-muted-foreground">
                +{extra} more
              </p>
            )}
          </div>
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
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-3 gap-3">
        <StatBox label="Total" value={images.total} />
        <StatBox
          label="No alt"
          value={images.withoutAlt}
          valueClass={
            images.withoutAlt > 0 ? "text-destructive" : "text-foreground"
          }
        />
        <StatBox
          label="No title"
          value={images.withoutTitle}
          valueClass={
            images.withoutTitle > 0 ? "text-warning" : "text-foreground"
          }
        />
      </div>

      {shown.length === 0 ? (
        <EmptyNote>No images found.</EmptyNote>
      ) : (
        <div className="overflow-x-auto border border-border bg-card">
          <div className="min-w-[680px]">
            <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 border-b border-border px-4 py-2.5">
              <TableHead columns={["Source", "Alt", "Title", "Status"]} />
            </div>
            <div className="divide-y divide-border">
              {shown.map((img, i) => {
                const status = !img.alt ? "fail" : !img.title ? "warn" : "pass"
                return (
                  <div
                    key={`${img.src}-${i}`}
                    className="grid grid-cols-[2fr_1fr_1fr_auto] items-center gap-4 px-4 py-2.5"
                  >
                    <p className="m-0 truncate font-mono text-[13px] text-foreground">
                      {img.src}
                    </p>
                    <p className="m-0 truncate text-sm text-muted-foreground">
                      {img.alt ?? <span className="text-destructive">—</span>}
                    </p>
                    <p className="m-0 truncate text-sm text-muted-foreground">
                      {img.title ?? "—"}
                    </p>
                    <StatusBadge status={status} />
                  </div>
                )
              })}
            </div>
            {extra > 0 && (
              <p className="m-0 border-t border-border px-4 py-2.5 text-sm text-muted-foreground">
                +{extra} more
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function SchemaTab({ data }: { data: AuditResult }) {
  const { jsonLdSchemas, hreflangLinks } = data.details
  const hasData = jsonLdSchemas.length > 0 || hreflangLinks.length > 0

  if (!hasData) return <EmptyNote>No structured data found.</EmptyNote>

  return (
    <div className="flex flex-col gap-8">
      {jsonLdSchemas.length > 0 && (
        <div className="flex flex-col gap-3">
          <Eyebrow>JSON-LD schemas</Eyebrow>
          <div className="border border-border bg-card">
            <Accordion type="multiple" className="divide-y divide-border">
              {jsonLdSchemas.map((schema, i) => (
                <AccordionItem key={i} value={String(i)} className="border-b-0">
                  <AccordionTrigger className="px-4 py-3 hover:bg-muted/40 hover:no-underline [&>svg]:!ml-4 [&>svg]:shrink-0">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-foreground">
                        {schema.type ?? "Unknown"}
                      </span>
                      <StatusBadge status={schema.isValid ? "pass" : "fail"} />
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <pre className="m-0 overflow-x-auto border border-border bg-code-bg p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap text-[#e6e9ef]">
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
        <div className="flex flex-col gap-3">
          <Eyebrow>Hreflang</Eyebrow>
          <div className="overflow-x-auto border border-border bg-card">
            <div className="min-w-[480px]">
              <div className="grid grid-cols-[auto_1fr] gap-4 border-b border-border px-4 py-2.5">
                <TableHead columns={["Lang", "Href"]} />
              </div>
              <div className="divide-y divide-border">
                {hreflangLinks.map((link, i) => (
                  <div
                    key={`${link.lang}-${i}`}
                    className="grid grid-cols-[auto_1fr] gap-4 px-4 py-2.5"
                  >
                    <p className="m-0 w-12 font-mono text-[13px] font-medium text-accent">
                      {link.lang}
                    </p>
                    <p className="m-0 font-mono text-[13px] break-all text-foreground">
                      {link.href}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const SOCIAL_TABS: { id: SocialTab; label: string }[] = [
  { id: "og", label: "Open Graph" },
  { id: "twitter", label: "X / Twitter" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "facebook", label: "Facebook" },
]

function PreviewLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="m-0 mb-2 font-mono text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
      {children}
    </p>
  )
}

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
    <Tabs value={tab} onValueChange={(v) => setTab(v as SocialTab)}>
      <TabsList>
        {SOCIAL_TABS.map(({ id, label }) => (
          <TabsTrigger key={id} value={id}>
            {label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="og" className="flex flex-col gap-5">
        <AuditTable fields={ogFields} />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div>
            <PreviewLabel>Facebook</PreviewLabel>
            <FacebookCard
              image={ogImage}
              title={ogTitle}
              description={ogDescription}
              siteName={ogSiteName}
              url={ogUrl}
            />
          </div>
          <div>
            <PreviewLabel>LinkedIn</PreviewLabel>
            <LinkedInCard
              image={ogImage}
              title={ogTitle}
              siteName={ogSiteName}
              url={ogUrl}
            />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="twitter" className="flex flex-col gap-5">
        <AuditTable fields={twitterFields} />
        <div>
          <PreviewLabel>
            {`X / Twitter — ${isLargeCard ? "large card" : "summary"}`}
          </PreviewLabel>
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
      </TabsContent>

      <TabsContent value="linkedin" className="flex flex-col gap-4">
        <EmptyNote>
          LinkedIn uses Open Graph tags. Edit the og: fields to update this
          preview.
        </EmptyNote>
        <LinkedInCard
          image={ogImage}
          title={ogTitle}
          siteName={ogSiteName}
          url={ogUrl}
        />
      </TabsContent>

      <TabsContent value="facebook" className="flex flex-col gap-4">
        <EmptyNote>
          Facebook uses Open Graph tags. Edit the og: fields to update this
          preview.
        </EmptyNote>
        <FacebookCard
          image={ogImage}
          title={ogTitle}
          description={ogDescription}
          siteName={ogSiteName}
          url={ogUrl}
        />
      </TabsContent>
    </Tabs>
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

  if (state.status === "loading") return <ScanningState />

  if (state.status === "error") {
    return <ErrorState message={state.message} onRetry={() => runAudit()} />
  }

  const { seo } = state.data
  const passed = seo.fields.filter((f) => f.status === "pass").length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Eyebrow>SEO</Eyebrow>
        <h1 className="m-0 text-2xl font-semibold tracking-[-0.02em] text-foreground">
          {passed}/{seo.fields.length} checks passed
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SeoTab)}>
        <TabsList>
          {SEO_TABS.map(({ id, label }) => (
            <TabsTrigger key={id} value={id}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab data={state.data} />
        </TabsContent>
        <TabsContent value="issues">
          <IssueList seo={state.data.seo} og={state.data.og} />
        </TabsContent>
        <TabsContent value="headings">
          <HeadingsTab data={state.data} />
        </TabsContent>
        <TabsContent value="links">
          <LinksTab data={state.data} />
        </TabsContent>
        <TabsContent value="images">
          <ImagesTab data={state.data} />
        </TabsContent>
        <TabsContent value="schema">
          <SchemaTab data={state.data} />
        </TabsContent>
        <TabsContent value="social">
          <SocialTab data={state.data} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
