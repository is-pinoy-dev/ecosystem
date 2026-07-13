import * as React from "react"

import { cn } from "@is-pinoy-dev/ui/lib/utils"

const toneClasses = {
  neutral: "bg-muted-foreground",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  brand: "bg-primary",
} as const

function StatusIndicator({
  className,
  tone = "neutral",
  ...props
}: React.ComponentProps<"span"> & { tone?: keyof typeof toneClasses }) {
  return (
    <span
      data-slot="status-indicator"
      aria-hidden="true"
      className={cn(
        "inline-block size-2 shrink-0",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  )
}

export { StatusIndicator }
