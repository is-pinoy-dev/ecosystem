"use client"

import { useCallback, useRef, useState } from "react"
import { ArrowRight, ArrowUpRight, Menu, X } from "lucide-react"
import { Button } from "@is-pinoy-dev/ui/components/button"
import { AnimatedThemeToggler } from "@is-pinoy-dev/ui/components/animated-theme-toggler"
import { Container } from "@is-pinoy-dev/ui/components/container"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@is-pinoy-dev/ui/components/navigation-menu"
import { BrandLink } from "@/components/brand-link"
import { GitHubStars } from "@/components/github-stars"
import { MobileNav } from "@/components/mobile-nav"
import { ProgressLink } from "@/components/progress-link"
import { FLAGS_OFF, type FlagSet } from "@/lib/flags"
import {
  NAV_LINKS,
  visibleNavSections,
  type NavItem,
  type NavSection,
} from "@/lib/navigation"

function MegaMenuItem({ item }: { item: NavItem }) {
  const Icon = item.icon
  const className =
    "group/item flex flex-row items-start gap-3 border border-transparent p-3 no-underline transition-colors duration-[140ms] hover:border-border hover:bg-secondary focus-visible:border-ring"
  const content = (
    <>
      <span
        className="mt-px flex size-8 shrink-0 items-center justify-center border border-border bg-background text-accent transition-colors duration-[140ms] group-hover/item:border-accent/50"
        aria-hidden="true"
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="text-[13px] font-semibold text-foreground transition-colors duration-[140ms] group-hover/item:text-accent">
            {item.label}
          </span>
          {item.tag ? (
            <span className="font-mono text-[10px] tracking-[0.06em] text-muted-foreground">
              {item.tag}
            </span>
          ) : null}
          {item.external ? (
            <ArrowUpRight
              className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity duration-[140ms] group-hover/item:opacity-100"
              aria-hidden="true"
            />
          ) : null}
        </span>
        <span className="mt-1 block text-xs leading-[1.55] text-muted-foreground">
          {item.description}
        </span>
      </span>
    </>
  )

  return (
    <NavigationMenuLink asChild>
      {item.external ? (
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
        >
          {content}
        </a>
      ) : (
        <ProgressLink href={item.href} className={className}>
          {content}
        </ProgressLink>
      )}
    </NavigationMenuLink>
  )
}

function DesktopNav({ sections }: { sections: NavSection[] }) {
  return (
    // Panels are fixed to the header's bottom edge and span the full width
    // rather than hanging off their own trigger — a 700px popover anchored to a
    // mid-header trigger runs off the right edge at 1024px. `top-16` matches
    // the header's `lg:h-16`, and the header is sticky at top 0, so the two
    // stay flush at any scroll position. A Container keeps the panel's contents
    // on the same 1180px grid as the rest of the page.
    <NavigationMenu
      className="hidden lg:flex"
      delayDuration={80}
      skipDelayDuration={240}
    >
      <NavigationMenuList className="gap-1 xl:gap-2">
        {sections.map((section) => (
          <NavigationMenuItem key={section.id} value={section.id}>
            <NavigationMenuTrigger>{section.label}</NavigationMenuTrigger>
            <NavigationMenuContent className="fixed inset-x-0 top-16 border-x-0 border-t-0">
              <Container className="grid grid-cols-[minmax(0,1fr)_300px] items-stretch gap-0 py-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                <div className="pr-8">
                  <p className="m-0 mb-2 px-3 font-mono text-[10px] font-semibold tracking-[0.12em] text-accent uppercase">
                    {section.eyebrow}
                  </p>
                  <ul className="m-0 grid list-none grid-cols-2 gap-x-4 p-0">
                    {section.items.map((item) => (
                      <li key={item.href}>
                        <MegaMenuItem item={item} />
                      </li>
                    ))}
                  </ul>
                </div>

                {section.feature ? (
                  <div className="flex flex-col justify-between gap-4 border-l border-border pt-1 pl-8">
                    <div>
                      <p className="m-0 mb-2 font-mono text-[10px] font-semibold tracking-[0.12em] text-accent uppercase">
                        {section.feature.eyebrow}
                      </p>
                      <p className="m-0 text-sm leading-[1.4] font-semibold text-foreground">
                        {section.feature.title}
                      </p>
                      <p className="m-0 mt-2 text-xs leading-[1.6] text-muted-foreground">
                        {section.feature.description}
                      </p>
                    </div>
                    <NavigationMenuLink asChild>
                      {section.feature.external ? (
                        <a
                          href={section.feature.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex flex-row items-center gap-1.5 self-start text-xs font-semibold text-accent no-underline hover:underline"
                        >
                          {section.feature.cta}
                          <ArrowRight className="size-3.5" aria-hidden="true" />
                        </a>
                      ) : (
                        <ProgressLink
                          href={section.feature.href}
                          className="inline-flex flex-row items-center gap-1.5 self-start text-xs font-semibold text-accent no-underline hover:underline"
                        >
                          {section.feature.cta}
                          <ArrowRight className="size-3.5" aria-hidden="true" />
                        </ProgressLink>
                      )}
                    </NavigationMenuLink>
                  </div>
                ) : null}
              </Container>
            </NavigationMenuContent>
          </NavigationMenuItem>
        ))}

        {NAV_LINKS.map((link) => (
          <NavigationMenuItem key={link.href}>
            <NavigationMenuLink asChild>
              <ProgressLink
                href={link.href}
                className="inline-flex h-9 flex-row items-center px-2 text-[13px] font-medium text-foreground/85 no-underline transition-colors duration-[140ms] hover:text-accent focus-visible:text-accent"
              >
                {link.label}
              </ProgressLink>
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  )
}

/**
 * `flags` arrives already resolved from the page: this component never sees the
 * environment or the rules behind a decision, only the booleans. Pages that do
 * not resolve flags leave every flagged entry hidden, which is the same answer
 * an unreachable Flags service gives.
 */
export function MainNav({ flags = FLAGS_OFF }: { flags?: FlagSet }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeMenu = useCallback(() => setOpen(false), [])
  const sections = visibleNavSections(flags)

  return (
    <nav className="sticky top-0 z-50 h-[60px] border-b border-border bg-background/98 lg:h-16">
      <Container className="flex h-full items-center justify-between gap-6">
        <BrandLink />

        <DesktopNav sections={sections} />

        <div className="flex items-center gap-1 lg:gap-2">
          <AnimatedThemeToggler />

          <GitHubStars className="hidden lg:inline-flex" />

          <Button
            asChild
            className="hidden h-10 min-w-[132px] shrink-0 gap-2 px-4 text-[13px] lg:inline-flex"
          >
            <ProgressLink href="/#claim">
              Claim a domain
              <ArrowRight className="size-[15px]" aria-hidden="true" />
            </ProgressLink>
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

      <MobileNav
        open={open}
        onClose={closeMenu}
        returnFocusRef={triggerRef}
        sections={sections}
      />
    </nav>
  )
}
