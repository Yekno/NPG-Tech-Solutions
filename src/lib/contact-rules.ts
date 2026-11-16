// Contact form rules with no server-only imports, so the same validation runs in the browser
// (instant inline errors) and on the server (the check that actually counts).

export const ENQUIRY_TYPES = [
  'Project / Service Enquiry',
  'Partnership',
  'Business Opportunity Scout',
  'Join Our Team',
  'General Enquiry',
] as const;

export type FieldName = 'name' | 'email' | 'phone' | 'organisation' | 'enquiryType' | 'subject' | 'message';
export type Values = Record<FieldName, string>;
export type Errors = Partial<Record<FieldName, string>>;

export const FIELDS: FieldName[] = ['name', 'email', 'phone', 'organisation', 'enquiryType', 'subject', 'message'];

/** Max lengths, mirrored as maxlength attributes on the inputs. */
export const LIMITS: Record<FieldName, number> = {
  name: 120,
  email: 254,
  phone: 40,
  organisation: 160,
  enquiryType: 60,
  subject: 160,
  message: 5000,
};

/** Name of the honeypot field. Deliberately not a name browsers autofill. */
export const HONEYPOT = 'hp_field_x';

export const MESSAGES = {
  success:
    'Thank you for contacting NPG Tech Solutions. Your enquiry has been submitted. Our team will review it and get back to you using the contact details provided.',
  error:
    'We could not submit your enquiry. Please check the required fields and try again. If the problem continues, contact us through the email or telephone details listed on this page.',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const emptyValues = (): Values => ({
  name: '',
  email: '',
  phone: '',
  organisation: '',
  enquiryType: '',
  subject: '',
  message: '',
});

export function readValues(form: FormData): Values {
  const values = emptyValues();
  for (const key of FIELDS) {
    const raw = form.get(key);
    values[key] = typeof raw === 'string' ? raw.trim() : '';
  }
  return values;
}

export function validate(v: Values): Errors {
  const errors: Errors = {};
  if (!v.name) errors.name = 'Enter your full name.';
  if (!v.email) errors.email = 'Enter your email address.';
  else if (!EMAIL_RE.test(v.email)) errors.email = 'Enter a valid email address, like name@example.com.';
  if (!(ENQUIRY_TYPES as readonly string[]).includes(v.enquiryType)) errors.enquiryType = 'Choose an enquiry type.';
  if (!v.message) errors.message = 'Tell us about your enquiry.';
  for (const key of FIELDS) {
    if (!errors[key] && v[key].length > LIMITS[key]) {
      errors[key] = `Keep this under ${LIMITS[key]} characters.`;
    }
  }
  return errors;
}
