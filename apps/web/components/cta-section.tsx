import { Button } from "@is-pinoy-dev/ui/components/button"
import { Container } from "@is-pinoy-dev/ui/components/container"
import { ContributionGrid } from "@/components/contribution-grid"
import { DiscordIcon, GitHubIcon } from "@/components/icons"

export function CommunitySection() {
  return (
    <section
      className="border-b border-border py-7 sm:py-10 lg:py-14"
      aria-labelledby="community-title"
    >
      <Container className="grid min-w-0 gap-10 lg:grid-cols-[0.36fr_0.64fr] lg:gap-16">
        <div className="min-w-0">
          <h2
            id="community-title"
            className="m-0 font-mono text-xs font-semibold tracking-[0.12em] text-accent uppercase"
          >
            Open source. Built together.
          </h2>
          <p className="m-0 mt-[18px] max-w-[320px] text-sm leading-[1.7] text-foreground">
            is-pinoy.dev is a volunteer-run project by Filipino developers.
            Contributions—big or small—make this possible.
          </p>

          <div className="mt-5 flex flex-col gap-2">
            <Button
              asChild
              className="h-[42px] w-full gap-2 sm:w-[200px]"
            >
              <a
                href="https://github.com/is-pinoy-dev"
                target="_blank"
                rel="noopener noreferrer"
              >
                <GitHubIcon size={16} />
                Contribute on GitHub
              </a>
            </Button>
            <Button
              asChild
              variant="outline-shadow"
              className="h-[42px] w-full gap-2 border-accent text-accent sm:w-[200px]"
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
                Join our Discord
              </a>
            </Button>
          </div>
        </div>

        <div className="min-w-0 lg:-mt-1">
          <ContributionGrid />
        </div>
      </Container>
    </section>
  )
}
