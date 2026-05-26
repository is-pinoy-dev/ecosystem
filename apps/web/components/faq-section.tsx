"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@is-pinoy-dev/ui/components/accordion"

const FAQS = [
  {
    q: "Is it really free?",
    a: "Yes — completely free, forever. is-pinoy.dev is an open-source community project. There are no paid tiers, no hidden fees, and no expiry.",
  },
  {
    q: "What subdomain names are allowed?",
    a: "Lowercase letters (a–z), digits (0–9), and hyphens only. No leading or trailing hyphens. Length must be between 1 and 63 characters.",
  },
  {
    q: "Which hosting providers are supported?",
    a: "Any provider that lets you set a CNAME or A record works. Vercel has a dedicated step-by-step guide; more provider guides are coming.",
  },
  {
    q: "How long does DNS take after my PR is merged?",
    a: "Usually a few minutes, but it can take up to 48 hours to propagate worldwide. Check with: dig your-name.is-pinoy.dev",
  },
  {
    q: "How do I update or remove my subdomain?",
    a: "Open another pull request to the domains repository — edit your JSON file to update records, or delete the file entirely to remove your subdomain.",
  },
]

export function FAQSection() {
  return (
    <section className="w-full max-w-[960px] mx-auto px-10 pt-20 pb-20">
      <div className="h-[2px] bg-primary mb-16 shadow-[0_2px_0_var(--color-primary-dark)]" />
      <h2
        className="font-pixel text-primary tracking-[0.1em] mb-10 leading-[1.6]"
        style={{ fontSize: "clamp(0.5rem, 1.5vw, 0.75rem)" }}
      >
        {"// FAQ"}
      </h2>
      <Accordion type="multiple" className="border-t-2 border-card">
        {FAQS.map((item, i) => (
          <AccordionItem
            key={i}
            value={`faq-${i}`}
            className="border-b-2 border-card"
          >
            <AccordionTrigger className="font-pixel text-[0.6rem] leading-[1.8] tracking-[0.03em] text-foreground py-5 hover:text-primary hover:no-underline">
              {item.q}
            </AccordionTrigger>
            <AccordionContent className="font-sans text-[14px] leading-[1.7] text-muted-foreground pb-5">
              {item.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}
