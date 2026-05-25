import { docs } from 'collections/server';
import { loader, type LoaderPlugin } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';
import { createElement } from 'react';
import { docsContentRoute, docsImageRoute, docsRoute } from './shared';

const customIconMap: Record<string, React.ReactNode> = {
  Vercel: createElement(
    'svg',
    { role: 'img', viewBox: '0 0 24 24', fill: 'currentColor', className: 'size-4' },
    createElement('path', { d: 'M24 22.525H0l12-21.05 12 21.05z' })
  ),
};

function customIconsPlugin(): LoaderPlugin {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function resolve(node: any) {
    if (typeof node.icon === 'string' && node.icon in customIconMap)
      node.icon = customIconMap[node.icon];
    return node;
  }
  return {
    name: 'custom-icons',
    enforce: 'pre',
    transformPageTree: { file: resolve, folder: resolve, separator: resolve },
  };
}

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: docsRoute,
  source: docs.toFumadocsSource(),
  plugins: [customIconsPlugin(), lucideIconsPlugin()],
});

export function getPageImage(page: (typeof source)['$inferPage']) {
  const segments = [...page.slugs, 'image.png'];

  return {
    segments,
    url: `${docsImageRoute}/${segments.join('/')}`,
  };
}

export function getPageMarkdownUrl(page: (typeof source)['$inferPage']) {
  const segments = [...page.slugs, 'content.md'];

  return {
    segments,
    url: `${docsContentRoute}/${segments.join('/')}`,
  };
}

export async function getLLMText(page: (typeof source)['$inferPage']) {
  const processed = await page.data.getText('processed');

  return `# ${page.data.title} (${page.url})

${processed}`;
}
