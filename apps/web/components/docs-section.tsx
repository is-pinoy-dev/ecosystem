import { ArrowRight, GitPullRequest, Globe2, Search } from "lucide-react"
import { Button } from "@is-pinoy-dev/ui/components/button"
import { Container } from "@is-pinoy-dev/ui/components/container"
import {
  SectionDescription,
  SectionEyebrow,
  SectionHeader,
  SectionTitle,
} from "@is-pinoy-dev/ui/components/section-header"

const STEPS = [
  {
    number: "01",
    icon: Search,
    title: "Check your name",
    description:
      "Search for your preferred subdomain. If it is free, you can claim it.",
  },
  {
    number: "02",
    icon: Globe2,
    title: "Connect your site",
    description: "Point your subdomain to any supported hosting provider.",
  },
  {
    number: "03",
    icon: GitPullRequest,
    title: "Open a pull request",
    description:
      "Add your subdomain through the GitHub repository. Maintainers take it from there.",
  },
]

export function DocsSection() {
  return (
    <section
      id="how-it-works"
      className="py-16 sm:py-20"
      aria-labelledby="how-it-works-title"
    >
      <Container>
        <SectionHeader className="mb-10">
          <SectionEyebrow>How claiming works</SectionEyebrow>
          <SectionTitle id="how-it-works-title">
            From a name to a live site
          </SectionTitle>
          <SectionDescription>
            A transparent GitHub-native workflow with no dashboard and no hidden
            fees.
          </SectionDescription>
        </SectionHeader>

        <div className="border-y border-border">
          {STEPS.map(({ number, icon: Icon, title, description }) => (
            <div
              key={number}
              className="grid gap-4 border-b border-border py-6 last:border-b-0 sm:grid-cols-[64px_40px_220px_1fr] sm:items-center"
            >
              <span className="font-mono text-2xl font-semibold text-primary-dark">
                {number}
              </span>
              <Icon className="size-5 text-foreground" aria-hidden="true" />
              <h3 className="m-0 text-base font-semibold text-foreground">
                {title}
              </h3>
              <p className="m-0 max-w-[560px] text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            </div>
          ))}
        </div>

        <Button asChild variant="link" className="mt-6">
          <a
            href="https://docs.is-pinoy.dev/guides"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open the registration guide
            <ArrowRight aria-hidden="true" />
          </a>
        </Button>
      </Container>
    </section>
  )
}
