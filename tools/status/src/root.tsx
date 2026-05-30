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

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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
