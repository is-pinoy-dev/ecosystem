"use client"

import Image from "next/image"
import Link from "next/link"
import { GitHubIcon, DiscordIcon } from "@/components/icons"

const btnBase =
  "inline-flex items-center gap-2 font-[family-name:var(--font-pixel)] text-[9px] tracking-[0.05em] no-underline cursor-pointer transition-all duration-100 px-4 py-[10px] hover:translate-x-[2px] hover:translate-y-[2px]"
const btnSolid =
  "text-[#0D0D0D] bg-[#F5C800] shadow-[3px_3px_0_#FAFAF5] hover:bg-[#FFE566] hover:shadow-[1px_1px_0_#FAFAF5]"
const btnOutline =
  "text-[#F5C800] bg-transparent border-2 border-[#F5C800] shadow-[3px_3px_0_#F5C800] hover:bg-[rgba(245,200,0,0.1)] hover:shadow-[1px_1px_0_#F5C800]"

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
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={`nav-btn ${btnBase} ${variant === "outline" ? btnOutline : btnSolid}`}
    >
      {children}
    </a>
  )
}

export function MainNav() {
  return (
    <nav className="nav-root fixed top-[46px] right-0 left-0 z-[100] flex h-16 items-center justify-between border-b-[3px] border-b-[#F5C800] bg-[rgba(13,13,13,0.85)] px-8 backdrop-blur">
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
