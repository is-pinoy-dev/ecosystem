import Image from "next/image"
import Link from "next/link"
import { Button } from "@is-pinoy-dev/ui/components/button"
import { GitHubIcon, DiscordIcon } from "@/components/icons"

function FooterLink({
  href,
  external,
  children,
}: {
  href: string
  external?: boolean
  children: React.ReactNode
}) {
  const linkClass =
    "font-sans text-[13px] text-muted-foreground no-underline leading-[1.7] transition-colors duration-100 hover:text-primary h-auto p-0 justify-start"

  if (external) {
    return (
      <Button asChild variant="link" className={linkClass}>
        <a href={href} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      </Button>
    )
  }

  return (
    <Button asChild variant="link" className={linkClass}>
      <Link href={href}>{children}</Link>
    </Button>
  )
}

function IconLink({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: React.ReactNode
}) {
  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className="border-2 border-card bg-background text-muted-foreground shadow-[3px_3px_0_#111] transition-all duration-100 hover:border-primary hover:bg-background hover:text-primary"
      aria-label={label}
    >
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    </Button>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t-2 border-primary bg-background">
      <div className="mx-auto grid max-w-[960px] grid-cols-3 items-start gap-10 px-10 py-12 max-sm:grid-cols-1">
        {/* Left: Logo + tagline */}
        <div className="flex flex-col gap-4">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <Image
              src="/logo.png"
              alt="is-pinoy.dev logo"
              width={32}
              height={32}
              className="h-6 w-auto [image-rendering:pixelated] hover:animate-spin"
            />
            <Image
              src="/banner.gif"
              alt="is-pinoy.dev"
              width={120}
              height={24}
              unoptimized
              className="-ml-2 h-5 w-auto"
            />
          </Link>
          <span className="max-w-[220px] font-sans text-[13px] leading-[1.7] text-muted-foreground">
            Free subdomains for Filipino developers. Open source,
            community-driven, forever free.
          </span>
        </div>

        {/* Center: Links */}
        <div className="flex gap-10">
          <div className="flex flex-col gap-3">
            <span className="mb-1 font-pixel text-[7px] leading-[1.6] tracking-[0.1em] text-foreground">
              LINKS
            </span>
            <FooterLink href="https://docs.is-pinoy.dev" external>
              Documentation
            </FooterLink>
          </div>
          <div className="flex flex-col gap-3">
            <span className="mb-1 font-pixel text-[7px] leading-[1.6] tracking-[0.1em] text-foreground">
              LEGAL
            </span>
            <FooterLink href="/tos">Terms of Service</FooterLink>
            <FooterLink href="/privacy">Privacy Policy</FooterLink>
          </div>
        </div>

        {/* Right: Social + pride */}
        <div className="flex flex-col items-end gap-4">
          <div className="flex gap-2">
            <IconLink
              href={process.env.NEXT_PUBLIC_DISCORD_LINK ?? "#"}
              label="Join Discord"
            >
              <DiscordIcon />
            </IconLink>
            <IconLink href="https://github.com/is-pinoy-dev" label="GitHub">
              <GitHubIcon />
            </IconLink>
          </div>
          <span className="font-sans text-[12px] leading-[1.7] text-muted-foreground">
            Made with pride 🇵🇭
          </span>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[#1A1A1A] px-10 py-4 text-center max-[479px]:px-3.5 max-sm:px-5">
        <span className="font-mono text-[11px] tracking-[0.0625em] text-muted uppercase">
          © 2026 is-pinoy.dev
        </span>
      </div>
    </footer>
  )
}
