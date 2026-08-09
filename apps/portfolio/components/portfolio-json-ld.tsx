/**
 * Schema.org structured data for a portfolio.
 *
 * The graph is built in lib/seo.ts from the same normalized PortfolioData the
 * templates render, so a design change can never desynchronize what the page
 * says from what it tells a crawler.
 */
export function PortfolioJsonLd({ graph }: { graph: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // The payload is our own object graph, but the strings in it are the
      // owner's GitHub bio and repo descriptions — arbitrary text. Only `<` can
      // end a <script> early, and escaping it is still valid JSON.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(graph).replace(/</g, "\\u003c"),
      }}
    />
  )
}
