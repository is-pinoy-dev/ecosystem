import type { Metadata } from "next"
import { ArrowRight } from "lucide-react"
import { Container } from "@is-pinoy-dev/ui/components/container"
import {
  SectionDescription,
  SectionEyebrow,
  SectionHeader,
  SectionTitle,
} from "@is-pinoy-dev/ui/components/section-header"
import { MainNav } from "@/components/main-nav"
import { SiteFooter } from "@/components/site-footer"
import { BadgeKit } from "@/components/badge-kit"

export const metadata: Metadata = {
  title: "Badge kit",
  description:
    "Official is-pinoy.dev badges for your README, GitHub profile, or website. Clean, minimal SVG badges in light, dark, and gold — copy the snippet and go.",
  openGraph: {
    title: "Badge kit — is-pinoy.dev",
    description:
      "Official is-pinoy.dev badges for your README, GitHub profile, or website.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "is-pinoy.dev badge kit",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Badge kit — is-pinoy.dev",
    description:
      "Official is-pinoy.dev badges for your README, GitHub profile, or website.",
    images: ["/opengraph-image"],
  },
}

const STEPS = [
  {
    n: "01",
    title: "Pick a badge and theme",
    body: "Choose the message that fits and a theme that suits your README background — light, dark, or gold.",
  },
  {
    n: "02",
    title: "Copy the snippet",
    body: "Grab it as Markdown, HTML, or a raw URL. Each badge is a single self-contained SVG served from badges.is-pinoy.dev.",
  },
  {
    n: "03",
    title: "Paste it in",
    body: "Drop it into your README, GitHub profile, or site. It stays crisp at any zoom and caches on GitHub's image proxy.",
  },
]

export default function BadgesPage() {
  return (
    <>
      <MainNav />

      <main className="min-h-screen">
        <section className="py-16 sm:py-20">
          <Container className="max-w-[900px]">
            <SectionHeader className="mb-12">
              <SectionEyebrow>Badge kit</SectionEyebrow>
              <SectionTitle>Wear it in your README</SectionTitle>
              <SectionDescription>
                Official is-pinoy.dev badges for the developers who build here.
                Minimal, square, and unmistakably on-brand — copy a snippet and
                you&apos;re done.
              </SectionDescription>
            </SectionHeader>

            <ol className="mb-14 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-3">
              {STEPS.map((step) => (
                <li key={step.n} className="flex flex-col gap-2 bg-card p-5">
                  <span className="font-mono text-[11px] font-semibold tracking-[0.12em] text-accent">
                    {step.n}
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {step.title}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {step.body}
                  </span>
                </li>
              ))}
            </ol>

            <BadgeKit />

            <div className="mt-14 flex flex-col gap-4 border-t border-border pt-6">
              <div className="flex flex-col gap-3 border border-border bg-muted/40 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Full badge kit reference
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Every type, theme, format, banner, and query parameter —
                    plus the interactive web component.
                  </p>
                </div>
                <a
                  href="https://docs.is-pinoy.dev/docs/badge-kit"
                  className="inline-flex shrink-0 items-center gap-1.5 font-mono text-sm font-medium text-accent underline-offset-4 hover:underline"
                >
                  Read the docs
                  <ArrowRight className="size-4" aria-hidden="true" />
                </a>
              </div>
              <p className="text-sm text-muted-foreground">
                Building an actual web page instead of a README? Load the
                interactive{" "}
                <code className="font-mono text-[13px] text-foreground">
                  &lt;is-pinoy-badge&gt;
                </code>{" "}
                web component from{" "}
                <code className="font-mono text-[13px] text-foreground">
                  badges.is-pinoy.dev/badge.js
                </code>{" "}
                for a live link and{" "}
                <a
                  href="https://docs.is-pinoy.dev/docs/badge-kit#interactive-html-badge"
                  className="text-accent underline-offset-4 hover:underline"
                >
                  optional sun motion
                </a>
                .
              </p>
              <p className="text-sm text-muted-foreground">
                Please use the official badges as-is and keep them linked back
                to{" "}
                <a
                  href="https://is-pinoy.dev"
                  className="text-accent underline-offset-4 hover:underline"
                >
                  is-pinoy.dev
                </a>
                . Want a badge for something we don&apos;t list?{" "}
                <a
                  href="https://github.com/is-pinoy-dev/ecosystem/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline-offset-4 hover:underline"
                >
                  Open an issue
                </a>
                .
              </p>
            </div>
          </Container>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
