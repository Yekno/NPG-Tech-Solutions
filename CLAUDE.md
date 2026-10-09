# Developer Community Portfolio Website

## What this project is
A collaborative web development community and digital agency platform. It showcases the expertise, portfolios, and services of a group of web developers. Potential clients can explore the team's work, learn about its capabilities, and get in touch to discuss or request a project.

## Audiences
1. **Potential clients**: businesses and individuals looking to hire developers for a project. The primary goal is turning them into project requests.
2. **Developers**: people who want to join the community as members.

## Site structure (pages)
1. **Home**: who we are and what we offer, with clear paths to Services, Portfolio, and Request a Project.
2. **Our Developers**: profiles of members, including their skills and specialties.
3. **Services**: web development, UI/UX, e-commerce, maintenance, and so on.
4. **Portfolio / Projects**: websites and applications the community has built.
5. **About the Community**: mission and how the team works.
6. **Testimonials**: feedback from clients.
7. **Request a Project / Contact Us**: a form where clients describe what they need.
8. **Join the Community**: for developers who want to become members.

## Content model
Developers, projects, services, and testimonials are repeating content, so keep each one as structured data rather than hard-coding it into pages. That way new members and projects can be added without touching layout code.
- **Developer**: name, photo, role, skills, specialties, short bio, links (GitHub, LinkedIn, portfolio)
- **Project**: title, client/type, summary, tech used, contributing developers, images, live link
- **Service**: name, description, what's included
- **Testimonial**: quote, client name, company, related project

## Decisions made (2026-10-09)
- **Stack**: Astro + TypeScript, plain CSS with custom properties (no Tailwind/UI framework). No logins planned, so no Next.js.
- **Hosting**: Vercel free tier, via the `@astrojs/vercel` adapter. Pages are static; only the form handlers run on demand.
- **Form submissions**: Astro Actions validate with a shared Zod schema (client + server), spam-protected by Cloudflare Turnstile + a honeypot field, then emailed to the team inbox via Resend. No database.
- **Content management**: files in the repo, edited by developers. One file per entry in Astro content collections, laid out so Keystatic can be added later without moving content. No CMS for now.
- **Design reference**: https://www.snaperdigital.com/ (modern agency style with lots of motion and imagery).
- **Motion**: CSS plus a small vanilla script (`src/scripts/motion.ts`) driven by `data-*` attributes (reveal, split, count, parallax, magnetic, tilt, spotlight). No animation library. Content must stay visible without JS, and all motion must respect `prefers-reduced-motion`.
- **Images**: optional on every content entry. `src/components/Media.astro` shows a branded placeholder until a real image is added. Home page images go in `src/assets/images/home/` (`hero-1`, `hero-2`, `hero-3`, `about`).
- **Build order**: page by page, starting with Home.
- **Brand**: name "NPG Tech Solutions". Logo files live in `brand/` (originals) and `src/assets/brand/` (used by the site). Colors from the logo: navy `#021854`, blue `#0655E1`. Neutral system fonts for now.

## Decisions still open
- Domain (none chosen yet). Resend needs a verified sending domain before it can email the team inbox in production.
- Team email address that receives form submissions (set at deploy time via env var).
- Final typography.

Update these sections as decisions are made.

## Working conventions
- Mobile-first, responsive layouts.
- Accessible markup: semantic HTML, alt text, labelled form fields, keyboard navigation.
- Keep forms validated on both the client and the server, with spam protection on public forms.
- Ask before adding new dependencies or changing the stack.
