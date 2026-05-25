import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import Image from 'next/image';
import { gitConfig } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <Image
            src="/logo.png"
            alt="is-pinoy.dev logo"
            width={48}
            height={48}
            className="h-10 w-auto [image-rendering:pixelated]"
          />
          <Image
            src="/banner.gif"
            alt="is-pinoy.dev"
            width={200}
            height={40}
            unoptimized
            className="-ml-4 hidden h-9 w-auto md:block"
          />
        </>
      ),
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}
