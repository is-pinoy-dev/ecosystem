import Image from "next/image"
import Link from "next/link"
import { Sun } from "lucide-react"
import { Container } from "@is-pinoy-dev/ui/components/container"

const RESOURCE_LINKS = [
  { label: "Docs", href: "https://docs.is-pinoy.dev", external: true },
  { label: "Showcase", href: "/showcase" },
  { label: "Status", href: "https://status.is-pinoy.dev", external: true },
]

const LEGAL_LINKS = [
  { label: "Terms of Service", href: "/tos" },
  { label: "Privacy Policy", href: "/privacy" },
  {
    label: "Report abuse",
    href: "https://github.com/is-pinoy-dev/domains/issues/new?template=abuse-report.md&title=%5BABUSE%5D+",
    external: true,
  },
]

const COMMUNITY_LINKS = [
  { label: "GitHub", href: "https://github.com/is-pinoy-dev", external: true },
  { label: "Discord", href: "https://discord.gg/MVrgEfFExh", external: true },
]

function FooterLink({
  label,
  href,
  external,
}: {
  label: string
  href: string
  external?: boolean
}) {
  const className =
    "text-xs leading-[1.5] text-foreground no-underline transition-colors duration-[140ms] hover:text-accent hover:underline"
  return external ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {label}
    </a>
  ) : (
    <Link href={href} className={className}>
      {label}
    </Link>
  )
}

function FooterColumn({
  heading,
  links,
}: {
  heading: string
  links: typeof RESOURCE_LINKS
}) {
  return (
    <div className="flex flex-col gap-[6px]">
      <p className="m-0 mb-[3px] font-mono text-[10px] font-semibold tracking-[0.1em] text-foreground uppercase">
        {heading}
      </p>
      {links.map((link) => (
        <FooterLink key={link.label} {...link} />
      ))}
    </div>
  )
}

export function SiteFooter() {
  const updated = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <footer className="bg-background">
      <Container className="grid gap-8 py-8 md:grid-cols-[1.6fr_0.75fr_0.85fr] lg:grid-cols-[1.6fr_0.75fr_0.85fr_0.75fr_0.8fr] lg:gap-10 lg:py-6 xl:py-8">
        <div className="md:col-span-3 lg:col-span-1">
          <Link
            href="/"
            className="flex items-center gap-2 no-underline"
            aria-label="is-pinoy.dev home"
          >
            <Image
              src="/logo.png"
              alt=""
              width={27}
              height={27}
              className="size-[27px] [image-rendering:pixelated]"
            />
            <Image
              src="/banner.gif"
              alt="is-pinoy.dev"
              width={160}
              height={21}
              unoptimized
              className="h-[21px] w-auto object-contain object-left"
            />
          </Link>
          <p className="m-0 mt-2 text-xs text-muted-foreground">
            Free forever, built by the community.
          </p>
          <p className="m-0 mt-4 text-[11px] text-muted-foreground">
            © 2026 is-pinoy.dev
          </p>
          <p className="m-0 mt-1 text-[11px] text-muted-foreground">
            Updated {updated}
          </p>
        </div>

        <FooterColumn heading="Resources" links={RESOURCE_LINKS} />
        <FooterColumn heading="Legal" links={LEGAL_LINKS} />
        <FooterColumn heading="Community" links={COMMUNITY_LINKS} />

        <div className="flex items-end justify-start md:col-span-3 md:justify-end lg:col-span-1">
          <p className="m-0 flex items-center gap-2 text-[11px] text-foreground">
            Made with pride
            <Sun className="size-[13px] text-primary" aria-hidden="true" />
          </p>
        </div>
      </Container>
    </footer>
  )
}
