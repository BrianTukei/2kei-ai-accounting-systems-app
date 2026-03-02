/**
 * adminEmails.ts
 * ──────────────
 * Single source of truth for platform owner / admin emails.
 * Import this in every file that needs to check admin access,
 * so changes only need to happen in one place.
 */

/** Platform owner emails — always have admin access */
export const OWNER_EMAILS = [
  'tukeibrian5@gmail.com',
  'briantukei1000@gmail.com',
];

/** Check if an email is a platform owner */
export function isOwnerEmail(email: string): boolean {
  return OWNER_EMAILS.some(
    (e) => e.toLowerCase() === email.toLowerCase()
  );
}

/** Check if a user is an admin (owner check) */
export function isAdminUser(email: string): boolean {
  return isOwnerEmail(email);
}
