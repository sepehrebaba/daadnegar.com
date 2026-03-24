/** دامنهٔ داخلی برای ذخیرهٔ ایمیل سازگار با Better Auth (به کاربر نشان داده نمی‌شود). */
export const USERNAME_INTERNAL_EMAIL_DOMAIN = "u.daadnegar.internal";

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

/** حذف فاصلهٔ نامرئی رایج در کپی/پیست که باعث عدم تطابق نام کاربری در ورود می‌شود. */
export function sanitizeLoginIdentifier(raw: string): string {
  return normalizeUsername(raw).replace(/[\u200b-\u200d\ufeff]/g, "");
}

/** نام کاربری عمومی ثبت‌نام/ورود: ۳ تا ۳۲ کاراکتر، حروف کوچک انگلیسی، عدد و زیرخط. پیشوند dn_ برای کدهای دعوت سیستم رزرو است. */
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
