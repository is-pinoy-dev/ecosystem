import { ArrowUpRight } from "lucide-react"
import { Container } from "@is-pinoy-dev/ui/components/container"
import {
  SectionEyebrow,
  SectionHeader,
  SectionTitle,
} from "@is-pinoy-dev/ui/components/section-header"

interface Provider {
  name: string
  description: string
  href: string
  logo: React.ReactNode
}

function VercelLogo() {
  return (
    <svg
      width="30"
      height="26"
      viewBox="0 0 76 65"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
    </svg>
  )
}

function GitHubPagesLogo() {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}

function CloudflareLogo() {
  return (
    <svg
      width="38"
      height="26"
      viewBox="0 0 109 44"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M87.1 17.8c-.4-1.4-1-2.7-1.8-3.9-2.7-4.2-7.3-6.9-12.4-6.9-1.9 0-3.8.4-5.5 1.1C65.3 3.5 60 0 54 0c-9.3 0-16.9 7.1-17.5 16.2C30 17.7 24 23.7 24 31c0 7.2 5.8 13 13 13h49c6.1 0 11-4.9 11-11 0-6.8-5.8-12.2-9.9-15.2z" />
    </svg>
  )
}

const PROVIDERS: Provider[] = [
  {
    name: "Vercel",
    description: "Fast deployments with a straightforward CNAME setup.",
    href: "https://docs.is-pinoy.dev/guides/providers/vercel",
    logo: <VercelLogo />,
  },
  {
    name: "GitHub Pages",
    description: "Simple hosting directly from your repository.",
    href: "https://docs.is-pinoy.dev/guides/providers/github-pages",
    logo: <GitHubPagesLogo />,
  },
  {
    name: "Cloudflare Pages",
    description: "Fast global builds with flexible DNS controls.",
    href: "https://docs.is-pinoy.dev/guides/providers/cloudflare-pages",
    logo: <CloudflareLogo />,
  },
]

export function ProviderGuides() {
  return (
    <section
      className="border-y border-border bg-surface-subtle py-16 sm:py-20"
      aria-labelledby="providers-title"
    >
      <Container>
        <SectionHeader className="mb-10">
          <SectionEyebrow>Works with the tools you use</SectionEyebrow>
          <SectionTitle id="providers-title">Supported providers</SectionTitle>
        </SectionHeader>

        <div className="grid border-y border-border md:grid-cols-3">
          {PROVIDERS.map((provider) => (
            <a
              key={provider.name}
              href={provider.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-4 border-b border-border px-0 py-6 text-foreground no-underline last:border-b-0 md:border-r md:border-b-0 md:px-6 md:first:pl-0 md:last:border-r-0 md:last:pr-0"
            >
              <span
                className={
                  provider.name === "Cloudflare Pages"
                    ? "mt-1 text-[#F6821F]"
                    : "mt-1 text-foreground"
                }
              >
                {provider.logo}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  {provider.name}
                  <ArrowUpRight
                    className="size-3.5 text-accent opacity-0 transition-opacity group-hover:opacity-100"
                    aria-hidden="true"
                  />
                </span>
                <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                  {provider.description}
                </span>
              </span>
            </a>
          ))}
        </div>
      </Container>
    </section>
  )
}
