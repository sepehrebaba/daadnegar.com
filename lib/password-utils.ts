/** Password security rules */
export const PASSWORD_RULES = {
  minLength: 8,
  hasUppercase: /[A-Z]/.test.bind(/[A-Z]/),
  hasLowercase: /[a-z]/.test.bind(/[a-z]/),
  hasNumber: /[0-9]/.test.bind(/[0-9]/),
  hasSpecial: /[$@#!%*?&#^()[\]{}_\-+=.,:;]/.test.bind(/[$@#!%*?&#^()[\]{}_\-+=.,:;]/),
} as const;

export type PasswordCheck = {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
};

export function checkPassword(password: string): PasswordCheck {
  return {
    minLength: password.length >= PASSWORD_RULES.minLength,
    hasUppercase: PASSWORD_RULES.hasUppercase(password),
    hasLowercase: PASSWORD_RULES.hasLowercase(password),
    hasNumber: PASSWORD_RULES.hasNumber(password),
    hasSpecial: PASSWORD_RULES.hasSpecial(password),
  };
}

export function isPasswordSecure(password: string): boolean {
  const c = checkPassword(password);
  return c.minLength && c.hasUppercase && c.hasLowercase && c.hasNumber && c.hasSpecial;
}

export function getPasswordStrength(password: string): number {
  if (!password) return 0;
  const c = checkPassword(password);
  let score = 0;
  if (c.minLength) score += 20;
  if (c.hasUppercase) score += 20;
  if (c.hasLowercase) score += 20;
  if (c.hasNumber) score += 20;
  if (c.hasSpecial) score += 20;
  return score;
}

const SPECIAL_CHARS = "!@#$%^&*()_+-=[]{}|;:,.<>?";

function secureRandomIndex(maxExclusive: number): number {
  if (maxExclusive <= 0) throw new Error("maxExclusive must be greater than 0");
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error("Secure random generator is not available in this environment.");
  }

  const maxUint32 = 0x100000000;
  const limit = Math.floor(maxUint32 / maxExclusive) * maxExclusive;
  const random = new Uint32Array(1);

  do {
    globalThis.crypto.getRandomValues(random);
  } while (random[0]! >= limit);

  return random[0]! % maxExclusive;
}

/** Generate a strong random password that satisfies all security rules */
export function generateRandomPassword(length = 16): string {
  const targetLength = Math.max(length, 4);
  const parts: string[] = [];
  parts.push(String.fromCharCode(65 + secureRandomIndex(26))); // A-Z
  parts.push(String.fromCharCode(97 + secureRandomIndex(26))); // a-z
  parts.push(String.fromCharCode(48 + secureRandomIndex(10))); // 0-9
  parts.push(SPECIAL_CHARS[secureRandomIndex(SPECIAL_CHARS.length)]!);
  const rest = targetLength - 4;
  const allChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789" + SPECIAL_CHARS;
  for (let i = 0; i < rest; i++) {
    parts.push(allChars[secureRandomIndex(allChars.length)]!);
  }

  // Fisher-Yates shuffle using CSPRNG indices.
  for (let i = parts.length - 1; i > 0; i--) {
    const j = secureRandomIndex(i + 1);
    [parts[i], parts[j]] = [parts[j]!, parts[i]!];
  }

  return parts.join("");
}
