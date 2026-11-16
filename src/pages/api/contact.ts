// JSON endpoint for the enhanced (JavaScript) contact form. The no-JS form posts to /contact
// itself; both use the same handler in src/lib/contact.ts. Runs as a Vercel Function.
import type { APIRoute } from 'astro';
import { handleEnquiry, MESSAGES } from '../../lib/contact';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const { request } = context;
  let clientAddress: string | undefined;
  try {
    clientAddress = context.clientAddress; // throws where the platform can't provide it
  } catch {}
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ status: 'invalid', message: MESSAGES.error, errors: {} }, { status: 400 });
  }

  const result = await handleEnquiry(form, clientAddress);
  const ok = result.status === 'success';
  return Response.json(
    { status: result.status, message: ok ? MESSAGES.success : MESSAGES.error, errors: result.errors },
    { status: ok ? 200 : result.status === 'invalid' ? 400 : 502 },
  );
};
