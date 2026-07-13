import Image from "next/image"
import Link from "next/link"
import { Button } from "@is-pinoy-dev/ui/components/button"
import { Container } from "@is-pinoy-dev/ui/components/container"
import { DiscordIcon, GitHubIcon } from "@/components/icons"

const RESOURCE_LINKS = [
  { label: "Documentation", href: "https://docs.is-pinoy.dev", external: true },
  { label: "Status", href: "https://status.is-pinoy.dev", external: true },
  { label: "Showcase", href: "/showcase" },
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
    "text-sm text-muted-foreground no-underline transition-colors hover:text-accent"
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

export function SiteFooter() {
  return (
    <footer className="bg-background">
      <Container className="grid gap-12 py-12 md:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr]">
        <div>
          <Link
            href="/"
            className="flex items-center gap-2 no-underline"
            aria-label="is-pinoy.dev home"
          >
            <Image
              src="/logo.png"
              alt=""
              width={34}
              height={34}
              className="h-7 w-auto [image-rendering:pixelated]"
            />
            <Image
              src="/banner.gif"
              alt="is-pinoy.dev"
              width={160}
              height={32}
              unoptimized
              className="h-6 w-auto object-contain object-left"
            />
          </Link>
          <p className="m-0 mt-5 max-w-[300px] text-sm leading-6 text-muted-foreground">
            Free subdomains for Filipino developers. Open source,
            community-driven, and forever free.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <p className="m-0 font-mono text-xs font-semibold tracking-[0.1em] text-foreground uppercase">
            Resources
          </p>
          {RESOURCE_LINKS.map((link) => (
            <FooterLink key={link.label} {...link} />
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <p className="m-0 font-mono text-xs font-semibold tracking-[0.1em] text-foreground uppercase">
            Legal
          </p>
          {LEGAL_LINKS.map((link) => (
            <FooterLink key={link.label} {...link} />
          ))}
        </div>

        <div className="flex flex-col items-start gap-3">
          <p className="m-0 font-mono text-xs font-semibold tracking-[0.1em] text-foreground uppercase">
            Community
          </p>
          <Button asChild variant="link">
            <a
              href="https://github.com/is-pinoy-dev"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GitHubIcon size={16} /> GitHub
            </a>
          </Button>
          <Button asChild variant="link">
            <a
              href="https://discord.gg/MVrgEfFExh"
              target="_blank"
              rel="noopener noreferrer"
            >
              <DiscordIcon size={16} /> Discord
            </a>
          </Button>
        </div>
      </Container>

      <div className="border-t border-border py-5">
        <Container className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 is-pinoy.dev</span>
          <span>Libre. Gawang komunidad.</span>
        </Container>
      </div>
    </footer>
  )
}
