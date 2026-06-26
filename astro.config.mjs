import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import remarkObsidian from './src/utils/remark-obsidian';

export default defineConfig({
  site: 'https://l4place0.github.io',
  base: '/l4p-blog',
  integrations: [mdx(), sitemap()],
  markdown: {
    remarkPlugins: [remarkObsidian],
    shikiConfig: {
      theme: 'rose-pine',
      themes: {
        light: 'rose-pine-dawn',
        dark: 'rose-pine',
      },
      wrap: true,
    },
  },
});
