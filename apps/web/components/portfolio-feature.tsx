import Link from "next/link"
import { FileCode2, Palette, Rocket } from "lucide-react"
import { Button } from "@is-pinoy-dev/ui/components/button"
import { Container } from "@is-pinoy-dev/ui/components/container"
import { GitHubIcon } from "@/components/icons"
import {
  PortfolioPreview,
  type PortfolioDesign,
} from "@/components/portfolio-preview"

const DASHBOARD_CLAIM_URL = "https://dashboard.is-pinoy.dev/claim"

/**
 * A sample of the templates `apps/portfolio` ships, not the full list — the
 * caption under the grid carries the real count so this stays a preview rather
 * than a second registry to keep in sync. `theme` is set only for layout
 * templates, which are the ones a palette re-colours.
 */
const DESIGNS: PortfolioDesign[] = [
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
    theme: "gold-dark",
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
        <div className="grid gap-4 lg:grid-cols-[0.44fr_0.56fr] lg:gap-16">
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

          <p className="m-0 max-w-[520px] text-base leading-[1.7] text-muted-foreground lg:pt-1">
            No portfolio yet? You already have one. Point your subdomain at our
            renderer and{" "}
            <span className="font-mono text-foreground">name.is-pinoy.dev</span>{" "}
            becomes a modern, customizable site built from your GitHub profile —
            README, avatar, links, and projects included.
          </p>
        </div>

        <PortfolioPreview designs={DESIGNS} />

        <div className="mt-8 grid border-b border-border md:grid-cols-3">
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

        <div className="mt-6 flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-center">
          <Button asChild variant="outline" className="h-[42px] gap-2">
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
            className="h-[42px] border-accent text-accent hover:border-accent hover:bg-secondary"
          >
            <Link href="/showcase">See live portfolios</Link>
          </Button>
        </div>
      </Container>
    </section>
  )
}
