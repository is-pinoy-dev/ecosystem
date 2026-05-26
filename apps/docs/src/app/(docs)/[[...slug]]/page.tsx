import { getPageImage, getPageMarkdownUrl, source } from "@/lib/source"
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from "fumadocs-ui/layouts/docs/page"
import { notFound } from "next/navigation"
import { getMDXComponents } from "@/components/mdx"
import type { Metadata } from "next"
import { createRelativeLink } from "fumadocs-ui/mdx"
import { gitConfig } from "@/lib/shared"

const base = 'https://docs.is-pinoy.dev'

function buildSchemas(page: ReturnType<typeof source.getPage> & object) {
  const breadcrumbItems = [
    { name: 'Docs', url: base },
    ...page.slugs.map((_, i) => ({
      name: i === page.slugs.length - 1
        ? page.data.title
        : (page.slugs[i] ?? '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      url: `${base}/${page.slugs.slice(0, i + 1).join('/')}`,
    })),
  ]

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: page.data.title,
    description: page.data.description,
    url: `${base}${page.url}`,
    isPartOf: { '@type': 'WebSite', name: 'is-pinoy.dev docs', url: base },
  }

  return { breadcrumbSchema, articleSchema }
}

export default async function Page(props: PageProps<"/[[...slug]]">) {
  const params = await props.params
  const page = source.getPage(params.slug)
  if (!page) notFound()

  const MDX = page.data.body
  const markdownUrl = getPageMarkdownUrl(page).url
  const { breadcrumbSchema, articleSchema } = buildSchemas(page)

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-0">
        {page.data.description}
      </DocsDescription>
      <div className="flex flex-row items-center gap-2 border-b pb-6">
        <MarkdownCopyButton markdownUrl={markdownUrl} />
        <ViewOptionsPopover
          markdownUrl={markdownUrl}
          githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/content/docs/${page.path}`}
        />
      </div>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  )
}

export async function generateStaticParams() {
  return source.generateParams()
}

export async function generateMetadata(
  props: PageProps<"/[[...slug]]">
): Promise<Metadata> {
  const params = await props.params
  const page = source.getPage(params.slug)
  if (!page) notFound()

  return {
    title: page.data.title,
    description: page.data.description,
    alternates: {
      canonical: `${base}${page.url}`,
    },
    openGraph: {
      url: `${base}${page.url}`,
      type: 'article',
      images: getPageImage(page).url,
    },
    twitter: {
      card: 'summary_large_image',
    },
  }
}
