// Phone numbers, server side only: libphonenumber-js is never shipped to the browser (the browser
// gets the light check in form-rules.ts). The full ("max") metadata is used so numbers of the right
// length that can't exist are still rejected.
import { getCountries, getCountryCallingCode, parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js/max';

const FIRST: CountryCode[] = ['NG', 'GH', 'GB', 'US'];
const names = new Intl.DisplayNames(['en'], { type: 'region' });
const COUNTRIES = new Set<string>(getCountries());

/** Country calling code dropdown: Nigeria, Ghana, UK and US first, then every other country A–Z. */
export const countryOptions = (() => {
  const option = (code: CountryCode) => ({ value: code, label: `${names.of(code) ?? code} (+${getCountryCallingCode(code)})` });
  const rest = getCountries()
    .filter((c) => !FIRST.includes(c))
    .map(option)
    .sort((a, b) => a.label.localeCompare(b.label, 'en'));
  return [...FIRST.map(option), ...rest];
})();

export const countryCodes: readonly string[] = [...COUNTRIES];

/** International format (+2348012345678) if the number is valid for the country, otherwise null.
 *  Local formats work: with NG, "0801 234 5678" and "801 234 5678" are the same number. */
export function normalisePhone(country: string, raw: string): string | null {
  if (!COUNTRIES.has(country)) return null;
  const phone = parsePhoneNumberFromString(raw, country as CountryCode);
  return phone?.isValid() ? phone.number : null;
}

/** For the email: readable number (+234 801 234 5678) and a WhatsApp link (https://wa.me/2348012345678). */
export function phoneForEmail(e164: string): { display: string; whatsapp: string } {
  const phone = parsePhoneNumberFromString(e164);
  return { display: phone?.formatInternational() ?? e164, whatsapp: `https://wa.me/${e164.replace(/\D/g, '')}` };
}
