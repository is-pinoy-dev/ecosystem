import NextAuth, {
  type DefaultSession,
  type NextAuthResult,
} from "next-auth"
import GitHub from "next-auth/providers/github"
import { backfillIdentity } from "@/lib/auth-identity-backfill"

declare module "next-auth" {
  interface Session {
    user: {
      /** GitHub username of the signed-in developer. Renameable. */
      login: string
      /**
       * GitHub's numeric account ID — stable across username changes, which
       * `login` is not. Ownership matching prefers this so that renaming a
       * GitHub account doesn't detach its owner from their own records.
       */
      githubId?: number
    } & DefaultSession["user"]
  }
}

const nextAuth = NextAuth({
  providers: [
    GitHub({
      // `public_repo` lets the dashboard open a portfolio-claim PR against the
      // public domains repo on the user's behalf (fork + branch + PR). The
      // access token is persisted in the encrypted JWT only — never in the
      // session — and read server-side via lib/github-token.ts.
      authorization: {
        params: { scope: "read:user user:email public_repo" },
      },
    }),
  ],
  // Auth.js auto-trusts the host in dev and on Vercel, but throws
  // UntrustedHost under `next start` on any other host. The dashboard always
  // runs behind a trusted platform/proxy, so trust the forwarded host.
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, profile, account }) {
      // Only present on initial sign-in; persist the GitHub username so the
      // dashboard can match registry records owned by this account.
      if (profile?.login) {
        token.login = profile.login
      }
      // GitHub sends `id` as a number; guard anyway rather than trust the
      // provider's shape, since a bad value would silently mis-key ownership.
      if (typeof profile?.id === "number" && Number.isInteger(profile.id)) {
        token.githubId = profile.id
      }
      // Persist the OAuth access token in the JWT (server-only). It is
      // deliberately NOT copied into `session` below, so it never reaches the
      // client; server code decodes the JWT cookie to use it.
      if (account?.access_token) {
        token.accessToken = account.access_token
      }

      // See lib/auth-identity-backfill.ts: self-heals `login`/`githubId` on
      // sessions minted before those fields existed on the token, instead of
      // account-scoped actions misreporting the user as not signed in.
      return backfillIdentity(token)
    },
    session({ session, token }) {
      if (typeof token.login === "string") {
        session.user.login = token.login
      }
      if (typeof token.githubId === "number") {
        session.user.githubId = token.githubId
      }
      return session
    },
  },
})

// Explicit annotations keep the exported types portable — TypeScript cannot
// name the inferred types because they reach into next-auth internals.
export const handlers: NextAuthResult["handlers"] = nextAuth.handlers
export const auth: NextAuthResult["auth"] = nextAuth.auth
export const signIn: NextAuthResult["signIn"] = nextAuth.signIn
export const signOut: NextAuthResult["signOut"] = nextAuth.signOut
