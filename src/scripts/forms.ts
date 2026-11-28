// Progressive enhancement for every form on the site (see EnquiryForm.astro). The forms already
// work as plain POSTs. With JavaScript, validate inline with the same rules as the server, submit
// via fetch to the form's JSON endpoint and show the result in place.
import { FORMS, readValues, validate, type Errors, type FailReason, type FormId } from '../lib/form-rules';

declare global {
  interface Window {
    turnstile?: { reset: (el?: Element | string) => void };
  }
}

type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function enhance(form: HTMLFormElement) {
  const id = form.dataset.form as FormId;
  const def = FORMS[id];
  const status = document.getElementById(`${id}-status`);
  if (!def || !status) return;

  form.noValidate = true; // our inline errors replace the browser's bubbles
  const fields = Object.keys(def.fields);
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const label = button.querySelector<HTMLElement>('.form__label')!;
  const buttonText = label.textContent;

  const fieldEl = (name: string) => form.querySelector<Control>(`[name="${name}"]`);

  const setError = (name: string, message?: string) => {
    const el = fieldEl(name);
    const err = document.getElementById(`${id}-${name}-error`);
    if (!el || !err) return;
    // Fields with a permanent hint keep it in aria-describedby next to the error.
    const describedBy = [el.dataset.hint, message && err.id].filter(Boolean).join(' ');
    err.textContent = message ?? '';
    err.hidden = !message;
    if (message) el.setAttribute('aria-invalid', 'true');
    else el.removeAttribute('aria-invalid');
    if (describedBy) el.setAttribute('aria-describedby', describedBy);
    else el.removeAttribute('aria-describedby');
  };

  const showErrors = (errors: Errors) => fields.forEach((name) => setError(name, errors[name]));

  const showStatus = (kind: 'success' | FailReason) => {
    const parts = [def.messages[kind]].flat().map((part) => {
      if (typeof part === 'string') return part;
      const a = document.createElement('a');
      a.href = part.href;
      a.textContent = part.text;
      return a;
    });
    status.replaceChildren(...parts);
    status.className = `form-status form-status--${kind === 'success' ? 'success' : 'error'}`;
    status.hidden = false;
  };

  const focusFirstInvalid = (errors: Errors) => {
    const first = fields.find((name) => errors[name]);
    if (first) fieldEl(first)?.focus();
    else status.focus();
  };

  // Clear a field's error as soon as it's corrected.
  form.addEventListener('input', (e) => {
    const target = e.target as Control;
    if (target.name && target.getAttribute('aria-invalid') === 'true') {
      setError(target.name, validate(id, readValues(id, new FormData(form)))[target.name]);
    }
  });

  // Phone: check as soon as the visitor leaves the number (once something is typed), and again
  // if they change the country code after typing it.
  const checkPhone = () => {
    if (fieldEl('phone')?.value.trim()) setError('phone', validate(id, readValues(id, new FormData(form))).phone);
  };
  fieldEl('phone')?.addEventListener('blur', checkPhone);
  fieldEl('phoneCountry')?.addEventListener('change', checkPhone);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const errors = validate(id, readValues(id, data));
    showErrors(errors);
    if (Object.keys(errors).length > 0) {
      showStatus('invalid');
      focusFirstInvalid(errors);
      return;
    }

    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    label.textContent = 'Sending…';
    try {
      const res = await fetch(`/api/${id}`, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      const json = (await res.json()) as { status: string; reason?: FailReason; errors?: Errors };
      if (json.status === 'success') {
        form.reset();
        showErrors({});
        showStatus('success');
        status.focus();
      } else {
        // Keep everything the user typed. Only 'invalid' comes with field errors.
        const reason = json.reason === 'invalid' ? 'invalid' : 'send';
        const errs = reason === 'invalid' ? (json.errors ?? {}) : {};
        showErrors(errs);
        showStatus(reason);
        focusFirstInvalid(errs);
      }
    } catch {
      // Network error, or a response that wasn't our JSON: the fields were fine.
      showErrors({});
      showStatus('send');
      status.focus();
    } finally {
      button.disabled = false;
      button.removeAttribute('aria-busy');
      label.textContent = buttonText;
      // Turnstile tokens are single-use: get a fresh one for this form's next attempt.
      const widget = form.querySelector('.cf-turnstile');
      if (widget) window.turnstile?.reset(widget);
    }
  });
}

document.querySelectorAll<HTMLFormElement>('form[data-form]').forEach(enhance);
