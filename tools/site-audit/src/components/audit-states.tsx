import { AlertCircle } from "lucide-react"
import { Button } from "@is-pinoy-dev/ui/components/button"

/** Shared loading and error presentation for the audit routes. */
export function ScanningState() {
  return (
    <p className="m-0 text-base text-muted-foreground" role="status">
      Scanning…
    </p>
  )
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <div className="flex flex-col items-start gap-4 border border-border bg-card p-6">
      <p className="m-0 flex items-center gap-2.5 text-sm text-destructive">
        <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
        {message}
      </p>
      <Button variant="outline" onClick={onRetry}>
        Retry
      </Button>
    </div>
  )
}
