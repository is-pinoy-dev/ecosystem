"use client"

import React, { useState } from "react"

import type { ShowcaseScreenshotStatus } from "@/lib/screenshot-manifest"

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

function PreviewPending({ subdomain }: { subdomain: string }) {
  return (
    <div
      className="relative h-full w-full animate-pulse overflow-hidden bg-muted"
      role="status"
      aria-label={`Generating preview for ${subdomain}.is-pinoy.dev`}
      data-state="pending"
    >
      <div className="absolute inset-x-5 top-5 h-2 bg-foreground/8" />
      <div className="absolute top-10 left-5 h-2 w-2/3 bg-foreground/8" />
      <div className="absolute inset-x-5 bottom-5 h-1/3 border border-border/60 bg-background/50" />
      <span className="sr-only">Generating preview…</span>
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
  screenshotStatus: ShowcaseScreenshotStatus
  subdomain: string
  loading?: "eager" | "lazy"
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const updating =
    screenshotStatus === "pending" || screenshotStatus === "processing"
  const hasWorkingImage = screenshotUrl !== null && screenshotUrl !== failedUrl

  if (hasWorkingImage) {
    return (
      <div className="relative h-full w-full" data-state={screenshotStatus}>
        {/* R2 images are already versioned and CDN-cacheable. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={screenshotUrl}
          alt={`Preview of ${subdomain}.is-pinoy.dev`}
          loading={loading}
          decoding="async"
          onError={() => setFailedUrl(screenshotUrl)}
          className="h-full w-full object-cover object-top"
        />
        {updating && (
          <span className="absolute right-2 bottom-2 border border-border bg-background/90 px-2 py-1 font-mono text-[9px] font-semibold tracking-[0.06em] text-foreground uppercase">
            Updating preview…
          </span>
        )}
      </div>
    )
  }

  if (screenshotStatus === "pending" || screenshotStatus === "processing") {
    return <PreviewPending subdomain={subdomain} />
  }

  return <PreviewUnavailable subdomain={subdomain} />
}
