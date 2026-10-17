/**
 * Normalize an email address for consistent lookup.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Normalize a username for consistent lookup.
 */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

/**
 * Remove leading/trailing whitespace and collapse
 * repeated internal whitespace into a single space.
 */
export function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

/**
 * Normalize a login identifier that can be an email
 * or username.
 */
export function normalizeIdentifier(value: string): string {
  return value.trim().toLowerCase();
}
