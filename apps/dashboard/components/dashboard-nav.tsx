"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Globe, LayoutDashboard, UserRound } from "lucide-react"
import { cn } from "@is-pinoy-dev/ui/lib/utils"

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/domains", label: "Domains", icon: Globe },
  { href: "/account", label: "Account", icon: UserRound },
]

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href)
}

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Dashboard" className="flex flex-col gap-1 py-4">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-2.5 border-l-2 px-4 text-sm font-medium no-underline transition-colors duration-[140ms]",
              active
                ? "border-sidebar-primary bg-sidebar-accent text-sidebar-accent-foreground"
                : "border-transparent text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Dashboard"
      className="flex overflow-x-auto border-b border-border bg-sidebar lg:hidden"
    >
      {NAV_ITEMS.map(({ href, label }) => {
        const active = isActive(pathname, href)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 shrink-0 items-center border-b-2 px-4 text-[13px] font-medium no-underline transition-colors duration-[140ms]",
              active
                ? "border-sidebar-primary bg-sidebar-accent text-sidebar-accent-foreground"
                : "border-transparent text-sidebar-foreground/80 hover:text-sidebar-foreground"
            )}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
