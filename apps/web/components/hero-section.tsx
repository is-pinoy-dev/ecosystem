import Link from "next/link"
import { ArrowRight, Code2, Users } from "lucide-react"
import { Button } from "@is-pinoy-dev/ui/components/button"
import { Container } from "@is-pinoy-dev/ui/components/container"
import { PhilippinesNetwork } from "@/components/philippines-network"
import { getRegisteredSubdomainProfiles } from "@/lib/subdomains"

const NETWORK_PROFILE_LIMIT = 16

export async function HeroSection() {
  const registered = await getRegisteredSubdomainProfiles(NETWORK_PROFILE_LIMIT)
  const profiles = registered.slice(0, NETWORK_PROFILE_LIMIT).map((entry) => ({
    id: entry.subdomain,
    subdomain: `${entry.subdomain}.is-pinoy.dev`,
    github: entry.github,
    avatarUrl: `https://avatars.githubusercontent.com/${encodeURIComponent(entry.github)}?size=96`,
    profileUrl: `https://${entry.subdomain}.is-pinoy.dev`,
  }))

  return (
    <section
      className="hero-section relative overflow-hidden border-b border-border"
      aria-labelledby="hero-title"
    >
      <Container className="relative grid items-center gap-3 py-12 md:grid-cols-[minmax(0,1fr)_minmax(360px,0.88fr)] md:gap-5 md:py-14 lg:min-h-[650px] lg:gap-12 lg:py-16">
        <div className="hero-copy relative z-10 max-w-[620px]">
          <p className="m-0 mb-6 flex items-center gap-3 font-mono text-[11px] font-semibold tracking-[0.12em] text-accent uppercase sm:text-xs">
            <span className="size-1.5 bg-primary" aria-hidden="true" />A
            community by Filipino developers
          </p>
          <h1
            id="hero-title"
            className="m-0 text-[42px] leading-[1.04] font-semibold tracking-[-0.045em] text-foreground sm:text-[52px] lg:text-[64px]"
          >
            The home of <span className="text-accent">Filipino</span> developers
            <span className="text-primary">.</span>
          </h1>
          <p className="mt-6 mb-0 max-w-[540px] text-base leading-[1.7] text-muted-foreground sm:text-lg">
            Claim your own{" "}
            <span className="font-mono text-foreground">name.is-pinoy.dev</span>{" "}
            and be part of the growing Filipino developer network.
          </p>

          <div className="mt-8 flex flex-col gap-3 min-[420px]:flex-row">
            <Button asChild size="lg" className="h-12 min-w-[190px] gap-2 px-5">
              <Link href="#claim">
                Claim your subdomain
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 min-w-[174px] border-accent/35 text-accent hover:border-accent hover:bg-secondary"
            >
              <Link href="/showcase">Explore community</Link>
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-border pt-5 text-xs font-medium text-foreground">
            <span className="flex items-center gap-2">
              <Users className="size-4 text-accent" aria-hidden="true" />
              Built by and for Filipino developers
            </span>
            <span
              className="hidden h-4 w-px bg-border sm:block"
              aria-hidden="true"
            />
            <a
              className="flex items-center gap-2 text-accent no-underline hover:underline"
              href="https://github.com/is-pinoy-dev"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Code2 className="size-4" aria-hidden="true" />
              Open source
            </a>
          </div>
        </div>

        <div className="hero-network relative min-h-[430px] md:min-h-0">
          <PhilippinesNetwork profiles={profiles} />
        </div>
      </Container>
    </section>
  )
}
