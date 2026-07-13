import { ArrowUpRight } from "lucide-react"
import { Button } from "@is-pinoy-dev/ui/components/button"
import { Container } from "@is-pinoy-dev/ui/components/container"
import {
  SectionDescription,
  SectionEyebrow,
  SectionHeader,
  SectionTitle,
} from "@is-pinoy-dev/ui/components/section-header"
import { DiscordIcon, GitHubIcon } from "@/components/icons"

export function CTASection() {
  return (
    <section className="py-16 sm:py-20" aria-labelledby="community-title">
      <Container className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
        <SectionHeader>
          <SectionEyebrow>Open source. Built together.</SectionEyebrow>
          <SectionTitle id="community-title">
            Built by us, for all of us.
          </SectionTitle>
        </SectionHeader>

        <div className="border-l border-border pl-6 sm:pl-10">
          <SectionDescription>
            is-pinoy.dev is maintained by Filipino developers.
            Contributions—large or small—make the service stronger for everyone.
          </SectionDescription>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild>
              <a
                href="https://github.com/is-pinoy-dev"
                target="_blank"
                rel="noopener noreferrer"
              >
                <GitHubIcon size={16} />
                Contribute on GitHub
                <ArrowUpRight aria-hidden="true" />
              </a>
            </Button>
            <Button asChild variant="outline-shadow">
              <a
                href={
                  process.env.NEXT_PUBLIC_DISCORD_LINK ??
                  "https://discord.gg/MVrgEfFExh"
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                <DiscordIcon size={16} />
                Join Discord
              </a>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  )
}
