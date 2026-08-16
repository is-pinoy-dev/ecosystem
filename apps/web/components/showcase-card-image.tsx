"use client"

import React, { useState } from "react"

import {
  previewFallbackUrl,
  type ShowcasePreviewStatus,
} from "@/lib/showcase-preview"

function PreviewUnavailable({ subdomain }: { subdomain: string }) {
  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-center gap-3 overflow-hidden bg-background px-5 py-4 text-center"
      data-state="unavailable"
    >
      {/* The official repository icon; intentionally reused, never redrawn. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt=""
        aria-hidden="true"
        className="size-9 object-contain opacity-75"
      />
      <div className="flex min-w-0 flex-col gap-1">
        <span className="font-mono text-[10px] font-semibold tracking-[0.12em] text-accent uppercase">
          Preview unavailable
        </span>
        <span className="truncate font-mono text-xs text-muted-foreground">
          {subdomain}.is-pinoy.dev
        </span>
      </div>
      <span
        className="pointer-events-none absolute right-4 bottom-3 h-5 w-8 border-r border-b border-primary/40"
        aria-hidden="true"
      />
    </div>
  )
}

export function ShowcaseCardImage({
  screenshotUrl,
  screenshotStatus,
  subdomain,
  loading = "lazy",
}: {
  screenshotUrl: string | null
  screenshotStatus: ShowcasePreviewStatus
  subdomain: string
  loading?: "eager" | "lazy"
}) {
  // Ranked preview sources: the capture we took, then the Worker endpoint that
  // serves the portfolio's own og:image or a generated card. A source that
  // fails in the browser is dropped and the next one takes over; exhausting
  // them lands on the branded tile. Absence of a capture is never rendered as
  // loading — a queued one can wait a full refresh cycle.
  const sources = [
    ...(screenshotUrl ? [screenshotUrl] : []),
    previewFallbackUrl(subdomain),
  ]
  const [failed, setFailed] = useState<string[]>([])
  const src = sources.find((candidate) => !failed.includes(candidate))
  const updating =
    screenshotStatus === "pending" || screenshotStatus === "processing"

  if (!src) return <PreviewUnavailable subdomain={subdomain} />

  return (
    <div
      className="relative flex h-full w-full items-center justify-center"
      data-state={screenshotStatus}
    >
      {/* R2 images are already versioned and CDN-cacheable. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={src}
        src={src}
        alt={`Preview of ${subdomain}.is-pinoy.dev`}
        loading={loading}
        decoding="async"
        onError={() => setFailed((current) => [...current, src])}
        className="max-h-full max-w-full object-contain object-center"
      />
      {updating && screenshotUrl !== null && (
        <span className="absolute right-2 bottom-2 border border-border bg-background/90 px-2 py-1 font-mono text-[9px] font-semibold tracking-[0.06em] text-foreground uppercase">
          Updating preview…
        </span>
      )}
    </div>
  )
}
