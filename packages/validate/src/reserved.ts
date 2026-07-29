export const RESERVED_SUBDOMAINS = [
  // Infrastructure / DNS
  "www",
  "api",
  "cdn",
  "ns",
  "ns1",
  "ns2",
  "mx",
  "mail",
  "smtp",
  "pop",
  "imap",
  "webmail",
  "ftp",
  "ssh",
  "vpn",
  "ssl",

  // Auth / identity
  "auth",
  "login",
  "logout",
  "signin",
  "signup",
  "register",
  "account",
  "profile",
  "oauth",
  "sso",
  "id",

  // Admin / ops
  "admin",
  "console",
  "dashboard",
  "portal",
  "panel",
  "manage",
  "management",
  "controlpanel",
  "cp",
  "ops",

  // Environments
  "dev",
  "staging",
  "beta",
  "alpha",
  "test",
  "qa",
  "prod",
  "production",
  "preview",
  "demo",
  "sandbox",
  "local",
  "localhost",
  "canary",

  // Observability / platform tooling
  "status",
  "monitor",
  "metrics",
  "analytics",
  "logs",
  "grafana",
  "prometheus",
  "kibana",
  "uptime",

  // Content / assets
  "static",
  "assets",
  "media",
  "img",
  "images",
  "files",
  "uploads",
  "download",
  "downloads",

  // Community / content sites
  "blog",
  "docs",
  "forum",
  "community",
  "wiki",
  "help",
  "support",
  "faq",
  "kb",
  "news",
  "showcase",

  // Commerce / payments
  "shop",
  "store",
  "pay",
  "payment",
  "checkout",
  "billing",
  "invoice",

  // Brand protection
  "pinoy",
  "ispinoy",
  "ispinodev",
  "oss",
  "app",

  // Abuse / postmaster
  "abuse",
  "postmaster",
  "hostmaster",
  "webmaster",
  "security",
  "noreply",
  "no-reply",

  // Platform tooling namespace — /_tools/* paths are intercepted by Cloudflare Workers
  "_tools",

  // Platform hosts. These are hand-created Cloudflare records pointing at our
  // own deployments, not entries in this repo. Reserving them stops a claim
  // from generating an UPDATE against a record the platform depends on —
  // `portfolio` in particular is the CNAME target every hosted portfolio
  // points at, so a claim on it would take down every portfolio at once.
  "portfolio",
];
