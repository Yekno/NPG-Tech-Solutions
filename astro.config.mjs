// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

// Pages are prerendered (static) by default; only routes that opt out with
// `export const prerender = false` (the form handlers) run on Vercel Functions.
export default defineConfig({
  // Current Vercel URL. MUST change to the real domain once one is chosen
  // (it is used for the sitemap, canonical URLs and public/robots.txt).
  site: 'https://npg-tech-solutions.vercel.app',
  adapter: vercel(),
  integrations: [sitemap()],
});
