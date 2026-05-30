import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@is-pinoy-dev/ui/components/popover";

const STATUSES = [
  {
    dot: "bg-green-500 animate-pulse",
    label: "OPERATIONAL",
    labelClass: "text-green-400",
    desc: "DNS is live and your site is reachable.",
  },
  {
    dot: "bg-primary",
    label: "PROPAGATING",
    labelClass: "text-primary",
    desc: "DNS record added but not yet visible globally. Usually resolves within minutes to 48 hours.",
    blink: true,
  },
  {
    dot: "bg-red-500",
    label: "DEGRADED",
    labelClass: "text-red-400",
    desc: "DNS is live but the site behind it isn't responding.",
  },
];

export function StatusInfoPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label="Status explanation"
          className="inline-flex items-center justify-center w-5 h-5 border border-border text-muted-foreground font-pixel text-[8px] hover:border-primary hover:text-primary transition-colors cursor-pointer"
        >
          ?
        </button>
      </PopoverTrigger>

      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={8}
        className="w-72 border-2 border-border bg-background shadow-[4px_4px_0px_#000] p-4 rounded-none ring-0"
      >
        <p className="font-pixel text-[8px] text-muted-foreground mb-4 uppercase">
          Status Explained
        </p>

        <ul className="space-y-4">
          {STATUSES.map(({ dot, label, labelClass, desc, blink }) => (
            <li key={label} className="flex gap-3">
              <span
                className={`mt-0.5 inline-block w-2 h-2 flex-shrink-0 ${dot}`}
                style={
                  blink
                    ? { animation: "pixel-blink 1s step-end infinite" }
                    : undefined
                }
              />
              <div>
                <span className={`font-pixel text-[8px] ${labelClass}`}>
                  {label}
                </span>
                <p className="font-mono text-xs text-muted-foreground mt-1 leading-relaxed">
                  {desc}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-4 pt-4 border-t border-border">
          <a
            href="https://docs.is-pinoy.dev/guides/workflow/after-merge"
            target="_blank"
            rel="noopener noreferrer"
            className="font-pixel text-[7px] text-primary hover:underline"
          >
            LEARN MORE →
          </a>
        </div>
      </PopoverContent>
    </Popover>
  );
}
