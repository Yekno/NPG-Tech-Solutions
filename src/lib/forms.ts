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
import {
  FORMS,
  PHONE_INVALID,
  emptyValues,
  readValues,
  validate,
  type Errors,
  type FailReason,
  type FormId,
  type Values,
} from './form-rules';
import { normalisePhone, phoneForEmail } from './phone';
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

/** One line per short field; the phone (already in international format) also gets a WhatsApp link. */
function emailLines(label: string, value: string, format?: string): string[] {
  if (!value) return [`${label}: (not given)`];
  if (format !== 'phone') return [`${label}: ${oneLine(value)}`];
  const { display, whatsapp } = phoneForEmail(value);
  return [`${label}: ${display}`, `WhatsApp: ${whatsapp}`];
}

function emailText(id: FormId, v: Values): string {
  const fields = Object.entries(FORMS[id].fields).filter(([, f]) => f.inEmail !== false);
  return [
    EMAILS[id].heading,
    '',
    ...fields.filter(([, f]) => !f.multiline).flatMap(([name, f]) => emailLines(f.label, v[name], f.format)),
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
  /** 'invalid': a field needs fixing (errors say which). 'send': the fields were fine but it didn't go. */
  status: 'success' | FailReason;
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

  // The browser's phone check is only a quick guide: this is the real one, for the chosen country.
  // An invalid country code also lands here, since no number is valid for it.
  if (errors.phoneCountry) {
    delete errors.phoneCountry; // the dropdown has no error slot of its own
    if (values.phone) errors.phone ??= PHONE_INVALID;
  }
  let phone = '';
  if (values.phone && !errors.phone) {
    phone = normalisePhone(values.phoneCountry, values.phone) ?? '';
    if (!phone) errors.phone = PHONE_INVALID;
  }
  // Errors re-render with what was typed, not the normalised number.
  if (Object.keys(errors).length > 0) return { status: 'invalid', values, errors };

  // A failed spam check isn't something the visitor can fix in the fields (usually the token
  // expired), so it gets the "try again" message rather than "check the highlighted fields".
  if (turnstileSiteKey()) {
    const token = form.get('cf-turnstile-response');
    if (!(await verifyTurnstile(typeof token === 'string' ? token : '', ip))) {
      return { status: 'send', values, errors: {} };
    }
  }

  return (await send(id, { ...values, phone })) ? success : { status: 'send', values, errors: {} };
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

const HTTP_STATUS = { success: 200, invalid: 400, send: 502 } as const;

/**
 * JSON endpoint for the enhanced (JavaScript) version of a form. Used by src/pages/api/.
 * Responds { status: 'success' } or { status: 'error', reason: 'invalid' | 'send', errors }; the
 * browser shows the matching message from form-rules.ts.
 */
export const formEndpoint =
  (id: FormId): APIRoute =>
  async (context) => {
    const { status, errors } = await handleRequest(id, context);
    const body = status === 'success' ? { status } : { status: 'error', reason: status, errors };
    return Response.json(body, { status: HTTP_STATUS[status] });
  };

/** What a page needs to render a form. A failed submission's status is the reason it failed. */
export interface FormState {
  status: 'idle' | 'success' | FailReason;
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
  // Keeps what was typed (country code included) for both kinds of failure.
  const state: FormState = { status, values, errors };
  return { ok: status === 'success', http: HTTP_STATUS[status], state };
}
