"use client"

import { useState } from "react"

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

  const [idx, setIdx] = useState(0)
  const safeIdx = Math.min(idx, sources.length - 1)
  const isCover = ogImage !== null && safeIdx === 0

  if (isCover) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={sources[safeIdx]}
        alt=""
        aria-hidden
        onError={() => setIdx((i) => i + 1)}
        className="h-full w-full object-cover"
      />
    )
  }

  const isLogo = safeIdx === sources.length - 1

  return (
    <div className="flex h-full w-full items-center justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={sources[safeIdx]}
        alt=""
        aria-hidden
        onError={() => setIdx((i) => Math.min(i + 1, sources.length - 1))}
        className={`object-contain [image-rendering:pixelated] ${isLogo ? "h-8 w-8 opacity-20" : "h-10 w-10 opacity-60"}`}
      />
    </div>
  )
}
