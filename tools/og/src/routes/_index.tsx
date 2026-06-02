import { useState } from "react";
import { useLoaderData } from "react-router";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { Button } from "@is-pinoy-dev/ui/components/button";
import { Badge } from "@is-pinoy-dev/ui/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@is-pinoy-dev/ui/components/card";

export const meta: MetaFunction = () => [
  { title: "OG Image — is-pinoy.dev" },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const parts = url.hostname.split(".");
  // Subdomain present when hostname is *.is-pinoy.dev (3+ parts)
  const subdomain = parts.length > 2 ? parts.slice(0, parts.length - 2).join(".") : null;
  return { subdomain, hostname: url.hostname };
}

export default function Index() {
  const { subdomain, hostname } = useLoaderData<typeof loader>();
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  const imageUrl = "/_tools/og/image";
  const absoluteUrl = subdomain
    ? `https://${hostname}/_tools/og/image`
    : null;

  async function copyUrl() {
    if (!absoluteUrl) return;
    await navigator.clipboard.writeText(absoluteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6 flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Header */}
      <header className="flex flex-col gap-3 pt-4">
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="font-pixel text-[9px] text-primary border-primary px-2 py-1"
          >
            /_tools/og
          </Badge>
        </div>
        <h1 className="font-pixel text-sm text-foreground leading-relaxed">
          {subdomain ? `${subdomain}.is-pinoy.dev` : "OG Image Generator"}
        </h1>
        {subdomain ? (
          <p className="font-mono text-xs text-muted-foreground leading-relaxed">
            Open Graph image for{" "}
            <span className="text-primary">{subdomain}.is-pinoy.dev</span>
          </p>
        ) : (
          <p className="font-mono text-xs text-muted-foreground leading-relaxed">
            Visit this tool from a subdomain:{" "}
            <span className="text-primary">yourname.is-pinoy.dev/_tools/og</span>
          </p>
        )}
      </header>

      {subdomain ? (
        <>
          {/* OG image preview */}
          <div
            className="border-2 border-border"
            style={{ boxShadow: "4px 4px 0px #000" }}
          >
            {imgError ? (
              <div className="flex items-center justify-center h-48 bg-muted">
                <span className="font-pixel text-[9px] text-muted-foreground">
                  Failed to generate image
                </span>
              </div>
            ) : (
              <img
                src={imageUrl}
                alt={`OG image for ${subdomain}.is-pinoy.dev`}
                className="w-full block"
                onError={() => setImgError(true)}
              />
            )}
          </div>

          {/* URL and snippet */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="font-pixel text-[9px] text-muted-foreground">
                Add to your site
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {/* URL row */}
              <div>
                <p className="font-pixel text-[8px] text-muted-foreground mb-2">
                  og:image URL
                </p>
                <div className="flex gap-2 items-center">
                  <code className="font-mono text-xs bg-muted px-3 py-2 flex-1 overflow-x-auto border border-border text-primary">
                    {absoluteUrl}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyUrl}
                    className="font-pixel text-[9px] shrink-0"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </div>
              </div>

              {/* HTML snippet */}
              <div>
                <p className="font-pixel text-[8px] text-muted-foreground mb-2">
                  HTML snippet
                </p>
                <pre className="font-mono text-[10px] bg-muted border border-border p-3 overflow-x-auto text-muted-foreground leading-relaxed">
                  {`<meta property="og:image" content="${absoluteUrl}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="${absoluteUrl}" />`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        /* Apex domain fallback */
        <Card className="border-border">
          <CardContent className="pt-6">
            <p className="font-mono text-xs text-muted-foreground leading-relaxed">
              This tool generates a unique Open Graph image for each registered
              is-pinoy.dev subdomain. Access it from your subdomain:
            </p>
            <pre className="font-mono text-xs bg-muted border border-border p-3 mt-3 text-primary">
              yourname.is-pinoy.dev/_tools/og
            </pre>
            <p className="font-mono text-xs text-muted-foreground mt-3 leading-relaxed">
              The image endpoint is at{" "}
              <code className="bg-muted px-1">/_tools/og/image</code> — use it
              as your{" "}
              <code className="bg-muted px-1">og:image</code> meta tag value.
            </p>
          </CardContent>
        </Card>
      )}

      {/* How it works */}
      <Card className="border-border mt-auto">
        <CardHeader className="pb-2">
          <CardTitle className="font-pixel text-[8px] text-muted-foreground">
            How it works
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {[
            [
              `${subdomain ?? "yourname"}.is-pinoy.dev/_tools/og`,
              "This preview page",
            ],
            [
              `${subdomain ?? "yourname"}.is-pinoy.dev/_tools/og/image`,
              "1200×630 PNG — use as og:image",
            ],
            ["Pixel-art design", "Retro is-pinoy.dev brand style"],
            ["Auto-cached", "5-minute CDN cache per subdomain"],
          ].map(([label, desc]) => (
            <div key={label} className="flex gap-3 items-start">
              <span className="font-mono text-[10px] text-primary shrink-0 mt-0.5">
                ▸
              </span>
              <div>
                <span className="font-mono text-[10px] text-foreground">
                  {label}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {" "}
                  — {desc}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
