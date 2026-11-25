// Open roles, from src/content/roles/. Add a YAML file there and it appears on the Join Our Team
// page and in the application form's dropdown after the next deploy.
import { getCollection } from 'astro:content';
import { GENERAL_INTEREST } from './form-rules';

export async function openRoles() {
  const roles = await getCollection('roles', ({ data }) => data.open);
  return roles.sort((a, b) => a.data.title.localeCompare(b.data.title));
}

export async function roleOptions(): Promise<string[]> {
  return [...(await openRoles()).map((r) => r.data.title), GENERAL_INTEREST];
}
