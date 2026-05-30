import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import type { ThemeRegistrationRaw } from 'shiki';
import isPinoyThemeRaw from './src/shiki-theme.json' with { type: 'json' };
const isPinoyTheme = isPinoyThemeRaw as unknown as ThemeRegistrationRaw;

// You can customize Zod schemas for frontmatter and `meta.json` here
// see https://fumadocs.dev/docs/mdx/collections
export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: pageSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

export default defineConfig({
  mdxOptions: {
    rehypeCodeOptions: {
      themes: {
        light: isPinoyTheme,
        dark: isPinoyTheme,
      },
    },
  },
});
