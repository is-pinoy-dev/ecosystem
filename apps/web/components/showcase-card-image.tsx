"use client"

import { useState, useEffect } from "react"

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
  const [loaded, setLoaded] = useState(false)
  const safeIdx = Math.min(idx, logoIdx)
  const advance = () => setIdx((i) => Math.min(i + 1, logoIdx))

  // Reset fade-in whenever the source changes
  useEffect(() => {
    setLoaded(false)
  }, [safeIdx])

  // Fall through to logo if the favicon request stalls
  useEffect(() => {
    if (safeIdx !== faviconIdx) return
    const t = setTimeout(advance, 5000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeIdx])

  const src = sources[safeIdx]
  const isCover = safeIdx === 0 && ogImage !== null
  const isLogo = safeIdx === logoIdx

  if (isCover) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        aria-hidden
        onLoad={() => setLoaded(true)}
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
        src={src}
        alt=""
        aria-hidden
        onLoad={() => setLoaded(true)}
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
