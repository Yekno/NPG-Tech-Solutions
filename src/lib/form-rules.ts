// Rules for every form on the site, with no server-only imports, so the same validation runs in
// the browser (instant inline errors) and on the server (the check that actually counts).

export const ENQUIRY_TYPES = [
  'Project / Service Enquiry',
  'Partnership',
  'Business Opportunity Scout',
  'Join Our Team',
  'General Enquiry',
] as const;

export const AVAILABILITY = ['Full-time', 'Part-time', 'Project-based'] as const;

/** Always offered in "Role Applied For", alongside whatever roles are open. */
export const GENERAL_INTEREST = 'General Expression of Interest';

export type FormId = 'contact' | 'application' | 'scout';
export type Values = Record<string, string>;
export type Errors = Record<string, string>;
/** Allowed values for dropdowns whose options aren't fixed (the open roles), by field name. */
export type Options = Record<string, readonly string[]>;

export interface FieldRule {
  /** Label used in the email. */
  label: string;
  /** Max length, mirrored as the maxlength attribute on the input. */
  max: number;
  /** Error shown when the field is empty; its presence makes the field required. */
  required?: string;
  format?: 'email' | 'url' | 'phone';
  /** Value used when the field is empty or missing (the country code defaults to Nigeria). */
  default?: string;
  /** Left out of the email (the country code is folded into the phone number). */
  inEmail?: false;
  /** Fixed dropdown options. */
  options?: readonly string[];
  /** Long text: goes in its own block at the end of the email. */
  multiline?: boolean;
}

export interface FormDef {
  fields: Record<string, FieldRule>;
  /** Name of the honeypot field: unique per form, and not a name browsers autofill. */
  honeypot: string;
  messages: { success: string; error: string };
}

const person: Record<'name' | 'email', FieldRule> = {
  name: { label: 'Full name', max: 120, required: 'Enter your full name.' },
  email: { label: 'Email', max: 254, required: 'Enter your email address.', format: 'email' },
};
// Phone: a country code dropdown plus the number. Its options (every country) come from
// countryOptions() in src/lib/phone.ts, which is server only; the server checks them.
const phoneCountry: FieldRule = { label: 'Country code', max: 2, default: 'NG', inEmail: false };
const optionalPhone: FieldRule = { label: 'Phone / WhatsApp', max: 40, format: 'phone' };
const requiredPhone: FieldRule = { ...optionalPhone, required: 'Enter your phone number.' };
export const PHONE_INVALID = 'Enter a valid phone number for the country selected.';

// Client and Scout enquiries are promised a reply. Applications are not: the page says placement
// isn't guaranteed, so the application form has its own success message.
const ENQUIRY_SUCCESS =
  'Thank you for contacting NPG Tech Solutions. Your enquiry has been submitted. Our team will review it and get back to you using the contact details provided.';
const APPLICATION_SUCCESS =
  'Thank you for your interest in NPG Tech Solutions. Your application has been submitted. We will be in touch if a suitable opportunity arises.';

// The email and telephone details are in the footer of every page (and beside the Contact form).
const errorMessage = (thing: 'enquiry' | 'application') =>
  `We could not submit your ${thing}. Please check the required fields and try again. If the problem continues, contact us through the email or telephone details listed on this page.`;

export const FORMS: Record<FormId, FormDef> = {
  contact: {
    honeypot: 'hp_field_x',
    messages: { success: ENQUIRY_SUCCESS, error: errorMessage('enquiry') },
    fields: {
      ...person,
      phoneCountry,
      phone: optionalPhone,
      organisation: { label: 'Organisation', max: 160 },
      enquiryType: { label: 'Enquiry type', max: 60, required: 'Choose an enquiry type.', options: ENQUIRY_TYPES },
      subject: { label: 'Subject', max: 160 },
      message: { label: 'Message', max: 5000, required: 'Tell us about your enquiry.', multiline: true },
    },
  },
  application: {
    honeypot: 'hp_field_y',
    messages: { success: APPLICATION_SUCCESS, error: errorMessage('application') },
    fields: {
      ...person,
      phoneCountry,
      phone: requiredPhone,
      // Options are the open roles plus GENERAL_INTEREST: see roleOptions() in src/lib/roles.ts.
      role: { label: 'Role applied for', max: 160, required: 'Choose a role.' },
      skills: {
        label: 'Skills and experience',
        max: 5000,
        required: 'Tell us about your skills and experience.',
        multiline: true,
      },
      link: { label: 'Portfolio, GitHub or LinkedIn', max: 500, format: 'url' },
      availability: { label: 'Availability', max: 40, required: 'Choose your availability.', options: AVAILABILITY },
      why: {
        label: 'Why they want to join NPG',
        max: 5000,
        required: 'Tell us why you want to join NPG.',
        multiline: true,
      },
    },
  },
  scout: {
    honeypot: 'hp_field_z',
    messages: { success: ENQUIRY_SUCCESS, error: errorMessage('enquiry') },
    fields: {
      ...person,
      phoneCountry,
      phone: requiredPhone,
      about: {
        label: 'About them and the opportunities they could refer',
        max: 5000,
        required: 'Tell us about yourself and the opportunities you could refer.',
        multiline: true,
      },
    },
  },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Full http(s) links only. */
const isWebLink = (s: string) => {
  try {
    const url = new URL(s);
    return (url.protocol === 'https:' || url.protocol === 'http:') && url.hostname.includes('.');
  } catch {
    return false;
  }
};

/**
 * Light phone check for instant feedback in the browser. The server then checks the number
 * properly for the selected country (libphonenumber-js, see src/lib/phone.ts).
 * Nigeria: drop one leading 0; a mobile number (starting 7, 8 or 9) must then be exactly 10 digits.
 * Anything else, and every other country: 7 to 15 digits. A number typed with its own +code is
 * left to the server.
 */
export function plausiblePhone(country: string, value: string): boolean {
  const plus = value.trim().startsWith('+');
  let digits = value.replace(/[\s\-()]/g, '').replace(/^\+/, '');
  if (!/^\d+$/.test(digits)) return false;
  if (country === 'NG' && !plus) {
    digits = digits.replace(/^0/, '');
    if (/^[789]/.test(digits)) return digits.length === 10;
  }
  return digits.length >= 7 && digits.length <= 15;
}

export const emptyValues = (id: FormId): Values =>
  Object.fromEntries(Object.entries(FORMS[id].fields).map(([name, rule]) => [name, rule.default ?? '']));

export function readValues(id: FormId, form: FormData): Values {
  const values = emptyValues(id);
  for (const name of Object.keys(values)) {
    const raw = form.get(name);
    const value = typeof raw === 'string' ? raw.trim() : '';
    if (value) values[name] = value;
  }
  return values;
}

export function validate(id: FormId, v: Values, dynamic: Options = {}): Errors {
  const errors: Errors = {};
  for (const [name, rule] of Object.entries(FORMS[id].fields)) {
    const value = v[name];
    const options = rule.options ?? dynamic[name];
    if (!value) {
      if (rule.required) errors[name] = rule.required;
    } else if (options && !options.includes(value)) {
      errors[name] = rule.required ?? 'Choose one of the options.';
    } else if (rule.format === 'email' && !EMAIL_RE.test(value)) {
      errors[name] = 'Enter a valid email address, like name@example.com.';
    } else if (rule.format === 'phone' && !plausiblePhone(v.phoneCountry, value)) {
      errors[name] = PHONE_INVALID;
    } else if (rule.format === 'url' && !isWebLink(value)) {
      errors[name] = 'Enter a full link, like https://example.com.';
    } else if (value.length > rule.max) {
      errors[name] = `Keep this under ${rule.max} characters.`;
    }
  }
  return errors;
}
