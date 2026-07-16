import * as React from "react"

import { cn } from "@is-pinoy-dev/ui/lib/utils"

function Container({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="container"
      className={cn(
        "mx-auto w-full max-w-[1180px] px-5 sm:px-8 lg:px-10",
        className
      )}
      {...props}
    />
  )
}

export { Container }
