/**
 * Email utility functions
 */

/**
 * Extract domain from email address
 */
export function extractDomain(email: string): string | null {
  const match = email.match(/@([^@]+)$/);
  return match ? match[1].toLowerCase() : null;
}

/**
 * Check if email domain matches company domain
 */
export function isInternalEmail(email: string, companyDomain: string): boolean {
  const domain = extractDomain(email);
  return domain === companyDomain.toLowerCase();
}

/**
 * Check if email is external (not from company domain)
 */
export function isExternalEmail(email: string, companyDomain: string): boolean {
  return !isInternalEmail(email, companyDomain);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Filter external attendees from a list of emails
 */
export function filterExternalEmails(emails: string[], companyDomain: string): string[] {
  return emails.filter((email) => isExternalEmail(email, companyDomain));
}

/**
 * Normalize email address (lowercase, trim)
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
