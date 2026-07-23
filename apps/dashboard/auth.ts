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
