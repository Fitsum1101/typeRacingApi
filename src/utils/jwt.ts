import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export interface AuthTokenPayload extends JwtPayload {
  id: string;
  role: string;
}

type TokenPayload = Pick<AuthTokenPayload, "id" | "role">;

function signToken(
  payload: TokenPayload,
  secret: string,
  expiresIn: string,
): string {
  return jwt.sign(payload, secret, {
    expiresIn: expiresIn as SignOptions["expiresIn"],
  });
}

// 1. Create an access token
export function generateAccessToken(payload: TokenPayload): string {
  return signToken(payload, env.jwtAccessSecret, env.jwtAccessExpiresIn);
}

// 2. Create a refresh token
export function generateRefreshToken(payload: TokenPayload): string {
  return signToken(payload, env.jwtRefreshSecret, env.jwtRefreshExpiresIn);
}

// 3. Verify an access token
export function verifyAccessToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, env.jwtAccessSecret);

  if (
    typeof decoded === "string" ||
    typeof decoded.id !== "string" ||
    typeof decoded.role !== "string"
  ) {
    throw new Error("Invalid access token payload");
  }

  return decoded as AuthTokenPayload;
}

// 4. Verify a refresh token
export function verifyRefreshToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, env.jwtRefreshSecret);

  if (
    typeof decoded === "string" ||
    typeof decoded.id !== "string" ||
    typeof decoded.role !== "string"
  ) {
    throw new Error("Invalid refresh token payload");
  }

  return decoded as AuthTokenPayload;
}

// 5. Decode a token without verifying its signature
export function decodeToken(token: string) {
  return jwt.decode(token);
}

// 6. Extract a Bearer token from the Authorization header
export function extractBearerToken(authorization?: string): string | null {
  if (!authorization) return null;

  const match = authorization.match(/^Bearer\s+(\S+)$/i);

  return match?.[1] ?? null;
}
