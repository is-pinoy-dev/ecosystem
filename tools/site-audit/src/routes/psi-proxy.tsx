import type { Route } from "./+types/psi-proxy";
import type {
  AuditStatus,
  CoreWebVital,
  PsiCategoryScore,
  PsiOpportunity,
  PsiResult,
  PsiStrategy,
} from "@is-pinoy-dev/schemas";

/** Categories requested from PSI — mirrors the tabs Lighthouse itself groups audits into. */
const CATEGORIES = ["performance", "accessibility", "best-practices", "seo"] as const;

const VITAL_AUDITS: { id: string; title: string }[] = [
  { id: "largest-contentful-paint", title: "Largest Contentful Paint" },
  { id: "cumulative-layout-shift", title: "Cumulative Layout Shift" },
  { id: "total-blocking-time", title: "Total Blocking Time" },
  { id: "first-contentful-paint", title: "First Contentful Paint" },
  { id: "speed-index", title: "Speed Index" },
  { id: "interactive", title: "Time to Interactive" },
];

interface PsiEnv {
  /** Optional — see worker/wrangler.toml. Without it, requests use Google's low, unauthenticated quota. */
  PAGESPEED_API_KEY?: string;
}

interface LighthouseAudit {
  title: string;
  description?: string;
  score: number | null;
  displayValue?: string;
}

interface PsiApiResponse {
  lighthouseResult?: {
    categories?: Record<string, { title: string; score: number | null }>;
    audits?: Record<string, LighthouseAudit>;
  };
  error?: { message?: string };
}

/** Matches Lighthouse's own 0.9 / 0.5 thresholds for green / orange / red. */
function scoreToStatus(score: number | null): AuditStatus {
  if (score === null) return "warn";
  if (score >= 0.9) return "pass";
  if (score >= 0.5) return "warn";
  return "fail";
}

/** Lighthouse audit descriptions carry markdown links; render as plain text. */
function stripMarkdownLinks(text: string): string {
  return text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const target = url.searchParams.get("url");
  const strategy: PsiStrategy = url.searchParams.get("strategy") === "desktop" ? "desktop" : "mobile";

  if (!target) {
    return new Response("Missing url parameter", { status: 400 });
  }

  let parsedTarget: URL;
  try {
    parsedTarget = new URL(target);
  } catch {
    return new Response("Invalid url parameter", { status: 400 });
  }

  if (!["http:", "https:"].includes(parsedTarget.protocol)) {
    return new Response("Only http and https URLs are allowed", { status: 400 });
  }

  const env = (context as { cloudflare?: { env?: PsiEnv } })?.cloudflare?.env ?? {};

  const psiUrl = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  psiUrl.searchParams.set("url", parsedTarget.toString());
  psiUrl.searchParams.set("strategy", strategy);
  for (const category of CATEGORIES) psiUrl.searchParams.append("category", category);
  if (env.PAGESPEED_API_KEY) psiUrl.searchParams.set("key", env.PAGESPEED_API_KEY);

  let response: Response;
  try {
    // A real Lighthouse run backs this call — Google's own docs put it at up
    // to ~30s, occasionally more on a slow target.
    response = await fetch(psiUrl.toString(), { signal: AbortSignal.timeout(45000) });
  } catch {
    return new Response(
      "PageSpeed Insights did not respond in time — try again, or check that the URL is publicly reachable.",
      { status: 502 },
    );
  }

  const body = (await response.json().catch(() => null)) as PsiApiResponse | null;

  if (!response.ok || !body) {
    const message = body?.error?.message ?? `PageSpeed Insights returned ${response.status}`;
    return new Response(message, { status: response.status === 429 ? 429 : 502 });
  }

  const lighthouse = body.lighthouseResult;
  if (!lighthouse) {
    return new Response(
      "PageSpeed Insights returned no Lighthouse result — the page may not be publicly reachable from Google's crawler.",
      { status: 502 },
    );
  }

  const categories: PsiCategoryScore[] = CATEGORIES.map((id) => {
    const category = lighthouse.categories?.[id];
    return {
      id,
      title: category?.title ?? id,
      score: category?.score != null ? Math.round(category.score * 100) : null,
    };
  });

  const vitals: CoreWebVital[] = VITAL_AUDITS.map(({ id, title }) => {
    const audit = lighthouse.audits?.[id];
    const score = audit?.score ?? null;
    return {
      id,
      title,
      displayValue: audit?.displayValue ?? null,
      score,
      status: scoreToStatus(score),
    };
  });

  const vitalIds = new Set(VITAL_AUDITS.map((v) => v.id));
  const opportunities: PsiOpportunity[] = Object.entries(lighthouse.audits ?? {})
    .filter(([id, audit]) => !vitalIds.has(id) && audit.score !== null && audit.score < 0.9 && audit.displayValue)
    .map(([id, audit]) => ({
      id,
      title: audit.title,
      description: audit.description ? stripMarkdownLinks(audit.description) : "",
      displayValue: audit.displayValue ?? null,
      score: audit.score,
    }))
    .sort((a, b) => (a.score ?? 1) - (b.score ?? 1))
    .slice(0, 10);

  const result: PsiResult = {
    url: parsedTarget.toString(),
    strategy,
    fetchedAt: new Date().toISOString(),
    categories,
    vitals,
    opportunities,
  };

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  });
}
