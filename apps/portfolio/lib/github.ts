import type { PortfolioData, Repo } from "./portfolio-data"
import { renderReadme } from "./parse"

// One-hour ISR window — matches the house pattern in apps/web/lib/subdomains.ts.
// Freshness is pure revalidation; no webhook.
const REVALIDATE_SECONDS = 3600

function githubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  }
  // Optional token raises the 60 req/hr unauthenticated limit. Works without.
  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

async function ghJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url, {
    headers: githubHeaders(),
    next: { revalidate: REVALIDATE_SECONDS },
  })
  if (!res.ok) return null
  return (await res.json()) as T
}

interface GhUser {
  login: string
  name: string | null
  avatar_url: string
  bio: string | null
  location: string | null
  blog: string | null
  twitter_username: string | null
  followers: number
  public_repos: number
}

interface GhRepo {
  name: string
  description: string | null
  html_url: string
  language: string | null
  stargazers_count: number
  fork: boolean
}

/** The profile README lives in the `<user>/<user>` repo. */
async function fetchProfileReadme(login: string): Promise<string> {
  const res = await fetch(
    `https://api.github.com/repos/${login}/${login}/readme`,
    {
      headers: { ...githubHeaders(), Accept: "application/vnd.github.raw" },
      next: { revalidate: REVALIDATE_SECONDS },
    },
  )
  if (!res.ok) return ""
  return res.text()
}

/**
 * Build the normalized PortfolioData for a GitHub login. Returns null if the
 * user doesn't exist (or GitHub is unreachable and returns no user).
 */
export async function getPortfolioData(
  login: string,
): Promise<PortfolioData | null> {
  const [user, reposRaw, readmeMd] = await Promise.all([
    ghJson<GhUser>(`https://api.github.com/users/${login}`),
    ghJson<GhRepo[]>(
      `https://api.github.com/users/${login}/repos?sort=updated&per_page=100`,
    ),
    fetchProfileReadme(login),
  ])

  if (!user) return null

  const links: PortfolioData["profile"]["links"] = []
  if (user.blog) {
    const href = user.blog.startsWith("http") ? user.blog : `https://${user.blog}`
    links.push({ label: "Website", href })
  }
  if (user.twitter_username) {
    links.push({
      label: "Twitter",
      href: `https://twitter.com/${user.twitter_username}`,
    })
  }
  links.push({ label: "GitHub", href: `https://github.com/${user.login}` })

  const repos: Repo[] = (reposRaw ?? [])
    .filter((r) => !r.fork)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 6)
    .map((r) => ({
      name: r.name,
      description: r.description,
      url: r.html_url,
      language: r.language,
      stars: r.stargazers_count,
    }))

  return {
    profile: {
      login: user.login,
      name: user.name,
      avatar: user.avatar_url,
      bio: user.bio,
      location: user.location,
      links,
    },
    readmeHtml: await renderReadme(readmeMd),
    repos,
    stats: {
      followers: user.followers,
      publicRepos: user.public_repos,
    },
  }
}
