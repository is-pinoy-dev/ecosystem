import { HelpCircle } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@is-pinoy-dev/ui/components/popover"
import { StatusIndicator } from "@is-pinoy-dev/ui/components/status-indicator"

const STATUSES = [
  {
    tone: "success",
    label: "Operational",
    labelClass: "text-success",
    desc: "DNS is live and your site is reachable.",
  },
  {
    tone: "warning",
    label: "Propagating",
    labelClass: "text-warning",
    desc: "DNS record added but not yet visible globally. Usually resolves within minutes to 48 hours.",
  },
  {
    tone: "destructive",
    label: "Degraded",
    labelClass: "text-destructive",
    desc: "DNS is live but the site behind it isn't responding.",
  },
] as const

export function StatusInfoPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label="What do these statuses mean?"
          className="inline-flex size-8 items-center justify-center text-muted-foreground transition-colors duration-[140ms] hover:text-accent focus-visible:text-accent"
        >
          <HelpCircle className="size-4" aria-hidden="true" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={8}
        className="w-80 border border-border bg-popover p-5"
      >
        <p className="m-0 font-mono text-xs font-semibold tracking-[0.12em] text-accent uppercase">
          Status explained
        </p>

        <ul className="mt-4 flex list-none flex-col gap-4 p-0">
          {STATUSES.map(({ tone, label, labelClass, desc }) => (
            <li key={label} className="flex gap-3">
              <StatusIndicator tone={tone} className="mt-1.5" />
              <div>
                <span
                  className={`font-mono text-[13px] font-medium ${labelClass}`}
                >
                  {label}
                </span>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {desc}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-5 border-t border-border pt-4">
          <a
            href="https://docs.is-pinoy.dev/guides/workflow/after-merge"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-accent underline-offset-4 hover:underline"
          >
            Learn more
          </a>
        </div>
      </PopoverContent>
    </Popover>
  )
}
