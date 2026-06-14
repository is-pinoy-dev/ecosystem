"use client"

import { useState, useEffect, useRef } from "react"

export function ShowcaseCardImage({
  ogImage,
  subdomain,
}: {
  ogImage: string | null
  subdomain: string
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
        className={`object-contain [image-rendering:pixelated] transition-opacity duration-200 ${
          isLogo
            ? `h-8 w-8 grayscale ${loaded ? "opacity-25" : "opacity-0"}`
            : `h-10 w-10 ${loaded ? "opacity-60" : "opacity-0"}`
        }`}
      />
    </div>
  )
}
