"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Menu, X } from "lucide-react"
import { Button } from "@is-pinoy-dev/ui/components/button"
import { Container } from "@is-pinoy-dev/ui/components/container"
import { AnimatedThemeToggler } from "@/components/animated-theme-toggler"
import { GitHubStars } from "@/components/github-stars"
import { GitHubIcon } from "@/components/icons"

const NAV_LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/showcase", label: "Showcase" },
  { href: "https://docs.is-pinoy.dev", label: "Docs", external: true },
]

function BrandLink() {
  return (
    <Link
      href="/"
      className="flex max-w-[220px] min-w-0 shrink-0 items-center gap-2.5 no-underline"
      aria-label="is-pinoy.dev home"
    >
      <Image
        src="/logo.png"
        alt=""
        width={32}
        height={32}
        className="size-8 shrink-0 object-contain object-left [image-rendering:pixelated]"
      />
      <Image
        src="/banner.gif"
        alt="is-pinoy.dev"
        width={200}
        height={26}
        unoptimized
        priority
        className="h-6 w-auto max-w-[150px] object-contain object-left"
      />
    </Link>
  )
}

export function MainNav() {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }

    function handlePointerDown(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !triggerRef.current?.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("mousedown", handlePointerDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("mousedown", handlePointerDown)
    }
  }, [open])

  const closeMenu = () => setOpen(false)

  return (
    <nav className="sticky top-0 z-50 h-[60px] border-b border-border bg-background/98 lg:h-16">
      <Container className="flex h-full items-center justify-between gap-6">
        <BrandLink />

        <div className="hidden items-center gap-9 lg:flex xl:gap-11">
          {NAV_LINKS.map((link) =>
            link.external ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] font-medium text-foreground/85 no-underline transition-colors duration-[140ms] hover:text-accent focus-visible:text-accent"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="text-[13px] font-medium text-foreground/85 no-underline transition-colors duration-[140ms] hover:text-accent focus-visible:text-accent"
              >
                {link.label}
              </Link>
            )
          )}
          <a
            href="https://github.com/is-pinoy-dev"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-foreground/85 no-underline transition-colors duration-[140ms] hover:text-accent focus-visible:text-accent"
          >
            <GitHubIcon size={16} />
            GitHub
          </a>
        </div>

        <div className="flex items-center gap-1 lg:gap-2">
          <AnimatedThemeToggler />

          <GitHubStars className="hidden lg:inline-flex" />

          <Button
            asChild
            className="hidden h-10 min-w-[132px] shrink-0 gap-2 px-4 text-[13px] lg:inline-flex"
          >
            <Link href="/#claim">
              Claim a domain
              <ArrowRight className="size-[15px]" aria-hidden="true" />
            </Link>
          </Button>

          <button
            ref={triggerRef}
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
            className="flex size-11 shrink-0 items-center justify-center text-foreground transition-colors duration-[140ms] hover:text-accent lg:hidden"
          >
            {open ? (
              <X className="size-5" aria-hidden="true" />
            ) : (
              <Menu className="size-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </Container>

      {open && (
        <div
          ref={menuRef}
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className="absolute inset-x-0 top-full border-x border-b border-border bg-background lg:hidden"
        >
          {NAV_LINKS.map((link) =>
            link.external ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeMenu}
                className="flex min-h-12 items-center border-b border-border px-5 text-sm font-medium text-foreground no-underline transition-colors duration-[140ms] hover:text-accent"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className="flex min-h-12 items-center border-b border-border px-5 text-sm font-medium text-foreground no-underline transition-colors duration-[140ms] hover:text-accent"
              >
                {link.label}
              </Link>
            )
          )}
          <a
            href="https://github.com/is-pinoy-dev"
            target="_blank"
            rel="noopener noreferrer"
            onClick={closeMenu}
            className="flex min-h-12 items-center gap-2 border-b border-border px-5 text-sm font-medium text-foreground no-underline transition-colors duration-[140ms] hover:text-accent"
          >
            <GitHubIcon size={16} />
            GitHub
          </a>
          <Link
            href="/#claim"
            onClick={closeMenu}
            className="flex min-h-12 items-center justify-center bg-primary px-5 text-[13px] font-semibold text-primary-foreground no-underline transition-colors duration-[140ms] hover:bg-primary-light"
          >
            Claim a domain
          </Link>
        </div>
      )}
    </nav>
  )
}
