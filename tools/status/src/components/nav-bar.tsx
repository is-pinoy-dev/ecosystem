"use client"

import { Link, useRevalidator } from "react-router"
import { useState } from "react"
import { RefreshCw } from "lucide-react"
import { Button } from "@is-pinoy-dev/ui/components/button"
import { Container } from "@is-pinoy-dev/ui/components/container"

const NAV_LINKS = [
  { href: "https://is-pinoy.dev", label: "Home" },
  { href: "https://docs.is-pinoy.dev", label: "Docs" },
]

export function NavBar() {
  const { revalidate } = useRevalidator()
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  async function handleRefresh() {
    setLoading(true)
    try {
      const res = await fetch("/api/refresh", { method: "POST" })
      if (res.status === 429) {
        const { retryAfter } = (await res.json()) as { retryAfter: number }
        setCooldown(retryAfter)
        const interval = setInterval(() => {
          setCooldown((s) => {
            if (s <= 1) {
              clearInterval(interval)
              return 0
            }
            return s - 1
          })
        }, 1000)
        return
      }
      await revalidate()
    } finally {
      setLoading(false)
    }
  }

  return (
    <nav className="sticky top-0 z-50 h-16 border-b border-border bg-background/98">
      <Container className="flex h-full items-center gap-6">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2.5 no-underline"
          aria-label="is-pinoy.dev status home"
        >
          <img
            src="/logo.png"
            alt=""
            className="size-8 shrink-0 object-contain [image-rendering:pixelated]"
          />
          <img
            src="/status-banner.gif"
            alt="Status — is-pinoy.dev"
            className="hidden h-6 w-auto object-contain md:block"
          />
        </Link>

        <div className="ml-auto flex items-center gap-2 sm:gap-5">
          {NAV_LINKS.map(({ href, label }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden text-[13px] font-medium text-foreground/85 no-underline transition-colors duration-[140ms] hover:text-accent focus-visible:text-accent sm:inline"
            >
              {label}
            </a>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading || cooldown > 0}
          >
            <RefreshCw
              className={`size-3.5 ${loading ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            {loading
              ? "Checking"
              : cooldown > 0
                ? `Wait ${cooldown}s`
                : "Refresh"}
          </Button>
        </div>
      </Container>
    </nav>
  )
}
