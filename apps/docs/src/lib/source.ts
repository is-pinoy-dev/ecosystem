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
  GitHub: createElement(
    'svg',
    { role: 'img', viewBox: '0 0 24 24', fill: 'currentColor', className: 'size-4' },
    createElement('path', {
      d: 'M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z',
    })
  ),
  Cloudflare: createElement(
    'svg',
    { role: 'img', viewBox: '0 0 109 44', fill: 'currentColor', className: 'size-4' },
    createElement('path', {
      d: 'M87.1 17.8c-.4-1.4-1-2.7-1.8-3.9-2.7-4.2-7.3-6.9-12.4-6.9-1.9 0-3.8.4-5.5 1.1C65.3 3.5 60 0 54 0c-9.3 0-16.9 7.1-17.5 16.2C30 17.7 24 23.7 24 31c0 7.2 5.8 13 13 13h49c6.1 0 11-4.9 11-11 0-6.8-5.8-12.2-9.9-15.2z',
    })
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
