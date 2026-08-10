import { Compass, Store, Upload } from "lucide-react"
import { Badge } from "@is-pinoy-dev/ui/components/badge"
import { Button } from "@is-pinoy-dev/ui/components/button"
import { Container } from "@is-pinoy-dev/ui/components/container"
import { DiscordIcon, GitHubIcon } from "@/components/icons"

const PLANNED = [
  {
    icon: Compass,
    title: "Browse the catalog",
    description:
      "Every portfolio design in one place, with a live preview rendered against your own GitHub profile.",
  },
  {
    icon: Store,
    title: "Switch without a rebuild",
    description:
      "Install a theme from your dashboard. Your subdomain keeps its address and your content stays on GitHub.",
  },
  {
    icon: Upload,
    title: "Publish your own",
    description:
      "Submit a design you built and share it with the community — credited to you, reviewed like every other contribution.",
  },
]

export function ThemeMarketplace() {
  return (
    <section
      id="marketplace"
      className="scroll-mt-16 border-b border-border bg-card py-7 sm:py-10 lg:py-14"
      aria-labelledby="marketplace-title"
    >
      <Container>
        <div className="flex flex-wrap items-center gap-3">
          <p className="m-0 font-mono text-xs font-semibold tracking-[0.12em] text-accent uppercase">
            Theme marketplace
          </p>
          <Badge variant="outline">Coming soon</Badge>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[0.44fr_0.56fr] lg:gap-16">
          <h2
            id="marketplace-title"
            className="m-0 max-w-[460px] text-[28px] leading-[1.12] font-semibold tracking-[-0.03em] text-foreground sm:text-[34px]"
          >
            A place to find your next design
            <span className="text-primary">.</span>
          </h2>
          <p className="m-0 max-w-[520px] text-base leading-[1.7] text-muted-foreground lg:pt-1">
            We are building a marketplace where every portfolio theme — ours and
            the community&rsquo;s — can be browsed, previewed, and installed
            from your dashboard. It is not open yet; the twelve designs shipped
            today are already yours to use.
          </p>
        </div>

        <div className="mt-8 border-y border-border">
          {PLANNED.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="grid grid-cols-[28px_1fr] items-start gap-x-4 gap-y-2 border-b border-border/60 py-[18px] last:border-b-0 md:grid-cols-[28px_270px_1fr] md:items-center md:gap-y-0 md:py-6"
            >
              <Icon
                className="size-5 shrink-0 text-accent"
                aria-hidden="true"
              />
              <h3 className="m-0 text-[15px] font-semibold text-foreground md:text-base">
                {title}
              </h3>
              <p className="col-span-2 m-0 text-[13px] leading-[1.55] text-muted-foreground md:col-span-1 md:border-l md:border-border/60 md:pl-6 md:text-sm">
                {description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-center">
          <Button asChild variant="outline" className="h-[42px] gap-2">
            <a
              href="https://github.com/is-pinoy-dev/ecosystem"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GitHubIcon size={16} />
              Follow the progress
            </a>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-[42px] gap-2 border-accent text-accent hover:border-accent hover:bg-secondary"
          >
            <a
              href={
                process.env.NEXT_PUBLIC_DISCORD_LINK ??
                "https://discord.gg/MVrgEfFExh"
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              <DiscordIcon size={16} />
              Suggest a theme
            </a>
          </Button>
        </div>
      </Container>
    </section>
  )
}
