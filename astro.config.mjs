import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://l4p.github.io',
  base: '/',
  integrations: [mdx(), sitemap()],
  markdown: {
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
