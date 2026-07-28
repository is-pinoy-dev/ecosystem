"use client"

import { useEffect, useId, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowRight, ArrowUpRight } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@is-pinoy-dev/ui/components/accordion"
import { Button } from "@is-pinoy-dev/ui/components/button"
import { DiscordIcon, GitHubIcon } from "@/components/icons"
import {
  COMMUNITY_LINKS,
  NAV_LINKS,
  NAV_SECTIONS,
  type NavItem,
} from "@/lib/navigation"

function MobileNavItem({
  item,
  onNavigate,
}: {
  item: NavItem
  onNavigate: () => void
}) {
  const Icon = item.icon
  const className =
    "flex min-h-14 items-start gap-3 py-3 no-underline transition-colors duration-[140ms] active:bg-secondary"
  const content = (
    <>
      <span
        className="mt-px flex size-8 shrink-0 items-center justify-center border border-border bg-background text-accent"
        aria-hidden="true"
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-foreground">
            {item.label}
          </span>
          {item.tag ? (
            <span className="font-mono text-[10px] tracking-[0.06em] text-muted-foreground">
              {item.tag}
            </span>
          ) : null}
          {item.external ? (
            <ArrowUpRight
              className="size-3.5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
          ) : null}
        </span>
        <span className="mt-0.5 block text-[13px] leading-[1.5] text-muted-foreground">
          {item.description}
        </span>
      </span>
    </>
  )

  return item.external ? (
    <a
      href={item.href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onNavigate}
      className={className}
    >
      {content}
    </a>
  ) : (
    <Link href={item.href} onClick={onNavigate} className={className}>
      {content}
    </Link>
  )
}

export function MobileNav({
  open,
  onClose,
  returnFocusRef,
}: {
  open: boolean
  onClose: () => void
  /** Focused when Escape closes the panel, so keyboard users land back on the toggle. */
  returnFocusRef?: React.RefObject<HTMLButtonElement | null>
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [openSections, setOpenSections] = useState<string[]>(() =>
    NAV_SECTIONS[0] ? [NAV_SECTIONS[0].id] : []
  )
  const titleId = useId()
  const pathname = usePathname()
  const lastPathname = useRef(pathname)

  // Close on route change so following a link doesn't leave the panel mounted
  // over the new page.
  useEffect(() => {
    if (lastPathname.current === pathname) return
    lastPathname.current = pathname
    onClose()
  }, [pathname, onClose])

  // The panel scrolls; the page behind it must not.
  useEffect(() => {
    if (!open) return
    const { body } = document
    const previousOverflow = body.style.overflow
    body.style.overflow = "hidden"
    return () => {
      body.style.overflow = previousOverflow
    }
  }, [open])

  // Move focus into the panel when it opens so the next Tab stays inside it.
  useEffect(() => {
    if (!open) return
    panelRef.current?.focus()
  }, [open])

  // Escape closes, and Tab stays inside the panel while it is modal.
  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose()
        returnFocusRef?.current?.focus()
        return
      }
      if (event.key !== "Tab" || !panelRef.current) return

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first || !last) return

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, onClose, returnFocusRef])

  if (!open) return null

  return (
    <div
      ref={panelRef}
      id="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      className="fixed inset-x-0 top-[60px] bottom-0 z-50 flex flex-col border-t border-border bg-background outline-none lg:hidden"
    >
      <h2 id={titleId} className="sr-only">
        Site menu
      </h2>

      <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-6">
        <Accordion
          type="multiple"
          value={openSections}
          onValueChange={setOpenSections}
        >
          {NAV_SECTIONS.map((section) => (
            <AccordionItem
              key={section.id}
              value={section.id}
              className="border-b"
            >
              <AccordionTrigger className="min-h-14 items-center py-4 text-sm font-semibold text-foreground hover:no-underline">
                {section.label}
              </AccordionTrigger>
              <AccordionContent className="pb-2 [&_a]:no-underline">
                <p className="m-0 mb-1 font-mono text-[10px] font-semibold tracking-[0.12em] text-accent uppercase">
                  {section.eyebrow}
                </p>
                <div className="flex flex-col divide-y divide-border">
                  {section.items.map((item) => (
                    <MobileNavItem
                      key={item.href}
                      item={item}
                      onNavigate={onClose}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="flex flex-col divide-y divide-border border-b border-border">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="flex min-h-14 items-center py-4 text-sm font-semibold text-foreground no-underline transition-colors duration-[140ms] active:text-accent"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <p className="m-0 mt-6 mb-2 font-mono text-[10px] font-semibold tracking-[0.12em] text-accent uppercase">
          Community
        </p>
        <div className="flex flex-col divide-y divide-border border-y border-border">
          {COMMUNITY_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="flex min-h-12 items-center gap-2.5 text-sm font-medium text-foreground no-underline transition-colors duration-[140ms] active:text-accent"
            >
              {link.label === "Discord" ? (
                <DiscordIcon size={16} />
              ) : (
                <GitHubIcon size={16} />
              )}
              {link.label}
              <ArrowUpRight
                className="ml-auto size-3.5 text-muted-foreground"
                aria-hidden="true"
              />
            </a>
          ))}
        </div>
      </div>

      <div className="border-t border-border bg-card px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Button asChild size="lg" className="h-12 w-full gap-2">
          <Link href="/#claim" onClick={onClose}>
            Claim a domain
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
