/** Internal email domain for Better Auth compatibility (not shown to users). */
export const USERNAME_INTERNAL_EMAIL_DOMAIN = "u.daadnegar.internal";

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Strip common invisible spaces from copy/paste that break username matching on login. */
export function sanitizeLoginIdentifier(raw: string): string {
  return normalizeUsername(raw).replace(/[\u200b-\u200d\ufeff]/g, "");
}

/** Public signup/login username: 3–32 chars, lowercase English, digits, underscore. Prefix dn_ is reserved for system invite codes. */
export function isValidPublicUsername(normalized: string): boolean {
  if (normalized.startsWith("dn_")) return false;
  return /^[a-z0-9][a-z0-9_]{2,31}$/.test(normalized);
}

export function usernameToInternalEmail(username: string): string {
  const n = normalizeUsername(username);
  return `${n}@${USERNAME_INTERNAL_EMAIL_DOMAIN}`;
}

export function isInternalAuthEmail(email: string): boolean {
  return email.endsWith(`@${USERNAME_INTERNAL_EMAIL_DOMAIN}`) || email.endsWith("@daadnegar.local");
}
