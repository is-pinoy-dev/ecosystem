export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="m-0 font-mono text-lg text-primary">404</h1>
      <p className="m-0 text-sm text-muted-foreground">
        No portfolio is claimed at this address. Claim one at{" "}
        <a
          href="https://is-pinoy.dev"
          className="text-accent underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          is-pinoy.dev
        </a>
        .
      </p>
    </main>
  )
}
