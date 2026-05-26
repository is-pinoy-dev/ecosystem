"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@is-pinoy-dev/ui/components/button"
import { GitHubIcon, DiscordIcon } from "@/components/icons"

const btnBase =
  "font-pixel text-[9px] tracking-[0.05em] transition-all duration-100 px-4 py-[10px] hover:translate-x-[2px] hover:translate-y-[2px] h-auto"
const btnSolid =
  "text-background bg-primary shadow-[3px_3px_0_var(--color-foreground)] hover:bg-primary-light hover:shadow-[1px_1px_0_var(--color-foreground)]"
const btnOutline =
  "text-primary bg-transparent border-2 border-primary shadow-[3px_3px_0_var(--color-primary)] hover:bg-primary/10 hover:shadow-[1px_1px_0_var(--color-primary)]"

function NavButton({
  href,
  label,
  variant = "solid",
  children,
}: {
  href: string
  label: string
  variant?: "solid" | "outline"
  children: React.ReactNode
}) {
  return (
    <Button
      asChild
      className={`nav-btn ${btnBase} ${variant === "outline" ? btnOutline : btnSolid}`}
      aria-label={label}
    >
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    </Button>
  )
}

export function MainNav() {
  return (
    <nav className="nav-root fixed top-[46px] right-0 left-0 z-[100] flex h-16 items-center justify-between border-b-[3px] border-b-primary bg-background/85 px-8 backdrop-blur">
      <Link href="/" className="flex items-center gap-3 no-underline">
        <Image
          src="/logo.png"
          alt="is-pinoy.dev logo"
          width={48}
          height={48}
          className="h-10 w-auto [image-rendering:pixelated] hover:animate-spin"
        />
        <Image
          src="/banner.gif"
          alt="is-pinoy.dev"
          width={200}
          height={40}
          unoptimized
          className="-ml-4 hidden h-9 w-auto md:block"
        />
      </Link>
      <div className="flex gap-3">
        <NavButton
          href={process.env.NEXT_PUBLIC_DISCORD_LINK ?? "#"}
          label="Join is-pinoy-dev on Discord"
          variant="outline"
        >
          <DiscordIcon size={14} />
          <span className="nav-btn-text">DISCORD</span>
        </NavButton>
        <NavButton
          href="https://github.com/is-pinoy-dev"
          label="Visit is-pinoy-dev on GitHub"
        >
          <GitHubIcon size={14} />
          <span className="nav-btn-text">GITHUB</span>
        </NavButton>
      </div>
    </nav>
  )
}
