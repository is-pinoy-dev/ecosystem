"use client"

import { useState, useEffect, useRef } from "react"

function ClaimedSubdomainFallback({
  subdomain,
  owner,
  size = "sm",
}: {
  subdomain: string
  owner?: string
  size?: "sm" | "lg"
}) {
  return (
    <div className="relative flex h-full w-full flex-col justify-center overflow-hidden bg-background px-5 py-4 sm:px-6 sm:py-5">
      <div className="flex items-center gap-3">
        <span className="shrink-0 font-mono text-[9px] font-semibold tracking-[0.14em] text-accent uppercase sm:text-[10px]">
          Claimed subdomain
        </span>
        <span className="h-px min-w-4 flex-1 bg-foreground/20" aria-hidden="true" />
      </div>

      <div className="mt-3 flex min-w-0 items-stretch gap-3 sm:mt-4">
        <span className="w-[3px] shrink-0 bg-primary" aria-hidden="true" />
        <span
          className={`min-w-0 truncate font-sans font-bold tracking-tight text-foreground ${
            size === "lg" ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl"
          }`}
        >
          {subdomain}.is-pinoy.dev
        </span>
      </div>

      {owner && (
        <span className="mt-2 truncate pl-[15px] font-sans text-xs text-muted-foreground sm:text-sm">
          @{owner}
        </span>
      )}

      <div
        className="pointer-events-none absolute right-4 bottom-3 hidden h-9 w-16 sm:block"
        aria-hidden="true"
      >
        <span className="absolute top-0 right-0 h-3 w-px bg-border" />
        <span className="absolute top-1 right-6 h-px w-4 bg-border" />
        <span className="absolute right-2 bottom-0 h-4 w-px bg-primary/60" />
        <span className="absolute right-10 bottom-1 h-px w-3 bg-border" />
        <span className="absolute top-3 right-12 h-2 w-px bg-border" />
      </div>
    </div>
  )
}

export function ShowcaseCardImage({
  ogImage,
  subdomain,
  owner,
  size = "sm",
}: {
  ogImage: string | null
  subdomain: string
  owner?: string
  size?: "sm" | "lg"
}) {
  const sources = [
    ...(ogImage ? [ogImage] : []),
    `https://${subdomain}.is-pinoy.dev/favicon.ico`,
    `/logo.png`,
  ]
  const logoIdx = sources.length - 1
  const faviconIdx = logoIdx - 1

  const [idx, setIdx] = useState(0)
  // Track which src has finished loading so the fade-in is derived, not raced
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const safeIdx = Math.min(idx, logoIdx)
  const src = sources[safeIdx]!
  const loaded = loadedSrc === src
  const advance = () => setIdx((i) => Math.min(i + 1, logoIdx))

  // Catch images that were already cached and completed before React attached
  // the onLoad handler (common after hydration) — onLoad would never fire.
  useEffect(() => {
    const img = imgRef.current
    if (img?.complete && img.naturalWidth > 0) setLoadedSrc(src)
  }, [src])

  // Fall through to the logo if the favicon request stalls
  useEffect(() => {
    if (safeIdx !== faviconIdx) return
    const t = setTimeout(advance, 5000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeIdx])

  const isCover = safeIdx === 0 && ogImage !== null
  const isLogo = safeIdx === logoIdx

  // All image sources exhausted — render the branded "claimed subdomain" card
  if (isLogo) {
    return (
      <ClaimedSubdomainFallback subdomain={subdomain} owner={owner} size={size} />
    )
  }

  if (isCover) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        ref={imgRef}
        src={src}
        alt=""
        aria-hidden
        onLoad={() => setLoadedSrc(src)}
        onError={advance}
        className={`h-full w-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    )
  }

  // Favicon path
  return (
    <div className="flex h-full w-full items-center justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={src}
        ref={imgRef}
        src={src}
        alt=""
        aria-hidden
        onLoad={() => setLoadedSrc(src)}
        onError={advance}
        className={`h-10 w-10 object-contain transition-opacity duration-200 [image-rendering:pixelated] ${loaded ? "opacity-60" : "opacity-0"}`}
      />
    </div>
  )
}
