"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@is-pinoy-dev/ui/components/button"
import { GitHubIcon, DiscordIcon } from "@/components/icons"

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
      variant={variant === "outline" ? "outline-shadow" : "default-shadow"}
      className="nav-btn"
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
      <div className="flex items-center gap-6">
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
        <a
          href="https://docs.is-pinoy.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="font-pixel text-[9px] tracking-[0.05em] text-muted-foreground transition-colors duration-100 hover:text-primary no-underline"
        >
          DOCS
        </a>
      </div>
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
