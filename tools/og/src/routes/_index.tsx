import { useState, useRef } from "react";
import type { MetaFunction } from "react-router";
import { Button } from "@is-pinoy-dev/ui/components/button";
import { Input } from "@is-pinoy-dev/ui/components/input";
import { Badge } from "@is-pinoy-dev/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@is-pinoy-dev/ui/components/card";

export const meta: MetaFunction = () => [
  { title: "OG Image Generator — is-pinoy.dev" },
  {
    name: "description",
    content: "Generate Open Graph images for any is-pinoy.dev subdomain.",
  },
];

const BASE = "/_tools/og";

function imageUrl(subdomain: string): string {
  return `${BASE}/image/${encodeURIComponent(subdomain)}`;
}

export default function Index() {
  const [input, setInput] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const normalized = input.trim().toLowerCase().replace(/\.is-pinoy\.dev$/, "");
    if (!normalized) return;
    setSubdomain(normalized);
    setImgError(false);
    setCopied(false);
  }

  const url = subdomain ? imageUrl(subdomain) : null;
  const absoluteUrl = subdomain
    ? `https://is-pinoy.dev/_tools/og/image/${subdomain}`
    : null;

  async function copyUrl() {
    if (!absoluteUrl) return;
    await navigator.clipboard.writeText(absoluteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6 flex flex-col gap-8 max-w-5xl mx-auto">
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
        <h1 className="font-pixel text-base text-foreground leading-relaxed">
          OG Image Generator
        </h1>
        <p className="font-mono text-xs text-muted-foreground leading-relaxed max-w-xl">
          Generate Open Graph images for proxied{" "}
          <span className="text-primary">is-pinoy.dev</span> subdomains. Use
          the URL below in your{" "}
          <code className="text-xs bg-muted px-1">{"<meta property=\"og:image\">"}</code>{" "}
          tag.
        </p>
      </header>

      {/* Search form */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="font-pixel text-[11px] text-foreground">
            Preview Subdomain
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="flex flex-1 items-center border border-border bg-muted">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="yourname"
                className="border-0 bg-transparent font-mono text-sm flex-1 focus-visible:ring-0"
                spellCheck={false}
                autoComplete="off"
              />
              <span className="font-mono text-xs text-muted-foreground pr-3 shrink-0">
                .is-pinoy.dev
              </span>
            </div>
            <Button
              type="submit"
              variant="default"
              className="font-pixel text-[10px] px-4"
            >
              Generate
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Preview + URL */}
      {url && (
        <div className="flex flex-col gap-4">
          {/* OG image preview */}
          <div className="border-2 border-border" style={{ boxShadow: "4px 4px 0px #000" }}>
            {imgError ? (
              <div className="flex items-center justify-center h-48 bg-muted">
                <span className="font-pixel text-[9px] text-muted-foreground">
                  Failed to load image
                </span>
              </div>
            ) : (
              <img
                ref={imgRef}
                src={url}
                alt={`OG image for ${subdomain}.is-pinoy.dev`}
                className="w-full block"
                style={{ imageRendering: "pixelated" }}
                onError={() => setImgError(true)}
              />
            )}
          </div>

          {/* URL row */}
          <Card className="border-border">
            <CardContent className="pt-4">
              <p className="font-pixel text-[9px] text-muted-foreground mb-2">
                og:image URL
              </p>
              <div className="flex gap-2 items-center">
                <code className="font-mono text-xs bg-muted px-3 py-2 flex-1 overflow-x-auto border border-border text-primary break-all">
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
              <p className="font-mono text-[10px] text-muted-foreground mt-3 leading-relaxed">
                Add to your HTML{" "}
                <code className="bg-muted px-1">{"<head>"}</code>:
              </p>
              <pre className="font-mono text-[10px] bg-muted border border-border p-3 mt-1 overflow-x-auto text-muted-foreground">
                {`<meta property="og:image" content="${absoluteUrl}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />`}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}

      {/* How it works */}
      <Card className="border-border mt-auto">
        <CardHeader className="pb-3">
          <CardTitle className="font-pixel text-[9px] text-muted-foreground">
            How it works
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {[
            ["/_tools/og/image/:subdomain", "Returns a 1200×630 PNG image"],
            ["Pixel-art design", "Matches the is-pinoy.dev retro aesthetic"],
            ["Cached responses", "5-minute CDN cache per subdomain"],
            ["All subdomains", "Works for any registered is-pinoy.dev domain"],
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
