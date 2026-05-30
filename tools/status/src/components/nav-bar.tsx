import { Link } from "react-router";

const NAV_LINKS = [
  { href: "https://is-pinoy.dev", label: "HOME" },
  { href: "https://docs.is-pinoy.dev", label: "DOCS" },
];

export function NavBar() {
  return (
    <nav className="fixed top-0 right-0 left-0 z-50 flex h-16 items-center border-b border-border bg-background/85 px-6 backdrop-blur">
      <Link to="/" className="group flex shrink-0 items-center">
        <img
          src="/logo.png"
          alt="is-pinoy.dev logo"
          className="h-8 w-auto [image-rendering:pixelated] group-hover:animate-spin"
        />
        <img
          src="/status-banner.gif"
          alt="/STATUS — is-pinoy.dev"
          className="hidden h-7 w-auto md:block"
        />
      </Link>

      <div className="ml-auto flex items-center gap-1">
        {NAV_LINKS.map(({ href, label }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 font-pixel text-[8px] text-muted-foreground border border-transparent hover:border-border hover:text-primary transition-colors"
          >
            {label}
          </a>
        ))}
      </div>
    </nav>
  );
}
