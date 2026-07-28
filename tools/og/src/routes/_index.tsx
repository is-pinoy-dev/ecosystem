import { useState } from "react"
import { useLoaderData } from "react-router"
import type { LoaderFunctionArgs, MetaFunction } from "react-router"
import { Check, Copy } from "lucide-react"
import { Button } from "@is-pinoy-dev/ui/components/button"
import { Container } from "@is-pinoy-dev/ui/components/container"
import {
  SectionDescription,
  SectionEyebrow,
  SectionHeader,
  SectionTitle,
} from "@is-pinoy-dev/ui/components/section-header"

export const meta: MetaFunction = () => [{ title: "OG Image — is-pinoy.dev" }]

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const parts = url.hostname.split(".")
  // Subdomain present when hostname is *.is-pinoy.dev (3+ parts)
  const subdomain =
    parts.length > 2 ? parts.slice(0, parts.length - 2).join(".") : null
  return { subdomain, hostname: url.hostname }
}

/** Ruled row: label plus supporting copy, separated by a rule rather than a card. */
function DetailRow({
  label,
  description,
}: {
  label: string
  description: string
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-border py-4 last:border-b-0 sm:flex-row sm:items-baseline sm:gap-6">
      <span className="font-mono text-[13px] break-all text-foreground sm:w-[300px] sm:shrink-0">
        {label}
      </span>
      <span className="text-sm leading-6 text-muted-foreground">
        {description}
      </span>
    </div>
  )
}

export default function Index() {
  const { subdomain, hostname } = useLoaderData<typeof loader>()
  const [copied, setCopied] = useState(false)
  const [imgError, setImgError] = useState(false)

  const imageUrl = "/_tools/og/image"
  const absoluteUrl = subdomain ? `https://${hostname}/_tools/og/image` : null

  async function copyUrl() {
    if (!absoluteUrl) return
    await navigator.clipboard.writeText(absoluteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Container className="flex min-h-screen max-w-[900px] flex-col gap-12 py-14">
      <SectionHeader>
        <SectionEyebrow>Open Graph</SectionEyebrow>
        <SectionTitle>
          {subdomain ? `${subdomain}.is-pinoy.dev` : "OG image generator"}
        </SectionTitle>
        <SectionDescription>
          {subdomain
            ? "A share preview image generated for your subdomain, ready to drop into your site's meta tags."
            : "Every registered is-pinoy.dev subdomain gets its own share preview image. Open this tool from your subdomain to see yours."}
        </SectionDescription>
      </SectionHeader>

      {subdomain ? (
        <>
          <div className="border border-border bg-card">
            {imgError ? (
              <div className="flex h-48 items-center justify-center">
                <span className="text-sm text-muted-foreground">
                  Failed to generate image
                </span>
              </div>
            ) : (
              <img
                src={imageUrl}
                alt={`Open Graph image for ${subdomain}.is-pinoy.dev`}
                className="block w-full"
                onError={() => setImgError(true)}
              />
            )}
          </div>

          <section className="flex flex-col gap-8">
            <h2 className="m-0 text-2xl font-semibold tracking-[-0.02em] text-foreground">
              Add it to your site
            </h2>

            <div className="flex flex-col gap-3">
              <p className="m-0 font-mono text-xs font-semibold tracking-[0.12em] text-accent uppercase">
                og:image URL
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <code className="min-w-0 flex-1 overflow-x-auto border border-border bg-muted px-3 py-2.5 font-mono text-[13px] text-foreground">
                  {absoluteUrl}
                </code>
                <Button
                  variant="outline"
                  onClick={copyUrl}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="size-4" aria-hidden="true" />
                  ) : (
                    <Copy className="size-4" aria-hidden="true" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <p className="m-0 font-mono text-xs font-semibold tracking-[0.12em] text-accent uppercase">
                HTML snippet
              </p>
              <pre className="overflow-x-auto border border-border bg-code-bg p-4 font-mono text-xs leading-relaxed text-[#e6e9ef]">
                {`<meta property="og:image" content="${absoluteUrl}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="${absoluteUrl}" />`}
              </pre>
            </div>
          </section>
        </>
      ) : (
        <section className="flex flex-col gap-4">
          <p className="m-0 text-base leading-7 text-muted-foreground">
            Access the tool from your own subdomain:
          </p>
          <pre className="overflow-x-auto border border-border bg-muted p-4 font-mono text-sm text-foreground">
            yourname.is-pinoy.dev/_tools/og
          </pre>
          <p className="m-0 text-base leading-7 text-muted-foreground">
            The image itself is served from{" "}
            <code className="border border-border bg-muted px-1.5 py-0.5 font-mono text-[0.9em]">
              /_tools/og/image
            </code>{" "}
            — use that as your{" "}
            <code className="border border-border bg-muted px-1.5 py-0.5 font-mono text-[0.9em]">
              og:image
            </code>{" "}
            value.
          </p>
        </section>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="m-0 text-2xl font-semibold tracking-[-0.02em] text-foreground">
          How it works
        </h2>
        <div className="flex flex-col border-t border-border">
          <DetailRow
            label={`${subdomain ?? "yourname"}.is-pinoy.dev/_tools/og`}
            description="This preview page."
          />
          <DetailRow
            label={`${subdomain ?? "yourname"}.is-pinoy.dev/_tools/og/image`}
            description="The 1200×630 PNG to use as your og:image."
          />
          <DetailRow
            label="Generated per subdomain"
            description="Your domain name and GitHub avatar, rendered in the is-pinoy.dev brand style."
          />
          <DetailRow
            label="Cached"
            description="Served from the CDN with a 5-minute cache per subdomain."
          />
        </div>
      </section>
    </Container>
  )
}
