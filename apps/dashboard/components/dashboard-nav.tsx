"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Globe, LayoutDashboard, Sparkles, UserRound } from "lucide-react"
import { cn } from "@is-pinoy-dev/ui/lib/utils"

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/domains", label: "Domains", icon: Globe },
  { href: "/claim", label: "Claim", icon: Sparkles },
  { href: "/account", label: "Account", icon: UserRound },
]

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href)
}

/**
 * Horizontal tab rail below the header — the dashboard's only navigation
 * chrome. The active tab carries a yellow rule per the Banig Grid system;
 * on narrow screens the rail scrolls horizontally.
 */
export function DashboardTabs() {
  const pathname = usePathname()

  return (
    <div className="border-b border-border bg-background">
      <nav
        aria-label="Dashboard"
        className="mx-auto flex w-full max-w-[1180px] overflow-x-auto px-5 sm:px-8"
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href)
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-12 shrink-0 items-center gap-2 border-b-2 px-4 text-sm font-medium no-underline transition-colors duration-[140ms] first:pl-0 first:ml-0",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              {label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
