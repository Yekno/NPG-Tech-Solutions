// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// Pages are prerendered (static) by default; only routes that opt out with
// `export const prerender = false` (the form handlers) run on Vercel Functions.
export default defineConfig({
  // TODO: replace with the real domain once one is registered.
  site: 'https://npg-tech-solutions.vercel.app',
  adapter: vercel(),
});
