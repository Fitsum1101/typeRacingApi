import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../../../generated/prisma/client";
import { ApiError } from "../../../utils/apiError";
import { prisma } from "../../../config/db";

const SALT_ROUNDS = 12;

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  avatar?: string;
}

export interface LoginInput {
  emailOrUsername: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  // refreshToken?: string; // add later if you want refresh tokens
}

export interface AuthResponse {
  user: Omit<User, "passwordHash">;
  tokens: AuthTokens;
}

export class AuthService {
  /**
   * Register a new user + create empty UserStats
   */
  static async register(input: RegisterInput): Promise<AuthResponse> {
    const { username, email, password, avatar } = input;

    // Basic validation
    if (!username?.trim() || !email?.trim() || !password) {
      throw ApiError.badRequest("Username, email and password are required");
    }

    if (password.length < 6) {
      throw ApiError.badRequest("Password must be at least 6 characters");
    }

    // Check if username or email already exists
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username.toLowerCase() },
          { email: email.toLowerCase() },
        ],
      },
    });

    if (existing) {
      if (existing.username === username.toLowerCase()) {
        throw ApiError.conflict("Username is already taken");
      }
      throw ApiError.conflict("Email is already registered");
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user + stats in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          username: username.toLowerCase(),
          email: email.toLowerCase(),
          passwordHash,
          avatar: avatar || null,
        },
      });

      await tx.userStats.create({
        data: {
          userId: newUser.id,
        },
      });

      return newUser;
    });

    const tokens = this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  /**
   * Login with email OR username
   */
  static async login(input: LoginInput): Promise<AuthResponse> {
    const { emailOrUsername, password } = input;

    if (!emailOrUsername?.trim() || !password) {
      throw ApiError.badRequest("Email/username and password are required");
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrUsername.toLowerCase() },
          { username: emailOrUsername.toLowerCase() },
        ],
      },
    });

    if (!user) {
      throw ApiError.unauthorized("Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw ApiError.unauthorized("Invalid credentials");
    }

    const tokens = this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  /**
   * Get current authenticated user (for /me route)
   */
  static async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        stats: true, // include UserStats
      },
    });

    if (!user) {
      throw ApiError.notFound("User not found");
    }

    return this.sanitizeUser(user);
  }

  // ────────────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────────────

  private static generateTokens(user: User): AuthTokens {
    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
    };

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is not configured");
    }

    const expiresIn = (process.env.JWT_EXPIRES_IN ||
      "7d") as jwt.SignOptions["expiresIn"];

    const accessToken = jwt.sign(payload, secret, {
      expiresIn,
    });

    return { accessToken };
  }

  private static sanitizeUser(user: any) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
