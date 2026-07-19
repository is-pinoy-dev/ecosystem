import type { Metadata } from "next"
import Image from "next/image"
import { redirect } from "next/navigation"
import { Button } from "@is-pinoy-dev/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@is-pinoy-dev/ui/components/card"
import { auth } from "@/auth"
import { GitHubIcon } from "@/components/icons"
import { signInWithGitHub } from "@/lib/actions"

export const metadata: Metadata = {
  title: "Sign in",
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const session = await auth()
  if (session?.user) {
    redirect("/")
  }

  const { error } = await searchParams

  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-5 py-16">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/logo.png"
            alt=""
            width={48}
            height={48}
            className="size-12 object-contain [image-rendering:pixelated]"
          />
          <Image
            src="/banner.gif"
            alt="is-pinoy.dev"
            width={200}
            height={26}
            unoptimized
            priority
            className="h-6 w-auto object-contain"
          />
        </div>

        <Card>
          <CardHeader className="border-b [.border-b]:pb-5">
            <p className="m-0 font-mono text-xs font-semibold tracking-[0.12em] text-accent uppercase">
              Dashboard
            </p>
            <CardTitle className="text-xl font-semibold tracking-[-0.02em]">
              Sign in to your dashboard
            </CardTitle>
            <CardDescription className="text-sm/relaxed">
              Manage your free .is-pinoy.dev subdomains. Ownership is tied to
              your GitHub account, so sign in with GitHub to continue.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {error && (
              <p
                role="alert"
                className="m-0 border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs/relaxed text-destructive"
              >
                Sign-in failed. Please try again, and make sure you authorize
                the is-pinoy.dev application on GitHub.
              </p>
            )}
            <form action={signInWithGitHub}>
              <Button type="submit" size="lg" className="w-full gap-2">
                <GitHubIcon size={16} />
                Continue with GitHub
              </Button>
            </form>
            <p className="m-0 text-xs/relaxed text-muted-foreground">
              No subdomain yet? Claim one for free at{" "}
              <a
                href="https://is-pinoy.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline"
              >
                is-pinoy.dev
              </a>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
