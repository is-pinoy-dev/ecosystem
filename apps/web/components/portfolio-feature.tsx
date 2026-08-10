import Image from "next/image"
import Link from "next/link"
import { ArrowRight, FileCode2, Palette, Rocket } from "lucide-react"
import { Badge } from "@is-pinoy-dev/ui/components/badge"
import { Button } from "@is-pinoy-dev/ui/components/button"
import { Card, CardContent } from "@is-pinoy-dev/ui/components/card"
import { Container } from "@is-pinoy-dev/ui/components/container"
import { GitHubIcon } from "@/components/icons"

const DASHBOARD_CLAIM_URL = "https://dashboard.is-pinoy.dev/claim"

/**
 * A sample of the templates `apps/portfolio` ships, not the full list — the
 * caption below the grid carries the real count so this stays a preview rather
 * than a second registry to keep in sync.
 */
const DESIGNS = [
  {
    slug: "bento",
    name: "Bento",
    description: "Soft, modern modular profile",
    mode: "Light",
  },
  {
    slug: "noir",
    name: "Noir",
    description: "Cinematic monochrome portfolio",
    mode: "Dark",
  },
  {
    slug: "solar",
    name: "Solar",
    description: "Vivid retro-future poster",
    mode: "Color",
  },
  {
    slug: "broadsheet",
    name: "Broadsheet",
    description: "Warm editorial journal",
    mode: "Light",
  },
  {
    slug: "phosphor",
    name: "Phosphor",
    description: "CRT glow and shell commands",
    mode: "Dark",
  },
  {
    slug: "terminal",
    name: "Terminal",
    description: "Classic command-line profile",
    mode: "6 palettes",
  },
]

const HIGHLIGHTS = [
  {
    icon: FileCode2,
    title: "Your README, rendered",
    description:
      "We read your GitHub profile README, avatar, and public repositories at request time. Push to GitHub and the site follows.",
  },
  {
    icon: Palette,
    title: "Twelve designs, one switch",
    description:
      "Three themeable layouts with six color palettes, plus nine art-directed designer themes. Change it whenever you like.",
  },
  {
    icon: Rocket,
    title: "Nothing to deploy",
    description:
      "No repository, no build step, no hosting bill. Sign in with GitHub, pick a design, and we open the pull request for you.",
  },
]

export function PortfolioFeature() {
  return (
    <section
      id="portfolio"
      className="scroll-mt-16 border-b border-border py-7 sm:py-10 lg:py-14"
      aria-labelledby="portfolio-title"
    >
      <Container>
        <div className="grid gap-6 lg:grid-cols-[0.44fr_0.56fr] lg:gap-16">
          <div className="min-w-0">
            <p className="m-0 flex items-center gap-2 font-mono text-xs font-semibold tracking-[0.12em] text-accent uppercase">
              <span className="size-1.5 bg-primary" aria-hidden="true" />
              New — hosted portfolios
            </p>
            <h2
              id="portfolio-title"
              className="m-0 mt-4 max-w-[460px] text-[28px] leading-[1.12] font-semibold tracking-[-0.03em] text-foreground sm:text-[34px]"
            >
              Turn your GitHub profile into a{" "}
              <span className="text-accent">real website</span>
              <span className="text-primary">.</span>
            </h2>
          </div>

          <div className="min-w-0 lg:pt-1">
            <p className="m-0 max-w-[520px] text-base leading-[1.7] text-muted-foreground">
              No portfolio yet? You already have one. Point your subdomain at
              our renderer and{" "}
              <span className="font-mono text-foreground">
                name.is-pinoy.dev
              </span>{" "}
              becomes a modern, customizable site built from your GitHub profile
              — README, avatar, links, and projects included.
            </p>

            <div className="mt-6 flex flex-col gap-3 min-[420px]:flex-row">
              <Button asChild size="lg" className="h-12 gap-2 px-5">
                <a
                  href={DASHBOARD_CLAIM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <GitHubIcon size={16} />
                  Create your portfolio
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 border-accent/35 text-accent hover:border-accent hover:bg-secondary"
              >
                <Link href="/showcase">See live portfolios</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DESIGNS.map((design, index) => (
            <Card
              key={design.slug}
              // Six full-width previews is a long scroll on a phone; the last
              // three appear once the grid can place two per row.
              className={`overflow-hidden bg-card py-0 transition-colors duration-150 hover:border-accent/50 ${
                index < 3 ? "" : "hidden sm:block"
              }`}
            >
              <div className="relative aspect-[640/400] overflow-hidden border-b border-border bg-muted">
                <Image
                  src={`/themes/${design.slug}.webp`}
                  alt={`The ${design.name} portfolio design`}
                  width={640}
                  height={400}
                  loading={index < 3 ? "eager" : "lazy"}
                  sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
                  className="h-full w-full object-cover object-top"
                />
              </div>
              <CardContent className="flex items-start justify-between gap-3 px-4 py-3">
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">
                    {design.name}
                  </span>
                  <span className="mt-1 block text-[13px] leading-[1.5] text-muted-foreground">
                    {design.description}
                  </span>
                </span>
                <Badge variant="outline" className="shrink-0">
                  {design.mode}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="m-0 mt-4 font-mono text-xs text-muted-foreground">
          Twelve designs available today. Preview any of them against your own
          GitHub profile before you claim.
        </p>

        <div className="mt-8 grid border-y border-border md:grid-cols-3">
          {HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="border-b border-border py-6 last:border-b-0 md:border-r md:border-b-0 md:px-8 md:first:pl-0 md:last:border-r-0 md:last:pr-0"
            >
              <Icon className="size-5 text-accent" aria-hidden="true" />
              <h3 className="m-0 mt-3 text-sm font-semibold text-foreground">
                {title}
              </h3>
              <p className="m-0 mt-2 text-[13px] leading-[1.6] text-muted-foreground">
                {description}
              </p>
            </div>
          ))}
        </div>

        <a
          href={DASHBOARD_CLAIM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent no-underline transition-colors duration-[140ms] hover:underline"
        >
          Pick a design
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </a>
      </Container>
    </section>
  )
}
