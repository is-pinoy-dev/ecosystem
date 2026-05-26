import Link from "next/link"
import { GitHubIcon, DiscordIcon } from "@/components/icons"

function FooterLink({ href, external, children }: {
  href: string
  external?: boolean
  children: React.ReactNode
}) {
  const linkClass = "font-[family-name:var(--font-sans)] text-[13px] text-[#888888] no-underline leading-[1.7] transition-colors duration-100 hover:text-[#F5C800]"

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        {children}
      </a>
    )
  }

  return (
    <Link href={href} className={linkClass}>
      {children}
    </Link>
  )
}

function IconLink({ href, label, children }: {
  href: string
  label: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex items-center justify-center w-9 h-9 border-2 border-[#2A2A2A] text-[#888888] bg-[#0D0D0D] shadow-[3px_3px_0_#111] transition-all duration-100 hover:border-[#F5C800] hover:text-[#F5C800]"
    >
      {children}
    </a>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t-2 border-[#F5C800] bg-[#0D0D0D]">
      {/* Main footer grid */}
      <div className="max-w-[960px] mx-auto py-12 px-10 grid grid-cols-3 gap-10 items-start max-sm:grid-cols-1">
        {/* Left: Logo + tagline */}
        <div className="flex flex-col gap-4">
          <span className="font-[family-name:var(--font-pixel)] text-[0.65rem] text-[#F5C800] leading-[1.6] tracking-[0.05em]">
            is-pinoy.dev
          </span>
          <span className="font-[family-name:var(--font-sans)] text-[13px] text-[#888888] leading-[1.7] max-w-[220px]">
            Free subdomains for Filipino developers. Open source, community-driven, forever free.
          </span>
        </div>

        {/* Center: Link groups */}
        <div className="flex gap-10">
          <div className="flex flex-col gap-3">
            <span className="font-[family-name:var(--font-pixel)] text-[7px] text-[#FAFAF5] tracking-[0.1em] leading-[1.6] mb-1">
              PRODUCT
            </span>
            <FooterLink href="https://docs.is-pinoy.dev" external>Docs</FooterLink>
            <FooterLink href="https://docs.is-pinoy.dev/cli" external>CLI</FooterLink>
            <FooterLink href="https://docs.is-pinoy.dev/registry" external>Registry Schema</FooterLink>
          </div>

          <div className="flex flex-col gap-3">
            <span className="font-[family-name:var(--font-pixel)] text-[7px] text-[#FAFAF5] tracking-[0.1em] leading-[1.6] mb-1">
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
          <span className="font-[family-name:var(--font-sans)] text-[12px] text-[#888888] leading-[1.7]">
            Made with pride 🇵🇭
          </span>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[#1A1A1A] py-4 px-10 text-center max-sm:px-5 max-[479px]:px-3.5">
        <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#444444] tracking-[0.0625em] uppercase">
          © 2026 is-pinoy.dev
        </span>
      </div>
    </footer>
  )
}
