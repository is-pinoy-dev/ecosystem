import type { MetadataRoute } from 'next'
import { source } from '@/lib/source'

const base = 'https://docs.is-pinoy.dev'

export default function sitemap(): MetadataRoute.Sitemap {
  return source.getPages().map((page) => ({
    url: `${base}${page.url}`,
    changeFrequency: 'weekly',
    priority: page.slugs.length === 0 ? 1 : 0.8,
  }))
}
