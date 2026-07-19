import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { MobileNav, SidebarNav } from "@/components/dashboard-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserMenu } from "@/components/user-menu"

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const { name, login, email, image } = session.user

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-50 h-16 border-b border-border bg-background/98">
        <div className="flex h-full items-center justify-between gap-4 px-5 sm:px-8">
          <Link
            href="/"
            className="flex min-w-0 shrink-0 items-center gap-2.5 no-underline"
            aria-label="Dashboard home"
          >
            <Image
              src="/logo.png"
              alt=""
              width={32}
              height={32}
              className="size-8 shrink-0 object-contain object-left [image-rendering:pixelated]"
            />
            <Image
              src="/banner.gif"
              alt="is-pinoy.dev"
              width={200}
              height={26}
              unoptimized
              priority
              className="h-6 w-auto max-w-[150px] object-contain object-left"
            />
            <span className="hidden font-mono text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase sm:inline">
              Dashboard
            </span>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            <a
              href="https://docs.is-pinoy.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden text-[13px] font-medium text-foreground/85 no-underline transition-colors duration-[140ms] hover:text-accent sm:inline"
            >
              Docs
            </a>
            <ThemeToggle />
            <UserMenu name={name} login={login} email={email} image={image} />
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-60 shrink-0 border-r border-border bg-sidebar lg:block">
          <div className="sticky top-16">
            <SidebarNav />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <MobileNav />
          <main className="mx-auto w-full max-w-[960px] flex-1 px-5 py-10 sm:px-8 lg:py-12">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
