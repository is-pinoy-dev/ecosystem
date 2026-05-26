import Link from "next/link"
import { Card, CardContent } from "@is-pinoy-dev/ui/components/card"

interface DocCard {
  icon: string
  title: string
  description: string
  href: string
}

const DOCS: DocCard[] = [
  {
    icon: "▶",
    title: "Getting Started",
    description: "Set up your subdomain in minutes.",
    href: "https://docs.is-pinoy.dev",
  },
  {
    icon: "$_",
    title: "CLI Reference",
    description: "Validate, diff, and sync via terminal.",
    href: "https://docs.is-pinoy.dev/cli",
  },
  {
    icon: "{ }",
    title: "Registry Schema",
    description: "Understand the JSON record format.",
    href: "https://docs.is-pinoy.dev/registry",
  },
]

function DocCard({ card }: { card: DocCard }) {
  return (
    <Link
      href={card.href}
      target="_blank"
      rel="noopener noreferrer"
      className="no-underline group"
    >
      <Card className="border-[3px] border-card shadow-[5px_5px_0_#000] bg-background p-7 flex flex-col gap-4 h-full min-h-[160px] relative transition-all duration-100 cursor-pointer group-hover:border-primary group-hover:shadow-[6px_6px_0_var(--color-primary-dark)] group-hover:-translate-x-px group-hover:-translate-y-px">
        <CardContent className="flex flex-col gap-4 p-0">
          <span className="font-mono text-[18px] text-primary leading-none">
            {card.icon}
          </span>
          <span className="font-pixel text-[0.6rem] text-foreground leading-[1.6] tracking-[0.03em]">
            {card.title}
          </span>
          <span className="font-sans text-[14px] text-muted-foreground leading-[1.7]">
            {card.description}
          </span>
          <span className="absolute bottom-5 right-5 font-mono text-[16px] text-primary">
            →
          </span>
        </CardContent>
      </Card>
    </Link>
  )
}

export function DocsSection() {
  return (
    <section className="w-full max-w-[960px] mx-auto px-10 pb-20">
      <h2
        className="font-pixel text-primary tracking-[0.1em] mb-10 leading-[1.6]"
        style={{ fontSize: "clamp(0.5rem, 1.5vw, 0.75rem)" }}
      >
        {"// DOCUMENTATION"}
      </h2>
      <div className="grid grid-cols-3 gap-4 max-sm:grid-cols-1">
        {DOCS.map((doc) => (
          <DocCard key={doc.href} card={doc} />
        ))}
      </div>
    </section>
  )
}
