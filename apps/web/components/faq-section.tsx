"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@is-pinoy-dev/ui/components/accordion"
import { Container } from "@is-pinoy-dev/ui/components/container"
import {
  SectionEyebrow,
  SectionHeader,
  SectionTitle,
} from "@is-pinoy-dev/ui/components/section-header"

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
    <section className="py-16 sm:py-20">
      <Container>
        <SectionHeader className="mb-10">
          <SectionEyebrow>FAQ</SectionEyebrow>
          <SectionTitle>Questions, answered</SectionTitle>
        </SectionHeader>
        <Accordion type="multiple" className="border-t border-border">
          {FAQS.map((item, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="border-b border-border"
            >
              <AccordionTrigger className="py-5 text-base font-semibold text-foreground hover:text-accent hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-sm leading-6 text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Container>
    </section>
  )
}
