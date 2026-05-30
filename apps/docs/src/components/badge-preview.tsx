'use client'

import { BADGE_HOST } from '@/lib/badge-host'
import { useSubdomainStore } from '@/store/subdomain'

interface BadgePreviewProps {
  path: string
  alt?: string
}

export function BadgePreview({ path, alt = 'Badge preview' }: BadgePreviewProps) {
  const { name } = useSubdomainStore()
  const resolved = path.replaceAll('yourname', name)
  const separator = resolved.includes('?') ? '&' : '?'
  const src = `${BADGE_HOST}${resolved}${separator}preview=true`
  return (
    <div className="my-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} style={{ imageRendering: 'pixelated' }} />
    </div>
  )
}
