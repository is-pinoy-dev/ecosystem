import { cva, type VariantProps } from "class-variance-authority"

const variants = {
  primary:
    "border border-primary bg-primary text-primary-foreground hover:bg-primary-light disabled:bg-fd-secondary disabled:text-fd-secondary-foreground",
  outline: "border hover:bg-fd-accent hover:text-fd-accent-foreground",
  ghost: "hover:bg-fd-accent hover:text-fd-accent-foreground",
  secondary:
    "border bg-fd-secondary text-fd-secondary-foreground hover:bg-fd-accent hover:text-fd-accent-foreground",
} as const

export const buttonVariants = cva(
  "focus-visible:ring-fd-ring/30 inline-flex items-center justify-center rounded-none p-2 text-sm font-semibold transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: variants,
      // fumadocs use `color` instead of `variant`
      color: variants,
      size: {
        sm: "gap-1 px-2 py-1.5 text-xs",
        icon: "p-1.5 [&_svg]:size-5",
        "icon-sm": "p-1.5 [&_svg]:size-4.5",
        "icon-xs": "p-1 [&_svg]:size-4",
      },
    },
  }
)

export type ButtonProps = VariantProps<typeof buttonVariants>
