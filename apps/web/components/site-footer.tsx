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
      className="border-2 border-card text-muted-foreground bg-background shadow-[3px_3px_0_#111] transition-all duration-100 hover:border-primary hover:text-primary hover:bg-background"
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
      <div className="max-w-[960px] mx-auto py-12 px-10 grid grid-cols-3 gap-10 items-start max-sm:grid-cols-1">
        {/* Left: Logo + tagline */}
        <div className="flex flex-col gap-4">
          <span className="font-pixel text-[0.65rem] text-primary leading-[1.6] tracking-[0.05em]">
            is-pinoy.dev
          </span>
          <span className="font-sans text-[13px] text-muted-foreground leading-[1.7] max-w-[220px]">
            Free subdomains for Filipino developers. Open source, community-driven, forever free.
          </span>
        </div>

        {/* Center: Link groups */}
        <div className="flex gap-10">
          <div className="flex flex-col gap-3">
            <span className="font-pixel text-[7px] text-foreground tracking-[0.1em] leading-[1.6] mb-1">
              PRODUCT
            </span>
            <FooterLink href="https://docs.is-pinoy.dev" external>Docs</FooterLink>
            <FooterLink href="https://docs.is-pinoy.dev/cli" external>CLI</FooterLink>
            <FooterLink href="https://docs.is-pinoy.dev/registry" external>Registry Schema</FooterLink>
          </div>

          <div className="flex flex-col gap-3">
            <span className="font-pixel text-[7px] text-foreground tracking-[0.1em] leading-[1.6] mb-1">
              LEGAL
            </span>
            <FooterLink href="/tos">Terms of Service</FooterLink>
            <FooterLink href="/privacy">Privacy Policy</FooterLink>
          </div>
        </div>

        {/* Right: Social + pride */}
        <div className="flex flex-col gap-4 items-end">
          <div className="flex gap-2">
            <IconLink href={process.env.NEXT_PUBLIC_DISCORD_LINK ?? "#"} label="Join Discord">
              <DiscordIcon />
            </IconLink>
            <IconLink href="https://github.com/is-pinoy-dev" label="GitHub">
              <GitHubIcon />
            </IconLink>
          </div>
          <span className="font-sans text-[12px] text-muted-foreground leading-[1.7]">
            Made with pride 🇵🇭
          </span>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[#1A1A1A] py-4 px-10 text-center max-sm:px-5 max-[479px]:px-3.5">
        <span className="font-mono text-[11px] text-muted tracking-[0.0625em] uppercase">
          © 2026 is-pinoy.dev
        </span>
      </div>
    </footer>
  )
}
