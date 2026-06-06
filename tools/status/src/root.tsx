import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import type { Route } from "./+types/root";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
  { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
  { rel: "icon", type: "image/png", sizes: "96x96", href: "/favicon-96x96.png" },
  { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
  { rel: "manifest", href: "/site.webmanifest" },
];

export function meta() {
  return [
    { title: "Status — is-pinoy.dev" },
    { name: "description", content: "Live uptime and status for all is-pinoy.dev subdomains." },
    { property: "og:type", content: "website" },
    { property: "og:title", content: "Status — is-pinoy.dev" },
    { property: "og:description", content: "Live uptime and status for all is-pinoy.dev subdomains." },
    { property: "og:image", content: "/status-banner.gif" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: "Status — is-pinoy.dev" },
    { name: "twitter:description", content: "Live uptime and status for all is-pinoy.dev subdomains." },
    { name: "twitter:image", content: "/status-banner.gif" },
  ];
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <meta name="color-scheme" content="dark" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const message =
    isRouteErrorResponse(error) && error.status === 404 ? "404" : "Error";
  const details =
    isRouteErrorResponse(error)
      ? error.status === 404
        ? "Page not found."
        : error.statusText
      : import.meta.env.DEV && error instanceof Error
        ? error.message
        : "An unexpected error occurred.";

  return (
    <main className="p-8 font-pixel">
      <h1 className="text-primary text-base mb-4">{message}</h1>
      <p className="text-muted-foreground text-xs">{details}</p>
    </main>
  );
}
