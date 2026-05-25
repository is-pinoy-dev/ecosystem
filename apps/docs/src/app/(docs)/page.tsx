import { source } from '@/lib/source';
import { redirect } from 'next/navigation';
import type { Node } from 'fumadocs-core/page-tree';

function findFirstUrl(nodes: Node[]): string | undefined {
  for (const node of nodes) {
    if (node.type === 'page') return node.url;
    if (node.type === 'folder') {
      if (node.index) return node.index.url;
      const url = findFirstUrl(node.children);
      if (url) return url;
    }
  }
}

export default function HomePage() {
  const url = findFirstUrl(source.pageTree.children);
  redirect(url ?? '/');
}
