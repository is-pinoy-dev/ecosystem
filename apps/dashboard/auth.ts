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

const nextAuth = NextAuth({
  // Vercel preview deployments get a fresh, unguessable URL per commit, so the
  // request Host can't be pinned to a single AUTH_URL — trust the platform's
  // forwarded Host header instead.
  trustHost: true,
  // A GitHub OAuth app has one fixed callback URL, but preview URLs are
  // dynamic. When AUTH_REDIRECT_PROXY_URL points at a stable deployment (e.g.
  // https://dashboard.is-pinoy.dev/api/auth), Auth.js routes the OAuth
  // handshake through it and then redirects back to the originating preview,
  // so sign-in works on every preview without registering each URL. Unset in
  // production and locally, where the callback URL is already stable.
  redirectProxyUrl: process.env.AUTH_REDIRECT_PROXY_URL,
  providers: [GitHub],
  // Auth.js auto-trusts the host in dev and on Vercel, but throws
  // UntrustedHost under `next start` on any other host. The dashboard always
  // runs behind a trusted platform/proxy, so trust the forwarded host.
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, profile }) {
      // Only present on initial sign-in; persist the GitHub username so the
      // dashboard can match registry records owned by this account.
      if (profile?.login) {
        token.login = profile.login
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
