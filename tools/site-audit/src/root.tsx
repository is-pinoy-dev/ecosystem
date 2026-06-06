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
  { rel: "icon", type: "image/x-icon", href: `${import.meta.env.BASE_URL}favicon.ico` },
  { rel: "icon", type: "image/svg+xml", href: `${import.meta.env.BASE_URL}favicon.svg` },
  { rel: "icon", type: "image/png", sizes: "96x96", href: `${import.meta.env.BASE_URL}favicon-96x96.png` },
  { rel: "apple-touch-icon", sizes: "180x180", href: `${import.meta.env.BASE_URL}apple-touch-icon.png` },
  { rel: "manifest", href: `${import.meta.env.BASE_URL}site.webmanifest` },
];

export function meta() {
  return [
    { title: "Site Audit — is-pinoy.dev" },
    { name: "description", content: "Audit your portfolio's SEO and OpenGraph tags directly from your subdomain." },
    { property: "og:type", content: "website" },
    { property: "og:title", content: "Site Audit — is-pinoy.dev" },
    { property: "og:description", content: "Audit your portfolio's SEO and OpenGraph tags directly from your subdomain." },
    { property: "og:image", content: "/_tools/site-audit/site-audit-banner.gif" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: "Site Audit — is-pinoy.dev" },
    { name: "twitter:description", content: "Audit your portfolio's SEO and OpenGraph tags directly from your subdomain." },
    { name: "twitter:image", content: "/_tools/site-audit/site-audit-banner.gif" },
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
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1 className="font-pixel">{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
