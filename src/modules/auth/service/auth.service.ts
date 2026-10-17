import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";
import { User } from "../../../generated/prisma/client";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../../utils/jwt";
import { prisma } from "../../../config/db";
import { LoginInput, RegisterInput } from "../validation/auth.validation";
import { ApiError } from "../../../utils/apiError";
import { AuthResponse, AuthTokens } from "../types/auth.types";
import { normalizeEmail, normalizeUsername } from "../../../utils/normalize";
import { hashesMatch, hashToken } from "../../../utils/crypto";

const SALT_ROUNDS = 10;

// Never return a password hash to the client.
function sanitizeUser<T extends { passwordHash: string }>(
  user: T,
): Omit<T, "passwordHash"> {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

function getTokenExpiryDate(exp: number | undefined): Date {
  if (!exp) {
    throw new Error("Refresh token has no expiration claim");
  }

  return new Date(exp * 1000);
}

// Create a database-backed session and its tokens.
async function createAuthSession(user: User): Promise<AuthTokens> {
  const sessionId = randomUUID();

  const accessToken = generateAccessToken({
    id: user.id,
    username: user.username,
  });

  const refreshToken = generateRefreshToken({
    id: user.id,
    sessionId,
  });

  const decoded = verifyRefreshToken(refreshToken);

  await prisma.authSession.create({
    data: {
      id: sessionId,
      userId: user.id,
      refreshTokenHash: hashToken(refreshToken),
      expiresAt: getTokenExpiryDate(decoded.exp),
    },
  });

  return { accessToken, refreshToken };
}

// 1. Register a user and initialize their statistics.
export async function registerUser(
  input: RegisterInput,
): Promise<AuthResponse> {
  const username = normalizeUsername(input.username ?? "");
  const email = normalizeEmail(input.email ?? "");
  const { password, avatar } = input;

  if (!username || !email || !password) {
    throw ApiError.badRequest("Username, email and password are required");
  }

  if (password.length < 6) {
    throw ApiError.badRequest("Password must be at least 6 characters");
  }

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { email }],
    },
    select: {
      username: true,
      email: true,
    },
  });

  if (existing) {
    if (existing.username === username) {
      throw ApiError.conflict("Username is already taken");
    }

    throw ApiError.conflict("Email is already registered");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.$transaction(async (tx) => {
    return tx.user.create({
      data: {
        username,
        email,
        passwordHash,
        avatar: avatar?.trim() || null,
        stats: {
          create: {},
        },
      },
    });
  });

  const tokens = await createAuthSession(user);

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
    },
    tokens,
  };
}

// 2. Login with email or username.
export async function loginUser(input: LoginInput): Promise<AuthResponse> {
  const identifier = input.emailOrUsername?.trim().toLowerCase();
  const { password } = input;

  if (!identifier || !password) {
    throw ApiError.badRequest("Email/username and password are required");
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { username: identifier }],
    },
  });

  if (!user) {
    throw ApiError.unauthorized("Invalid credentials");
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    throw ApiError.unauthorized("Invalid credentials");
  }

  if (!user.isActive) {
    throw ApiError.forbidden("Account is disabled");
  }

  const tokens = await createAuthSession(user);

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
    },
    tokens,
  };
}

// 3. Get the current authenticated user and game statistics.
export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { stats: true },
  });

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  if (!user.isActive) {
    throw ApiError.forbidden("Account is disabled");
  }

  return sanitizeUser(user);
}

// 4. Rotate the refresh token and issue a new access token.
export async function refreshTokens(refreshToken: string): Promise<AuthTokens> {
  if (!refreshToken) {
    throw ApiError.unauthorized("Refresh token is required");
  }

  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  const session = await prisma.authSession.findUnique({
    where: { id: payload.sessionId },
  });

  if (
    !session ||
    session.userId !== payload.id ||
    session.revokedAt ||
    session.expiresAt <= new Date() ||
    !session.refreshTokenHash ||
    !hashesMatch(refreshToken, session.refreshTokenHash)
  ) {
    throw ApiError.unauthorized("Refresh session is invalid or expired");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!user || !user.isActive) {
    throw ApiError.unauthorized("User is unavailable");
  }

  const newRefreshToken = generateRefreshToken({
    id: user.id,
    sessionId: session.id,
  });

  const newPayload = verifyRefreshToken(newRefreshToken);

  // Atomic compare-and-swap: prevents reuse of the same refresh token
  // from successfully rotating the same session twice.
  const result = await prisma.authSession.updateMany({
    where: {
      id: session.id,
      userId: user.id,
      refreshTokenHash: session.refreshTokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: {
      refreshTokenHash: hashToken(newRefreshToken),
      expiresAt: getTokenExpiryDate(newPayload.exp),
    },
  });

  if (result.count !== 1) {
    throw ApiError.unauthorized(
      "Refresh token has already been used or revoked",
    );
  }

  const accessToken = generateAccessToken({
    id: user.id,
    username: user.username,
  });

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
}

// 5. Revoke a session during logout.
export async function logoutUser(refreshToken: string): Promise<void> {
  if (!refreshToken) {
    throw ApiError.badRequest("Refresh token is required");
  }

  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  const session = await prisma.authSession.findUnique({
    where: { id: payload.sessionId },
  });

  if (
    !session ||
    session.userId !== payload.id ||
    session.revokedAt ||
    !session.refreshTokenHash ||
    !hashesMatch(refreshToken, session.refreshTokenHash)
  ) {
    throw ApiError.unauthorized("Refresh session is invalid");
  }

  await prisma.authSession.updateMany({
    where: {
      id: session.id,
      userId: payload.id,
      refreshTokenHash: session.refreshTokenHash,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
      refreshTokenHash: null,
    },
  });
}
