import * as React from "react"

import { cn } from "@is-pinoy-dev/ui/lib/utils"

function SectionHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="section-header"
      className={cn("flex flex-col gap-3", className)}
      {...props}
    />
  )
}

function SectionEyebrow({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="section-eyebrow"
      className={cn(
        "m-0 font-mono text-xs font-semibold tracking-[0.12em] text-accent uppercase",
        className
      )}
      {...props}
    />
  )
}

function SectionTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="section-title"
      className={cn(
        "m-0 max-w-[720px] text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl",
        className
      )}
      {...props}
    />
  )
}

function SectionDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="section-description"
      className={cn(
        "m-0 max-w-[640px] text-base leading-7 text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export { SectionHeader, SectionEyebrow, SectionTitle, SectionDescription }
