import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router"

import { ThemeProvider } from "@is-pinoy-dev/ui/components/theme-provider"

import type { Route } from "./+types/root"
import "./app.css"

export const links: Route.LinksFunction = () => [
  {
    rel: "icon",
    type: "image/x-icon",
    href: `${import.meta.env.BASE_URL}favicon.ico`,
  },
  {
    rel: "icon",
    type: "image/svg+xml",
    href: `${import.meta.env.BASE_URL}favicon.svg`,
  },
  {
    rel: "icon",
    type: "image/png",
    sizes: "96x96",
    href: `${import.meta.env.BASE_URL}favicon-96x96.png`,
  },
  {
    rel: "apple-touch-icon",
    sizes: "180x180",
    href: `${import.meta.env.BASE_URL}apple-touch-icon.png`,
  },
  { rel: "manifest", href: `${import.meta.env.BASE_URL}site.webmanifest` },
]

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: light)"
          content="#fdfcfa"
        />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: dark)"
          content="#0b0d12"
        />
        <Meta />
        <Links />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  return <Outlet />
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!"
  let details = "An unexpected error occurred."
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error"
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message
    stack = error.stack
  }

  return (
    <main className="mx-auto w-full max-w-[720px] px-5 py-16 sm:px-8">
      <h1 className="m-0 text-4xl font-semibold tracking-[-0.03em] text-foreground">
        {message}
      </h1>
      <p className="mt-4 text-base leading-7 text-muted-foreground">
        {details}
      </p>
      {stack && (
        <pre className="mt-6 w-full overflow-x-auto border border-border bg-code-bg p-4 font-mono text-xs leading-relaxed text-[#e6e9ef]">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  )
}
