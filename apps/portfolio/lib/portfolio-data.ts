// The normalized model every template consumes. Templates never touch a raw
// GitHub payload or raw README HTML — only this shape — so swapping the data
// source or adding a template touches exactly one layer.

export interface ProfileLink {
  label: string
  href: string
}

export interface Profile {
  login: string
  name: string | null
  avatar: string
  bio: string | null
  location: string | null
  links: ProfileLink[]
}

export interface Repo {
  name: string
  description: string | null
  url: string
  language: string | null
  stars: number
}

export interface PortfolioData {
  profile: Profile
  /** Sanitized profile-README HTML, safe to inject. Empty string if none. */
  readmeHtml: string
  repos: Repo[]
  stats: {
    followers: number
    publicRepos: number
  }
}
