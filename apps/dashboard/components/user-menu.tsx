"use client"

import Image from "next/image"
import { LogOut } from "lucide-react"
import { Button } from "@is-pinoy-dev/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
} from "@is-pinoy-dev/ui/components/popover"
import { Separator } from "@is-pinoy-dev/ui/components/separator"
import { signOutToLogin } from "@/lib/actions"

interface UserMenuProps {
  name: string | null | undefined
  login: string
  email: string | null | undefined
  image: string | null | undefined
}

function Avatar({
  image,
  login,
  size,
}: {
  image: string | null | undefined
  login: string
  size: number
}) {
  if (image) {
    return (
      <Image
        src={image}
        alt=""
        width={size}
        height={size}
        className="shrink-0 border border-border"
      />
    )
  }
  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center border border-border bg-secondary font-mono text-xs font-semibold text-secondary-foreground uppercase"
      style={{ width: size, height: size }}
    >
      {login.slice(0, 2)}
    </span>
  )
}

export function UserMenu({ name, login, email, image }: UserMenuProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open account menu"
          className="p-1"
        >
          <Avatar image={image} login={login} size={30} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64">
        <PopoverHeader className="flex-row items-center gap-3 p-1.5">
          <Avatar image={image} login={login} size={36} />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-sm font-medium text-foreground">
              {name ?? login}
            </span>
            <span className="truncate font-mono text-xs text-muted-foreground">
              @{login}
            </span>
            {email && (
              <span className="truncate text-xs text-muted-foreground">
                {email}
              </span>
            )}
          </div>
        </PopoverHeader>
        <Separator />
        <form action={signOutToLogin}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2"
          >
            <LogOut aria-hidden="true" />
            Sign out
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  )
}
