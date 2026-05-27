type Guideline = { guideline: string; impact: string }

export const GUIDELINES: Record<string, Guideline> = {
  // SEO — existing
  "Title": {
    guideline: "Should be 10–60 characters and describe the page clearly.",
    impact: "The title is the primary clickable link in search results — it directly drives click-through rate.",
  },
  "Meta Description": {
    guideline: "Should be 50–160 characters and summarise the page content.",
    impact: "Displayed as the snippet under the title in search results; affects click-through rate.",
  },
  "Canonical URL": {
    guideline: "Set a canonical link to prevent duplicate-content penalties across URL variants.",
    impact: "Tells search engines which URL is the authoritative version of the page.",
  },
  "Robots": {
    guideline: "Use 'index, follow' to allow indexing, or 'noindex' to block it explicitly.",
    impact: "Controls whether search engines crawl and index this page.",
  },
  "H1 Tag": {
    guideline: "Every page should have exactly one H1 that matches the page topic.",
    impact: "The H1 is a strong relevance signal — search engines use it to understand page content.",
  },
  "HTML lang": {
    guideline: "Set the lang attribute on <html> (e.g. lang=\"en\") to declare the page language.",
    impact: "Helps search engines serve the correct language version to users and aids screen readers.",
  },
  "Viewport": {
    guideline: "Include <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">.",
    impact: "Required for mobile-friendly rendering; Google penalises pages that fail mobile usability.",
  },
  "Charset": {
    guideline: "Declare charset (typically UTF-8) early in <head>.",
    impact: "Prevents character encoding errors that can corrupt visible text and metadata.",
  },
  "Structured Data": {
    guideline: "Add JSON-LD structured data using schema.org types relevant to your content.",
    impact: "Enables rich results (FAQ dropdowns, star ratings, breadcrumbs) in Google Search.",
  },
  "Favicon": {
    guideline: "Provide a favicon via <link rel=\"icon\">.",
    impact: "Improves brand recognition in browser tabs, bookmarks, and search result favicons.",
  },
  "Author": {
    guideline: "Add <meta name=\"author\" content=\"...\"> to attribute the content creator.",
    impact: "Contributes to E-E-A-T (Experience, Expertise, Authoritativeness, Trust) signals.",
  },
  "Image Alt Texts": {
    guideline: "Every meaningful image should have a descriptive alt attribute.",
    impact: "Required for accessibility (WCAG) and helps search engines index image content.",
  },
  // SEO — new
  "theme-color": {
    guideline: "Add <meta name=\"theme-color\" content=\"#hexcolor\"> to brand the browser chrome.",
    impact: "Colours the browser address bar on mobile Chrome; improves PWA and brand perception.",
  },
  "apple-touch-icon": {
    guideline: "Provide <link rel=\"apple-touch-icon\" href=\"/icon.png\"> at 180×180px.",
    impact: "Used when a user adds the site to their iOS home screen; missing it shows a screenshot instead.",
  },
  "manifest": {
    guideline: "Link a Web App Manifest via <link rel=\"manifest\" href=\"/manifest.json\">.",
    impact: "Required for PWA install prompts and proper display in Google's mobile search features.",
  },
  "hreflang": {
    guideline: "Add <link rel=\"alternate\" hreflang=\"x\"> for each language/region variant of the page.",
    impact: "Prevents duplicate-content issues between language variants and serves the correct locale to users.",
  },
  "preload hints": {
    guideline: "Use <link rel=\"preload\"> to hint the browser to fetch critical assets early.",
    impact: "Reduces render-blocking and improves LCP (Largest Contentful Paint), a Core Web Vital.",
  },
  "JSON-LD type": {
    guideline: "Use a recognised schema.org @type: Article, FAQPage, Product, WebSite, Organization, LocalBusiness, or BreadcrumbList.",
    impact: "A recognised type unlocks specific rich result formats (FAQ accordions, product prices, breadcrumbs) in Google.",
  },
  "JSON-LD valid": {
    guideline: "The JSON-LD script must be valid JSON — no trailing commas, unquoted keys, or syntax errors.",
    impact: "Invalid JSON-LD is silently ignored by Google; none of the structured data benefits apply.",
  },
  // OG
  "og:title": {
    guideline: "Should match or closely relate to the page <title>; ideally 40–95 characters.",
    impact: "The headline shown when the URL is shared on Facebook, LinkedIn, and other platforms.",
  },
  "og:description": {
    guideline: "A compelling 2–4 sentence summary; aim for 155–200 characters.",
    impact: "Displayed below the title in social shares; affects click-through rate from social channels.",
  },
  "og:image": {
    guideline: "Provide a 1200×630px image for best quality across all platforms.",
    impact: "The preview image shown in social cards — high-impact visual that drives engagement.",
  },
  "og:url": {
    guideline: "Set to the canonical URL of the page.",
    impact: "Ensures share counts aggregate on the canonical URL rather than splitting across variants.",
  },
  "og:type": {
    guideline: "Set to 'website' for most pages; use 'article' for blog posts.",
    impact: "Tells social platforms how to classify and display the content.",
  },
  "og:locale": {
    guideline: "Set to the locale of the page content (e.g. en_US, en_PH).",
    impact: "Helps social platforms serve the correct language version of the share card.",
  },
  "og:site_name": {
    guideline: "Set to your brand or site name.",
    impact: "Displayed as attribution in the share card on Facebook and LinkedIn.",
  },
  // Twitter
  "twitter:card": {
    guideline: "Use 'summary_large_image' for a big image card, or 'summary' for a small thumbnail.",
    impact: "Determines the visual layout of the card when the URL is shared on X/Twitter.",
  },
  "twitter:title": {
    guideline: "Should be under 70 characters for best display on Twitter/X.",
    impact: "The headline shown in the Twitter card; truncated beyond 70 characters.",
  },
  "twitter:description": {
    guideline: "Keep under 200 characters.",
    impact: "Shown below the title in the Twitter card; longer values are truncated.",
  },
  "twitter:image": {
    guideline: "Use a 1200×628px image with a 2:1 aspect ratio for large cards.",
    impact: "The preview image in the Twitter card — major driver of engagement on the platform.",
  },
  "twitter:site": {
    guideline: "Set to your Twitter/X @handle (e.g. @yoursite).",
    impact: "Displayed as attribution in the card and allows Twitter analytics to attribute traffic.",
  },
}
