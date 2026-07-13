import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { Button } from "@is-pinoy-dev/ui/components/button"
import { Container } from "@is-pinoy-dev/ui/components/container"
import { GitHubIcon } from "@/components/icons"

const NAV_LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/showcase", label: "Showcase" },
  { href: "https://docs.is-pinoy.dev", label: "Docs", external: true },
]

export function MainNav() {
  return (
    <nav className="nav-root fixed inset-x-0 top-0 z-50 h-16 border-b border-border bg-background/95 backdrop-blur-md">
      <Container className="flex h-full items-center justify-between gap-6">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 no-underline"
          aria-label="is-pinoy.dev home"
        >
          <Image
            src="/logo.png"
            alt=""
            width={40}
            height={40}
            className="h-8 w-auto shrink-0 [image-rendering:pixelated]"
          />
          <Image
            src="/banner.gif"
            alt="is-pinoy.dev"
            width={200}
            height={40}
            unoptimized
            priority
            className="h-7 w-auto max-w-[150px] object-contain object-left sm:max-w-[180px]"
          />
        </Link>

        <div className="nav-links flex items-center gap-7">
          {NAV_LINKS.map((link) =>
            link.external ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-foreground/75 no-underline transition-colors hover:text-accent"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-foreground/75 no-underline transition-colors hover:text-accent"
              >
                {link.label}
              </Link>
            )
          )}
          <a
            href="https://github.com/is-pinoy-dev"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/75 no-underline transition-colors hover:text-accent"
          >
            <GitHubIcon size={16} />
            GitHub
          </a>
        </div>

        <Button asChild size="sm" className="shrink-0">
          <Link href="/#claim">
            Claim yours
            <ArrowUpRight aria-hidden="true" />
          </Link>
        </Button>
      </Container>
    </nav>
  )
}
