import { Button } from "@is-pinoy-dev/ui/components/button"
import { GitHubIcon, DiscordIcon } from "@/components/icons"

export function CTASection() {
  return (
    <section className="w-full border-t-2 border-primary bg-primary/5">
      <div className="mx-auto flex max-w-[960px] flex-col items-center gap-8 px-10 py-20 text-center">
        {/* Eyebrow */}
        <span className="font-pixel text-[7px] tracking-[0.15em] text-primary uppercase">
          {"// PARA SA LAHAT NG PINOY DEVS"}
        </span>

        {/* Heading */}
        <h2
          className="m-0 max-w-[640px] font-pixel leading-[1.8] text-foreground"
          style={{ fontSize: "clamp(0.6rem, 1.8vw, 1rem)" }}
        >
          Built by the community,
          <br />
          for the community.
        </h2>

        {/* Body */}
        <p className="m-0 max-w-[480px] font-sans text-[15px] leading-[1.7] text-muted-foreground">
          Have an idea? Want to add a provider? Found a bug? All contributions
          are welcome — open an issue, start a discussion, or just say hi on
          Discord.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button asChild variant="default-shadow">
            <a
              href="https://github.com/is-pinoy-dev"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GitHubIcon size={14} />
              CONTRIBUTE
            </a>
          </Button>
          <Button asChild variant="outline-shadow">
            <a
              href="https://github.com/orgs/is-pinoy-dev/discussions"
              target="_blank"
              rel="noopener noreferrer"
            >
              SHARE AN IDEA
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}
