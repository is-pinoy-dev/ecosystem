import NextAuth, {
  type DefaultSession,
  type NextAuthResult,
} from "next-auth"
import GitHub from "next-auth/providers/github"

declare module "next-auth" {
  interface Session {
    user: {
      /** GitHub username of the signed-in developer. */
      login: string
    } & DefaultSession["user"]
  }
}

// Env values pasted or imported from a BOM-encoded file (e.g. saved as
// "UTF-8 with BOM") carry an invisible leading byte-order mark (U+FEFF), and
// copy-paste can add stray whitespace/newlines or a zero-width space (U+200B).
// A single such character on AUTH_GITHUB_ID makes GitHub receive an unknown
// `client_id`, which it answers with a 404 — silently breaking sign-in in
// production. Strip zero-width marks and surrounding whitespace so an invisible
// character can never take the whole flow down.
function cleanCredential(value: string | undefined): string | undefined {
  const cleaned = value?.replace(/[\uFEFF\u200B]/g, "").trim()
  return cleaned ? cleaned : undefined
}

const nextAuth = NextAuth({
  providers: [
    GitHub({
      clientId: cleanCredential(process.env.AUTH_GITHUB_ID),
      clientSecret: cleanCredential(process.env.AUTH_GITHUB_SECRET),
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
    jwt({ token, profile, account }) {
      // Only present on initial sign-in; persist the GitHub username so the
      // dashboard can match registry records owned by this account.
      if (profile?.login) {
        token.login = profile.login
      }
      // Persist the OAuth access token in the JWT (server-only). It is
      // deliberately NOT copied into `session` below, so it never reaches the
      // client; server code decodes the JWT cookie to use it.
      if (account?.access_token) {
        token.accessToken = account.access_token
      }
      return token
    },
    session({ session, token }) {
      if (typeof token.login === "string") {
        session.user.login = token.login
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
