export function badgeCacheHeaders(): Record<string, string> {
  return { 'Cache-Control': 'public, max-age=86400' }
}
