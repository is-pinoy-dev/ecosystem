import { ArrowRight, GitPullRequest, Globe2, Search } from "lucide-react"
import { Container } from "@is-pinoy-dev/ui/components/container"

const STEPS = [
  {
    number: "01",
    icon: Search,
    title: "Check your name",
    description:
      "Search for your preferred subdomain. If it’s free, you can claim it.",
  },
  {
    number: "02",
    icon: Globe2,
    title: "Connect DNS",
    description:
      "Point your subdomain to your site using any supported platform.",
  },
  {
    number: "03",
    icon: GitPullRequest,
    title: "Submit a pull request",
    description:
      "Add your subdomain via our GitHub repository. We’ll take it from there.",
  },
]

export function HowClaimingWorks() {
  return (
    <section
      id="how-it-works"
      className="border-b border-border py-7 sm:py-10 lg:py-14"
      aria-labelledby="how-it-works-title"
    >
      <Container>
        <h2
          id="how-it-works-title"
          className="m-0 mb-4 font-mono text-xs font-semibold tracking-[0.12em] text-accent uppercase"
        >
          How claiming works
        </h2>

        <div className="border-y border-border">
          {STEPS.map(({ number, icon: Icon, title, description }) => (
            <div
              key={number}
              className="grid grid-cols-[44px_1fr] items-start gap-x-4 gap-y-2 border-b border-border/60 py-[18px] last:border-b-0 md:grid-cols-[64px_64px_270px_1fr] md:items-center md:gap-x-0 md:gap-y-0 md:py-6"
            >
              <span className="self-start border-r border-border/60 pr-4 font-mono text-2xl font-semibold text-primary-dark md:self-auto md:pr-6">
                {number}
              </span>
              <div className="flex items-center gap-3 md:contents">
                <Icon
                  className="size-7 shrink-0 text-foreground md:pl-6"
                  aria-hidden="true"
                />
                <h3 className="m-0 text-[15px] font-semibold text-foreground md:pl-0 md:text-base">
                  {title}
                </h3>
              </div>
              <p className="col-span-2 m-0 mt-2 text-[13px] leading-[1.55] text-muted-foreground md:col-span-1 md:mt-0 md:border-l md:border-border/60 md:pl-6 md:text-sm">
                {description}
              </p>
            </div>
          ))}
        </div>

        <a
          href="https://docs.is-pinoy.dev/guides"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent no-underline transition-colors duration-[140ms] hover:underline"
        >
          Open the guide
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </a>
      </Container>
    </section>
  )
}
