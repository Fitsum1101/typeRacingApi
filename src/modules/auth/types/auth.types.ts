import { AuthenticatedUser } from "../../../types/auth";

export interface LoginInput {
  emailOrUsername: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: AuthenticatedUser;
  tokens: AuthTokens;
}
