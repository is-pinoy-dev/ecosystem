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
  const safeIdx = Math.min(idx, logoIdx)
  const advance = () => setIdx((i) => Math.min(i + 1, logoIdx))

  // Fall through to logo if the favicon request stalls
  useEffect(() => {
    if (safeIdx !== faviconIdx) return
    const t = setTimeout(advance, 3000)
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
        onError={advance}
        className="h-full w-full object-cover"
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
        onError={advance}
        className={`object-contain [image-rendering:pixelated] ${
          isLogo
            ? "h-8 w-8 opacity-25 grayscale"
            : "h-10 w-10 opacity-60"
        }`}
      />
    </div>
  )
}
