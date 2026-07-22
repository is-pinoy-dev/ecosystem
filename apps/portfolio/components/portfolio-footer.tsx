// Attribution shown on every rendered portfolio, regardless of template. Keeps
// a visible link back to the service and makes clear the content is sourced
// from GitHub.
export function PortfolioFooter({ login }: { login: string }) {
  return (
    <footer className="mt-16 border-t border-border py-6 text-center text-xs text-muted-foreground">
      <p className="m-0">
        Built from{" "}
        <a
          href={`https://github.com/${login}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline"
        >
          @{login}
        </a>
        &rsquo;s GitHub profile &middot; hosted on{" "}
        <a
          href="https://is-pinoy.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline"
        >
          is-pinoy.dev
        </a>
      </p>
    </footer>
  )
}
