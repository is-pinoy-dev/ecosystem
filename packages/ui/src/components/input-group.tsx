import * as React from "react"

import { cn } from "@is-pinoy-dev/ui/lib/utils"

function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      className={cn(
        "flex min-h-12 w-full items-stretch border border-input bg-background transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20",
        className
      )}
      {...props}
    />
  )
}

function InputGroupAddon({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group-addon"
      className={cn(
        "flex shrink-0 items-center border-l border-border px-3 font-mono text-sm text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export { InputGroup, InputGroupAddon }
