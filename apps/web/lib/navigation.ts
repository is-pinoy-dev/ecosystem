import type { LucideIcon } from "lucide-react"
import {
  BadgeCheck,
  BookOpen,
  Compass,
  Gauge,
  Globe,
  Image as ImageIcon,
  LayoutDashboard,
  LayoutTemplate,
  LifeBuoy,
  Search,
  Server,
  Sparkles,
  Store,
  Terminal,
} from "lucide-react"

const DOCS_URL = "https://docs.is-pinoy.dev"

export interface NavItem {
  label: string
  description: string
  href: string
  icon: LucideIcon
  external?: boolean
  /** Short mono tag rendered next to the label. Metadata only, never decoration. */
  tag?: string
}

export interface NavSection {
  /** Stable id — used for the Radix value and the mobile accordion item. */
  id: string
  /** Trigger label in the desktop bar and the mobile accordion. */
  label: string
  /** Mono eyebrow above the panel's item list. */
  eyebrow: string
  items: NavItem[]
  /** Optional highlighted entry rendered as the panel's side rail. */
  feature?: {
    eyebrow: string
    title: string
    description: string
    href: string
    external?: boolean
    cta: string
  }
}

export interface NavLink {
  label: string
  href: string
  external?: boolean
}

/**
 * Mega-menu sections. `apps/web` is the only consumer today, but the shape is
 * deliberately data-only so the desktop panels and the mobile accordion render
 * from one source instead of drifting apart.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    id: "platform",
    label: "Platform",
    eyebrow: "Claim and manage",
    items: [
      {
        label: "Dashboard",
        description:
          "Manage your subdomains, DNS records, and claims in one place.",
        href: "https://dashboard.is-pinoy.dev",
        icon: LayoutDashboard,
        external: true,
      },
      {
        label: "Claim a subdomain",
        description: "Check availability and reserve your name.is-pinoy.dev.",
        href: "/#claim",
        icon: Globe,
      },
      {
        label: "GitHub Portfolio",
        description:
          "Turn your GitHub profile into a hosted site with a design you pick.",
        href: "/#portfolio",
        icon: LayoutTemplate,
      },
      {
        label: "Theme Marketplace",
        description: "Browse, install, and publish community portfolio themes.",
        href: "/#marketplace",
        icon: Store,
        tag: "Soon",
      },
      {
        label: "Showcase",
        description:
          "Browse sites built by Filipino developers on the network.",
        href: "/showcase",
        icon: Sparkles,
      },
      {
        label: "Badge Kit",
        description: "Embed an is-pinoy.dev badge in your README or portfolio.",
        href: `${DOCS_URL}/badge-kit`,
        icon: BadgeCheck,
        external: true,
      },
    ],
    feature: {
      eyebrow: "Start here",
      title: "Your name, your subdomain",
      description:
        "Registration is a pull request. Free forever, reviewed by the community.",
      href: "/#claim",
      cta: "Check availability",
    },
  },
  {
    id: "tools",
    label: "Tools",
    eyebrow: "Built into every subdomain",
    items: [
      {
        label: "Site Audit",
        description:
          "Check your site's SEO and Open Graph metadata from your own subdomain.",
        href: "https://is-pinoy.dev/_tools/site-audit",
        icon: Search,
        external: true,
        tag: "/_tools",
      },
      {
        label: "OG Images",
        description:
          "Generate a branded Open Graph card for any is-pinoy.dev subdomain.",
        href: "https://is-pinoy.dev/_tools/og",
        icon: ImageIcon,
        external: true,
        tag: "/_tools",
      },
      {
        label: "Status",
        description: "Live uptime, DNS, and SSL checks across the network.",
        href: "https://status.is-pinoy.dev",
        icon: Gauge,
        external: true,
      },
      {
        label: "CLI",
        description:
          "Validate and diff your records locally before you open a pull request.",
        href: `${DOCS_URL}/guides/workflow/validate`,
        icon: Terminal,
        external: true,
      },
    ],
    feature: {
      eyebrow: "Opt-in",
      title: "Tools are off by default",
      description:
        "Enable them per subdomain with a features block in your JSON file.",
      href: `${DOCS_URL}/tools`,
      external: true,
      cta: "Read the tools guide",
    },
  },
  {
    id: "resources",
    label: "Resources",
    eyebrow: "Learn and get help",
    items: [
      {
        label: "Documentation",
        description: "Everything about claiming, configuring, and shipping.",
        href: DOCS_URL,
        icon: BookOpen,
        external: true,
      },
      {
        label: "Getting started",
        description: "What you need before registering your first subdomain.",
        href: `${DOCS_URL}/guides/getting-started`,
        icon: Compass,
        external: true,
      },
      {
        label: "Provider guides",
        description:
          "DNS values for Vercel, Cloudflare Pages, GitHub Pages, and more.",
        href: `${DOCS_URL}/guides/providers`,
        icon: Server,
        external: true,
      },
      {
        label: "Troubleshooting",
        description:
          "Fixes for CI failures, DNS propagation, and common errors.",
        href: `${DOCS_URL}/guides/troubleshooting`,
        icon: LifeBuoy,
        external: true,
      },
    ],
    feature: {
      eyebrow: "Community",
      title: "Stuck on something?",
      description:
        "Ask in Discord or open an issue — the registry is reviewed by people, not bots.",
      href: "https://discord.gg/MVrgEfFExh",
      external: true,
      cta: "Join the Discord",
    },
  },
]

/** Plain links that sit beside the mega-menu triggers. */
export const NAV_LINKS: NavLink[] = [
  { label: "How it works", href: "/#how-it-works" },
]

export const COMMUNITY_LINKS: NavLink[] = [
  { label: "GitHub", href: "https://github.com/is-pinoy-dev", external: true },
  { label: "Discord", href: "https://discord.gg/MVrgEfFExh", external: true },
]
