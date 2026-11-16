// Contact form, server side: spam checks and sending. Validation rules live in contact-rules.ts.
// Shared by the no-JS path (src/pages/contact.astro) and the fetch path (src/pages/api/contact.ts),
// so both behave identically. Nothing is stored: a valid enquiry is emailed and then discarded.
import { Resend } from 'resend';
import {
  RESEND_API_KEY,
  CONTACT_TO_EMAIL,
  CONTACT_FROM_EMAIL,
  TURNSTILE_SITE_KEY,
  TURNSTILE_SECRET_KEY,
} from 'astro:env/server';
import { contact, site } from '../data/site';
import { HONEYPOT, emptyValues, readValues, validate, type Errors, type Values } from './contact-rules';

export * from './contact-rules';

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
    console.error('[contact] Turnstile verification request failed:', err);
    return false;
  }
}

/** Strip line breaks from anything that ends up in an email header. */
const oneLine = (s: string) => s.replace(/[\r\n]+/g, ' ');

async function send(v: Values): Promise<boolean> {
  if (!RESEND_API_KEY) {
    // Logged without any submission content.
    console.error('[contact] RESEND_API_KEY is not set, so the enquiry was not sent. See .env.example.');
    return false;
  }
  const to = CONTACT_TO_EMAIL || contact.email;
  const from = CONTACT_FROM_EMAIL || 'onboarding@resend.dev';
  const text = [
    `New enquiry from the ${site.name} website`,
    '',
    `Full name: ${v.name}`,
    `Email: ${v.email}`,
    `Phone: ${v.phone || '(not given)'}`,
    `Organisation: ${v.organisation || '(not given)'}`,
    `Enquiry type: ${v.enquiryType}`,
    `Subject: ${v.subject || '(not given)'}`,
    '',
    'Message:',
    v.message,
    '',
    '(Reply to this email to respond directly to the sender.)',
  ].join('\n');

  try {
    const resend = new Resend(RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: `${site.name} Website <${from}>`,
      to: [to],
      replyTo: v.email,
      subject: oneLine(`Website enquiry: ${v.enquiryType} — ${v.subject || v.name}`).slice(0, 200),
      text,
    });
    if (error) {
      console.error('[contact] Resend rejected the email:', error.name, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[contact] Sending through Resend failed:', err);
    return false;
  }
}

export type Result =
  | { status: 'success'; values: Values; errors: Errors }
  | { status: 'invalid' | 'failed'; values: Values; errors: Errors };

/** Full handling of one submission. */
export async function handleEnquiry(form: FormData, ip: string | undefined): Promise<Result> {
  const values = readValues(form);

  // Honeypot filled: almost certainly a bot. Report success and send nothing.
  const trap = form.get(HONEYPOT);
  if (typeof trap === 'string' && trap.trim() !== '') {
    return { status: 'success', values: emptyValues(), errors: {} };
  }

  const errors = validate(values);
  if (Object.keys(errors).length > 0) return { status: 'invalid', values, errors };

  if (turnstileSiteKey()) {
    const token = form.get('cf-turnstile-response');
    if (!(await verifyTurnstile(typeof token === 'string' ? token : '', ip))) {
      return { status: 'invalid', values, errors: {} };
    }
  }

  const sent = await send(values);
  return sent ? { status: 'success', values: emptyValues(), errors: {} } : { status: 'failed', values, errors: {} };
}
