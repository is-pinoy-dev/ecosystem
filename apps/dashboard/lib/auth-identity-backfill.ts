import "server-only"

/**
 * Fills in `login`/`githubId` on a session token that predates one or both
 * fields, using the GitHub access token already stored on that same token.
 *
 * `profile` is only handed to Auth.js's `jwt` callback on the initial
 * sign-in exchange, so a JWT minted before a field was added to the token
 * shape keeps re-decoding without it for the rest of its life — the cookie
 * itself is still valid, but any account-scoped action gating on the
 * missing field (e.g. `githubId`) sees it as absent and reports the user as
 * not signed in, which is misleading since they never signed out. This is a
 * one-time, self-healing fetch: once it succeeds, the token carries both
 * fields on every later request and this never runs again for that session.
 */
export async function backfillIdentity<T extends Record<string, unknown>>(
  token: T
): Promise<T> {
  const needsBackfill =
    typeof token.login !== "string" || typeof token.githubId !== "number"
  if (!needsBackfill || typeof token.accessToken !== "string") {
    return token
  }

  try {
    const res = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    })
    if (!res.ok) return token

    const user = (await res.json()) as { login?: string; id?: number }
    const mutable: Record<string, unknown> = token
    if (typeof user.login === "string") {
      mutable.login = user.login
    }
    if (typeof user.id === "number" && Number.isInteger(user.id)) {
      mutable.githubId = user.id
    }
  } catch {
    // Best-effort backfill; leave the token as-is and retry next request.
  }

  return token
}
