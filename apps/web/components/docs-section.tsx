import Link from "next/link"

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
      <div className="border-[3px] border-[#2A2A2A] shadow-[5px_5px_0_#000] bg-[#0D0D0D] p-7 flex flex-col gap-4 h-full min-h-[160px] relative transition-all duration-100 cursor-pointer group-hover:border-[#F5C800] group-hover:shadow-[6px_6px_0_#D4A800] group-hover:-translate-x-px group-hover:-translate-y-px">
        {/* Icon */}
        <span className="font-[family-name:var(--font-mono)] text-[18px] text-[#F5C800] leading-none">
          {card.icon}
        </span>

        {/* Title */}
        <span className="font-[family-name:var(--font-pixel)] text-[0.6rem] text-[#FAFAF5] leading-[1.6] tracking-[0.03em]">
          {card.title}
        </span>

        {/* Description */}
        <span className="font-[family-name:var(--font-sans)] text-[14px] text-[#888888] leading-[1.7]">
          {card.description}
        </span>

        {/* Arrow */}
        <span className="absolute bottom-5 right-5 font-[family-name:var(--font-mono)] text-[16px] text-[#F5C800]">
          →
        </span>
      </div>
    </Link>
  )
}

export function DocsSection() {
  return (
    <section className="w-full max-w-[960px] mx-auto px-10 pb-20">
      {/* Heading */}
      <h2
        className="font-[family-name:var(--font-pixel)] text-[#F5C800] tracking-[0.1em] mb-10 leading-[1.6]"
        style={{ fontSize: "clamp(0.5rem, 1.5vw, 0.75rem)" }}
      >
        {"// DOCUMENTATION"}
      </h2>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-4 max-sm:grid-cols-1">
        {DOCS.map((doc) => (
          <DocCard key={doc.href} card={doc} />
        ))}
      </div>
    </section>
  )
}
