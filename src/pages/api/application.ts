// JSON endpoint for the enhanced (JavaScript) application form. The no-JS form posts to its own page;
// both use src/lib/forms.ts. Runs as a Vercel Function.
import { formEndpoint } from '../../lib/forms';

export const prerender = false;

export const POST = formEndpoint('application');
