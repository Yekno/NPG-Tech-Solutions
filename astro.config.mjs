// @ts-check
import { defineConfig, envField } from 'astro/config';
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
  // Contact form settings, read at runtime on the server (see .env.example). All optional:
  // without RESEND_API_KEY the form reports an error instead of sending; without both
  // Turnstile keys the form relies on the honeypot alone.
  env: {
    schema: {
      RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      CONTACT_TO_EMAIL: envField.string({ context: 'server', access: 'secret', optional: true }),
      CONTACT_FROM_EMAIL: envField.string({ context: 'server', access: 'secret', optional: true }),
      TURNSTILE_SITE_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      TURNSTILE_SECRET_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
});
