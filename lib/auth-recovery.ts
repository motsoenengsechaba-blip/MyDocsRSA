import { apiRequest } from '@/lib/api';

/** Step 1: ask the server to email a 6-digit reset code. The server always answers the same, so it never reveals who has an account. */
export function requestPasswordReset(email: string) {
  return apiRequest<{ message?: string }>('/api/auth/forgot-password', {
    method: 'POST',
    body: { email: email.trim() },
    auth: false,
  });
}

/** Step 2: send the code from the email together with the new password. */
export function resetPassword(input: { email: string; code: string; newPassword: string }) {
  return apiRequest<{ message?: string }>('/api/auth/reset-password', {
    method: 'POST',
    body: { email: input.email.trim(), code: input.code.trim(), newPassword: input.newPassword },
    auth: false,
  });
}
