// Every form on the site, server side: spam checks and sending. Field rules live in form-rules.ts.
// Shared by the no-JS path (pages handling their own POST) and the fetch path (src/pages/api/),
// so both behave identically. Nothing is stored: a valid submission is emailed and then discarded.
import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import {
  RESEND_API_KEY,
  CONTACT_TO_EMAIL,
  CONTACT_FROM_EMAIL,
  TURNSTILE_SITE_KEY,
  TURNSTILE_SECRET_KEY,
} from 'astro:env/server';
import { contact, site } from '../data/site';
import { FORMS, emptyValues, readValues, validate, type Errors, type FormId, type Values } from './form-rules';
import { roleOptions } from './roles';

/** Turnstile is on only when both keys are configured. */
export const turnstileSiteKey = (): string | undefined =>
  TURNSTILE_SITE_KEY && TURNSTILE_SECRET_KEY ? TURNSTILE_SITE_KEY : undefined;

async function verifyTurnstile(token: string, ip: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret: TURNSTILE_SECRET_KEY ?? '', response: token });
    if (ip) body.set('remoteip', ip);
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (err) {
    console.error('[forms] Turnstile verification request failed:', err);
    return false;
  }
}

/** Strip line breaks from anything that should stay on one line (headers, short fields). */
const oneLine = (s: string) => s.replace(/[\r\n]+/g, ' ');

/** What makes each form's email recognisable in the inbox. The [tag] comes first so they sort. */
const EMAILS: Record<FormId, { heading: string; subject: (v: Values) => string }> = {
  contact: {
    heading: `New enquiry from the ${site.name} website`,
    subject: (v) => `[Contact] ${v.enquiryType} — ${v.subject || v.name}`,
  },
  application: {
    heading: `New application from the ${site.name} website`,
    subject: (v) => `[Application] ${v.role} — ${v.name}`,
  },
  scout: {
    heading: `New Business Opportunity Scout enquiry from the ${site.name} website`,
    subject: (v) => `[Scout] Business Opportunity Scout enquiry — ${v.name}`,
  },
};

function emailText(id: FormId, v: Values): string {
  const fields = Object.entries(FORMS[id].fields);
  return [
    EMAILS[id].heading,
    '',
    ...fields.filter(([, f]) => !f.multiline).map(([name, f]) => `${f.label}: ${oneLine(v[name]) || '(not given)'}`),
    '',
    ...fields.filter(([, f]) => f.multiline).flatMap(([name, f]) => [`${f.label}:`, v[name], '']),
    '(Reply to this email to respond directly to the sender.)',
  ].join('\n');
}

async function send(id: FormId, v: Values): Promise<boolean> {
  if (!RESEND_API_KEY) {
    // Logged without any submission content.
    console.error(`[forms] RESEND_API_KEY is not set, so the ${id} form was not sent. See .env.example.`);
    return false;
  }
  const to = CONTACT_TO_EMAIL || contact.email;
  const from = CONTACT_FROM_EMAIL || 'onboarding@resend.dev';

  try {
    const resend = new Resend(RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: `${site.name} Website <${from}>`,
      to: [to],
      replyTo: v.email,
      subject: oneLine(EMAILS[id].subject(v)).slice(0, 200),
      text: emailText(id, v),
    });
    if (error) {
      console.error('[forms] Resend rejected the email:', error.name, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[forms] Sending through Resend failed:', err);
    return false;
  }
}

interface Result {
  status: 'success' | 'invalid' | 'failed';
  values: Values;
  errors: Errors;
}

/** Full handling of one submission. */
async function handleSubmission(id: FormId, form: FormData, ip: string | undefined): Promise<Result> {
  const values = readValues(id, form);
  const success: Result = { status: 'success', values: emptyValues(id), errors: {} };

  // Honeypot filled: almost certainly a bot. Report success and send nothing.
  const trap = form.get(FORMS[id].honeypot);
  if (typeof trap === 'string' && trap.trim() !== '') return success;

  // The role is checked against what is open right now, never against what the browser offered.
  const errors = validate(id, values, id === 'application' ? { role: await roleOptions() } : {});
  if (Object.keys(errors).length > 0) return { status: 'invalid', values, errors };

  if (turnstileSiteKey()) {
    const token = form.get('cf-turnstile-response');
    if (!(await verifyTurnstile(typeof token === 'string' ? token : '', ip))) {
      return { status: 'invalid', values, errors: {} };
    }
  }

  return (await send(id, values)) ? success : { status: 'failed', values, errors: {} };
}

/** Anything with the request and (where the platform provides it) the visitor's address. */
interface RequestContext {
  readonly request: Request;
  readonly clientAddress: string;
}

async function handleRequest(id: FormId, context: RequestContext): Promise<Result> {
  let ip: string | undefined;
  try {
    ip = context.clientAddress; // throws where the platform can't provide it
  } catch {}
  const form = await context.request.formData().catch(() => null);
  return form ? handleSubmission(id, form, ip) : { status: 'invalid', values: emptyValues(id), errors: {} };
}

const HTTP_STATUS = { success: 200, invalid: 400, failed: 502 } as const;

/** JSON endpoint for the enhanced (JavaScript) version of a form. Used by src/pages/api/. */
export const formEndpoint =
  (id: FormId): APIRoute =>
  async (context) => {
    const { status, errors } = await handleRequest(id, context);
    const { messages } = FORMS[id];
    return Response.json(
      { status, message: status === 'success' ? messages.success : messages.error, errors },
      { status: HTTP_STATUS[status] },
    );
  };

/** What a page needs to render a form. */
export interface FormState {
  status: 'idle' | 'success' | 'error';
  values: Values;
  errors: Errors;
}

export const idleForm = (id: FormId): FormState => ({ status: 'idle', values: emptyValues(id), errors: {} });
export const sentForm = (id: FormId): FormState => ({ ...idleForm(id), status: 'success' });

/**
 * No-JS path: a page handles its own POST. On success the page must redirect (Post/Redirect/Get,
 * so a refresh can't resubmit); otherwise it re-renders with the returned state and HTTP status.
 */
export async function handlePagePost(id: FormId, context: RequestContext) {
  const { status, values, errors } = await handleRequest(id, context);
  const state: FormState = { status: 'error', values, errors };
  return { ok: status === 'success', http: HTTP_STATUS[status], state };
}
