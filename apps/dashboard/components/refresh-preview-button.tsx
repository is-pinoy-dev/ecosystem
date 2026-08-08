"use client"

import { useActionState } from "react"
import { RefreshCw } from "lucide-react"

import { Button } from "@is-pinoy-dev/ui/components/button"
import {
  refreshPortfolioPreview,
  type RefreshPreviewState,
} from "@/app/(dashboard)/domains/refresh-preview-action"

const INITIAL_STATE: RefreshPreviewState = { ok: false, message: "" }

export function RefreshPreviewButton({ portfolioId }: { portfolioId: string }) {
  const [state, action, pending] = useActionState(
    refreshPortfolioPreview,
    INITIAL_STATE
  )

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="portfolioId" value={portfolioId} />
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        <RefreshCw
          className={`size-3.5 ${pending ? "animate-spin" : ""}`}
          aria-hidden="true"
        />
        {pending ? "Requesting…" : "Refresh preview"}
      </Button>
      {state.message && (
        <span
          className={`text-xs ${state.ok ? "text-muted-foreground" : "text-destructive"}`}
          aria-live="polite"
        >
          {state.message}
        </span>
      )}
    </form>
  )
}
