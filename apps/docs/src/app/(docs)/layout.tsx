import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import { BadgeCheck, BookOpen, Wrench } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

function TabIcon({ Icon }: { Icon: LucideIcon }) {
  return (
    <div className="flex size-full items-center justify-center">
      <Icon className="size-5 shrink-0 text-muted-foreground" />
    </div>
  );
}

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <DocsLayout
      tree={source.getPageTree()}
      tabs={[
        {
          title: 'Guides',
          description: 'Step-by-step setup',
          url: '/guides',
          icon: <TabIcon Icon={BookOpen} />,
        },
        {
          title: 'Built-in Tools',
          description: 'Explore built-in tools',
          url: '/tools',
          icon: <TabIcon Icon={Wrench} />,
        },
        {
          title: 'Badge Kit',
          description: 'Showcase your dev identity',
          url: '/badge-kit',
          icon: <TabIcon Icon={BadgeCheck} />,
        },
      ]}
      {...baseOptions()}
    >
      {children}
    </DocsLayout>
  );
}
