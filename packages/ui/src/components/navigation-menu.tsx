"use client"

import * as React from "react"
import { NavigationMenu as NavigationMenuPrimitive } from "radix-ui"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "@is-pinoy-dev/ui/lib/utils"

/**
 * Banig Grid v2 navigation menu. Panels are square-cornered, 1px-bordered
 * surfaces with no shadow — grouping comes from the rule and the white
 * surface, not elevation.
 *
 * `viewport={false}` (the default here) anchors each panel directly under its
 * own trigger instead of routing every panel through one shared, resizing box.
 * Mega panels have very different widths, and the shared viewport animates its
 * own size between them, which reads as arcade-style movement.
 */
function NavigationMenu({
  className,
  children,
  viewport = false,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Root> & {
  viewport?: boolean
}) {
  return (
    <NavigationMenuPrimitive.Root
      data-slot="navigation-menu"
      data-viewport={viewport}
      className={cn(
        "group/navigation-menu relative flex max-w-max flex-1 items-center",
        className
      )}
      {...props}
    >
      {children}
      {viewport && <NavigationMenuViewport />}
    </NavigationMenuPrimitive.Root>
  )
}

function NavigationMenuList({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.List>) {
  return (
    <NavigationMenuPrimitive.List
      data-slot="navigation-menu-list"
      className={cn(
        "group flex flex-1 list-none items-center gap-1",
        className
      )}
      {...props}
    />
  )
}

function NavigationMenuItem({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Item>) {
  return (
    <NavigationMenuPrimitive.Item
      data-slot="navigation-menu-item"
      className={cn("relative", className)}
      {...props}
    />
  )
}

function NavigationMenuTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Trigger>) {
  return (
    <NavigationMenuPrimitive.Trigger
      data-slot="navigation-menu-trigger"
      className={cn(
        "group/trigger inline-flex h-9 items-center gap-1 border border-transparent bg-transparent px-2 text-[13px] font-medium text-foreground/85 transition-colors duration-[140ms] outline-none select-none hover:text-accent focus-visible:border-ring focus-visible:text-accent data-[state=open]:text-accent",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDownIcon
        className="relative top-px size-3.5 transition-transform duration-[160ms] group-data-[state=open]/trigger:rotate-180"
        aria-hidden="true"
      />
    </NavigationMenuPrimitive.Trigger>
  )
}

function NavigationMenuContent({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Content>) {
  return (
    <NavigationMenuPrimitive.Content
      data-slot="navigation-menu-content"
      className={cn(
        "data-[motion]:duration-[160ms] data-[motion=from-end]:animate-in data-[motion=from-end]:fade-in-0 data-[motion=from-start]:animate-in data-[motion=from-start]:fade-in-0 data-[motion=to-end]:animate-out data-[motion=to-end]:fade-out-0 data-[motion=to-start]:animate-out data-[motion=to-start]:fade-out-0",
        // Viewport mode: the panel fills the shared, animated viewport box.
        "group-data-[viewport=true]/navigation-menu:top-0 group-data-[viewport=true]/navigation-menu:left-0 group-data-[viewport=true]/navigation-menu:w-full",
        // Standalone mode: surface only. Positioning is entirely the consumer's
        // — these variant-prefixed classes out-specify plain utilities passed in
        // via className, so anything laid out here could not be overridden.
        // Radix also wraps the list in its own `position: relative` div, so an
        // `absolute` panel is measured against that, not against the header.
        "group-data-[viewport=false]/navigation-menu:z-50 group-data-[viewport=false]/navigation-menu:border group-data-[viewport=false]/navigation-menu:border-border group-data-[viewport=false]/navigation-menu:bg-popover group-data-[viewport=false]/navigation-menu:text-popover-foreground group-data-[viewport=false]/navigation-menu:duration-[160ms] group-data-[viewport=false]/navigation-menu:data-[state=closed]:animate-out group-data-[viewport=false]/navigation-menu:data-[state=closed]:fade-out-0 group-data-[viewport=false]/navigation-menu:data-[state=open]:animate-in group-data-[viewport=false]/navigation-menu:data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  )
}

function NavigationMenuViewport({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Viewport>) {
  return (
    <div className="absolute top-full left-0 isolate z-50 flex justify-center">
      <NavigationMenuPrimitive.Viewport
        data-slot="navigation-menu-viewport"
        className={cn(
          "relative h-[var(--radix-navigation-menu-viewport-height)] w-full origin-top overflow-hidden border border-border bg-popover text-popover-foreground transition-[width,height] duration-[180ms] ease-out data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 md:w-[var(--radix-navigation-menu-viewport-width)]",
          className
        )}
        {...props}
      />
    </div>
  )
}

function NavigationMenuLink({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Link>) {
  return (
    <NavigationMenuPrimitive.Link
      data-slot="navigation-menu-link"
      // Deliberately minimal: `asChild` merges this className with the child's
      // by concatenation, and Tailwind resolves conflicts by stylesheet order,
      // not attribute order — so any layout utility here could silently beat
      // the consumer's. Layout stays the consumer's job.
      className={cn(
        "no-underline outline-none focus-visible:ring-1 focus-visible:ring-ring",
        className
      )}
      {...props}
    />
  )
}

function NavigationMenuIndicator({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Indicator>) {
  return (
    <NavigationMenuPrimitive.Indicator
      data-slot="navigation-menu-indicator"
      className={cn(
        "top-full z-50 flex h-px items-end justify-center overflow-hidden data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:animate-in data-[state=visible]:fade-in",
        className
      )}
      {...props}
    >
      <div className="relative h-px w-full bg-primary" />
    </NavigationMenuPrimitive.Indicator>
  )
}

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
}
