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
  format?: 'email' | 'url';
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
const requiredPhone: FieldRule = { label: 'Phone', max: 40, required: 'Enter your phone number.' };

// Same wording on every form; only the noun changes.
const messages = (thing: 'enquiry' | 'application') => ({
  success: `Thank you for contacting NPG Tech Solutions. Your ${thing} has been submitted. Our team will review it and get back to you using the contact details provided.`,
  error: `We could not submit your ${thing}. Please check the required fields and try again. If the problem continues, contact us through the email or telephone details listed on this page.`,
});

export const FORMS: Record<FormId, FormDef> = {
  contact: {
    honeypot: 'hp_field_x',
    messages: messages('enquiry'),
    fields: {
      ...person,
      phone: { label: 'Phone', max: 40 },
      organisation: { label: 'Organisation', max: 160 },
      enquiryType: { label: 'Enquiry type', max: 60, required: 'Choose an enquiry type.', options: ENQUIRY_TYPES },
      subject: { label: 'Subject', max: 160 },
      message: { label: 'Message', max: 5000, required: 'Tell us about your enquiry.', multiline: true },
    },
  },
  application: {
    honeypot: 'hp_field_y',
    messages: messages('application'),
    fields: {
      ...person,
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
    messages: messages('enquiry'),
    fields: {
      ...person,
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

export const emptyValues = (id: FormId): Values =>
  Object.fromEntries(Object.keys(FORMS[id].fields).map((name) => [name, '']));

export function readValues(id: FormId, form: FormData): Values {
  const values = emptyValues(id);
  for (const name of Object.keys(values)) {
    const raw = form.get(name);
    values[name] = typeof raw === 'string' ? raw.trim() : '';
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
    } else if (rule.format === 'url' && !isWebLink(value)) {
      errors[name] = 'Enter a full link, like https://example.com.';
    } else if (value.length > rule.max) {
      errors[name] = `Keep this under ${rule.max} characters.`;
    }
  }
  return errors;
}
