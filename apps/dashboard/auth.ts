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
  providers: [GitHub],
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
