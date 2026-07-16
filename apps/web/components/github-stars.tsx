"use client"

import { useEffect, useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@is-pinoy-dev/ui/lib/utils"
import { GitHubIcon } from "@/components/icons"

const GITHUB_REPO = "is-pinoy-dev/domains"

function formatStars(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k`
  }
  return count.toLocaleString("en-US")
}

export function GitHubStars({ className }: { className?: string }) {
  const [stars, setStars] = useState<number | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    fetch(`https://api.github.com/repos/${GITHUB_REPO}`, {
      headers: { Accept: "application/vnd.github+json" },
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.stargazers_count === "number") {
          setStars(data.stargazers_count)
        }
      })
      .catch(() => {
        // Ignore network/rate-limit errors; the button still links to GitHub.
      })

    return () => controller.abort()
  }, [])

  return (
    <a
      href={`https://github.com/${GITHUB_REPO}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={
        stars !== null
          ? `Star is-pinoy.dev on GitHub — ${stars.toLocaleString("en-US")} stars`
          : "Star is-pinoy.dev on GitHub"
      }
      className={cn(
        "group inline-flex h-10 shrink-0 items-center gap-2 border border-border bg-background px-3 text-[13px] font-medium text-foreground no-underline transition-colors duration-[140ms] hover:border-accent/60 hover:text-accent focus-visible:border-accent focus-visible:text-accent",
        className
      )}
    >
      <GitHubIcon size={15} />
      <span className="flex items-center gap-1">
        <Star
          className="size-3.5 text-primary transition-transform duration-[140ms] group-hover:scale-110"
          fill="currentColor"
          aria-hidden="true"
        />
        <span className="min-w-[1.5ch] text-center tabular-nums">
          {stars !== null ? formatStars(stars) : "—"}
        </span>
      </span>
    </a>
  )
}
