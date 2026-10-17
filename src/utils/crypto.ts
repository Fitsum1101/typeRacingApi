import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Hash a refresh token before storing it in the database.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function hashesMatch(
  receivedToken: string,
  storedHash: string,
): boolean {
  const receivedHash = Buffer.from(hashToken(receivedToken), "hex");
  const expectedHash = Buffer.from(storedHash, "hex");

  return (
    receivedHash.length === expectedHash.length &&
    timingSafeEqual(receivedHash, expectedHash)
  );
}

/**
 * Compare a presented token against its stored hash.
 */
export function verifyTokenHash(token: string, storedHash: string): boolean {
  if (!/^[a-f0-9]{64}$/i.test(storedHash)) {
    return false;
  }

  const actualHash = Buffer.from(hashToken(token), "hex");
  const expectedHash = Buffer.from(storedHash, "hex");

  return (
    actualHash.length === expectedHash.length &&
    timingSafeEqual(actualHash, expectedHash)
  );
}
