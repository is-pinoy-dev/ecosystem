import Link from "next/link"
import { Card, CardContent } from "@is-pinoy-dev/ui/components/card"
import { Badge } from "@is-pinoy-dev/ui/components/badge"

interface Provider {
  name: string
  href: string | null
  active: boolean
  logo: React.ReactNode
}

function VercelLogo() {
  return (
    <svg width="32" height="28" viewBox="0 0 76 65" fill="#FAFAF5" aria-hidden="true">
      <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
    </svg>
  )
}

function NetlifyLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 128 128" fill="#00C7B7" aria-hidden="true">
      <path d="M69.3 36.4l-4.4-4.4-25.5 25.5 4.4 4.4 25.5-25.5zM58.7 91.6l4.4 4.4 25.5-25.5-4.4-4.4-25.5 25.5z"/>
      <path d="M64 0C28.7 0 0 28.7 0 64s28.7 64 64 64 64-28.7 64-64S99.3 0 64 0zm0 120c-30.9 0-56-25.1-56-56s25.1-56 56-56 56 25.1 56 56-25.1 56-56 56z"/>
    </svg>
  )
}

function GitHubPagesLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="#FAFAF5" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}

function CloudflareLogo() {
  return (
    <svg width="36" height="24" viewBox="0 0 109 44" fill="#F6821F" aria-hidden="true">
      <path d="M87.1 17.8c-.4-1.4-1-2.7-1.8-3.9-2.7-4.2-7.3-6.9-12.4-6.9-1.9 0-3.8.4-5.5 1.1C65.3 3.5 60 0 54 0c-9.3 0-16.9 7.1-17.5 16.2C30 17.7 24 23.7 24 31c0 7.2 5.8 13 13 13h49c6.1 0 11-4.9 11-11 0-6.8-5.8-12.2-9.9-15.2z"/>
    </svg>
  )
}

const PROVIDERS: Provider[] = [
  {
    name: "Vercel",
    href: "https://docs.is-pinoy.dev/providers/vercel",
    active: true,
    logo: <VercelLogo />,
  },
  {
    name: "Netlify",
    href: null,
    active: false,
    logo: <NetlifyLogo />,
  },
  {
    name: "GitHub Pages",
    href: null,
    active: false,
    logo: <GitHubPagesLogo />,
  },
  {
    name: "Cloudflare Pages",
    href: null,
    active: false,
    logo: <CloudflareLogo />,
  },
]

function ProviderCard({ provider }: { provider: Provider }) {
  const card = (
    <Card
      className={`border-[3px] bg-background flex flex-col items-center gap-4 p-7 relative transition-all duration-100 ${
        provider.active
          ? "border-primary shadow-[5px_5px_0_var(--color-primary-dark)] cursor-pointer hover:shadow-[6px_6px_0_var(--color-primary-dark)] hover:-translate-x-px hover:-translate-y-px"
          : "border-card shadow-[5px_5px_0_#111] opacity-40 cursor-not-allowed"
      }`}
    >
      <CardContent className="flex flex-col items-center gap-4 p-0 w-full relative">
        {!provider.active && (
          <Badge
            variant="outline"
            className="absolute top-0 right-0 font-pixel text-[7px] text-muted-foreground border-border px-[6px] py-[3px] tracking-[0.05em]"
          >
            COMING SOON
          </Badge>
        )}
        <div className="h-9 flex items-center justify-center">
          {provider.logo}
        </div>
        <span
          className={`font-pixel text-[8px] tracking-[0.05em] leading-[1.6] text-center ${
            provider.active ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          {provider.name}
        </span>
      </CardContent>
    </Card>
  )

  if (provider.active && provider.href) {
    return (
      <Link href={provider.href} target="_blank" rel="noopener noreferrer" className="no-underline">
        {card}
      </Link>
    )
  }

  return card
}

export function ProviderGuides() {
  return (
    <section className="w-full max-w-[960px] mx-auto py-20 px-10">
      <div className="h-[2px] bg-primary mb-16 shadow-[0_2px_0_var(--color-primary-dark)]" />
      <h2
        className="font-pixel text-primary tracking-[0.1em] mb-10 leading-[1.6]"
        style={{ fontSize: "clamp(0.5rem, 1.5vw, 0.75rem)" }}
      >
        {"// PROVIDER GUIDES"}
      </h2>
      <div className="grid grid-cols-4 gap-4 max-sm:grid-cols-2">
        {PROVIDERS.map((p) => (
          <ProviderCard key={p.name} provider={p} />
        ))}
      </div>
    </section>
  )
}
