# NPG Tech Solutions Website

## What this project is
The company website for NPG Tech Solutions, a digital solutions company offering web development, UI/UX, e-commerce, IT support and digital skills. It presents the company as an established agency: potential clients can explore our work, services and team, then get in touch to request a project. People looking for work can see open roles and apply.

Voice: "we / our team / our specialists / the company". Never "community", "members" or "collective". Keep it confident and professional.

## Audiences
1. **Potential clients**: businesses and individuals looking to hire a digital agency for a project. The primary goal is turning them into project requests.
2. **Job seekers**: people looking for jobs at the company.

## Site structure (pages)
1. **Home**: who we are and what we offer, with clear paths to Services, Portfolio, and Request a Project.
2. **Our Team** (`/team`): profiles of our people, including developers, designers, IT support and leadership.
3. **Services**: web development, UI/UX, e-commerce, maintenance, and so on.
4. **Portfolio / Projects**: websites and applications the company has built.
5. **About Us**: mission and how the team works.
6. **Testimonials**: feedback from clients.
7. **Request a Project / Contact Us**: a form where clients describe what they need.
8. **Careers** (`/careers`): open roles plus an application form.

## Content model
Team members, projects, services, testimonials and roles are repeating content, so keep each one as structured data rather than hard-coding it into pages. That way new people, projects and roles can be added without touching layout code.
- **Team member**: name, photo, role, skills, specialties, short bio, links (GitHub, LinkedIn, portfolio), optional department. Stored in the `developers` collection, which keeps its name for now to avoid churn.
- **Project**: title, client/type, summary, tech used, contributing team members, images, live link
- **Service**: name, description, what's included
- **Testimonial**: quote, client name, company, related project
- **Role**: title, type (full-time, part-time, contract, internship), location/remote, summary, responsibilities, requirements, open (boolean)

## Decisions made
- **Positioning (2026-11-07)**: NPG Tech Solutions presents itself as an organisation (a digital agency / tech company), not a community of developers. "Join the Community" became Careers (`/careers`, CTA "Join our team"), "Our Developers" became Our Team (`/team`), and "About the Community" became About Us.
- **Stack (2026-10-09)**: Astro + TypeScript, plain CSS with custom properties (no Tailwind/UI framework). No logins planned, so no Next.js.
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
