export type PasswordRule = { id: string; label: string; ok: boolean };

export type PasswordCheck = {
  rules: PasswordRule[];
  score: number; // how many rules pass (0-6)
  strength: 'Too weak' | 'Weak' | 'Fair' | 'Strong';
  valid: boolean; // every rule passes
};

const COMMON = ['password', 'passw0rd', '12345678', '123456789', 'qwerty', 'iloveyou', 'letmein', 'welcome', 'admin123', 'abc123'];

/**
 * The password policy used on Create account and Reset password.
 * Keep the backend rules at least this strict (see UPGRADE_GUIDE.md).
 */
export function checkPassword(password: string, who?: { email?: string; name?: string }): PasswordCheck {
  const lower = password.toLowerCase();
  const emailName = who?.email?.split('@')[0]?.toLowerCase() ?? '';
  const nameParts = (who?.name ?? '')
    .toLowerCase()
    .split(/\s+/)
    .filter((p) => p.length >= 3);

  const containsPersonal =
    (emailName.length >= 3 && lower.includes(emailName)) || nameParts.some((p) => lower.includes(p));

  const rules: PasswordRule[] = [
    { id: 'length', label: 'At least 10 characters, at most 72 UTF-8 bytes', ok: password.length >= 10 && Array.from(password).reduce((bytes, char) => { const cp = char.codePointAt(0) ?? 0; return bytes + (cp <= 0x7f ? 1 : cp <= 0x7ff ? 2 : cp <= 0xffff ? 3 : 4); }, 0) <= 72 },
    { id: 'case', label: 'Upper and lower case letters', ok: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { id: 'number', label: 'At least one number', ok: /\d/.test(password) },
    { id: 'symbol', label: 'At least one symbol (! @ # ? ...)', ok: /[^A-Za-z0-9]/.test(password) },
    { id: 'common', label: 'Not a common password', ok: password.length > 0 && !COMMON.some((c) => lower.includes(c)) },
    { id: 'personal', label: 'Does not contain your name or email', ok: password.length > 0 && !containsPersonal },
  ];

  const score = rules.filter((r) => r.ok).length;
  const valid = score === rules.length;
  const strength = valid ? 'Strong' : score >= 5 ? 'Fair' : score >= 3 ? 'Weak' : 'Too weak';

  return { rules, score, strength, valid };
}
