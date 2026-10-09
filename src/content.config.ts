import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/*
 * Repeating site content lives in src/content/<collection>/<slug>.yaml — one file per entry.
 * The layout is kept Keystatic-compatible so a CMS can be added later without moving files:
 *   - the filename is the slug (entry id)
 *   - fields are flat or simple lists
 *   - images are relative paths to src/assets/images/<collection>/
 *   - relationships (project ↔ developer, testimonial → project) are slug references
 * Images are optional: components render a branded placeholder until a real image is added.
 */

const developers = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/developers' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      photo: image().optional(),
      role: z.string(),
      skills: z.array(z.string()).default([]),
      specialties: z.array(z.string()).default([]),
      bio: z.string(),
      links: z
        .object({
          github: z.url().optional(),
          linkedin: z.url().optional(),
          portfolio: z.url().optional(),
        })
        .default({}),
      order: z.number().default(100),
    }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      client: z.string(),
      type: z.string(),
      summary: z.string(),
      tech: z.array(z.string()).default([]),
      developers: z.array(reference('developers')).default([]),
      images: z.array(image()).default([]),
      liveUrl: z.url().optional(),
      featured: z.boolean().default(false),
      order: z.number().default(100),
    }),
});

const services = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/services' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      summary: z.string(),
      description: z.string(),
      included: z.array(z.string()).default([]),
      image: image().optional(),
      order: z.number().default(100),
    }),
});

const testimonials = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/testimonials' }),
  schema: z.object({
    quote: z.string(),
    clientName: z.string(),
    company: z.string().optional(),
    project: reference('projects').optional(),
  }),
});

export const collections = { developers, projects, services, testimonials };
