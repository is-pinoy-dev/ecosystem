import "server-only"
import { cookies } from "next/headers"
import { decode } from "next-auth/jwt"

// The GitHub OAuth access token is stored in the encrypted Auth.js session JWT
// (see auth.ts) and never exposed to the client via the session object. This
// server-only helper decodes the session cookie to recover it for server
// actions that call the GitHub API on the user's behalf.
//
// Auth.js derives the JWT encryption key from AUTH_SECRET + a salt equal to the
// cookie name, so we must try both the secure and non-secure cookie names.
const COOKIE_NAMES = [
  "__Secure-authjs.session-token",
  "authjs.session-token",
] as const

export async function getGitHubAccessToken(): Promise<string | null> {
  const secret = process.env.AUTH_SECRET
  if (!secret) return null

  const store = await cookies()

  for (const name of COOKIE_NAMES) {
    const raw = store.get(name)?.value
    if (!raw) continue
    try {
      const decoded = await decode({ token: raw, secret, salt: name })
      const accessToken = decoded?.accessToken
      if (typeof accessToken === "string" && accessToken.length > 0) {
        return accessToken
      }
    } catch {
      // Wrong salt for this cookie name — try the next candidate.
    }
  }

  return null
}
