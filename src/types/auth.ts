export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  avatar: string | null;
}

export interface AccessTokenPayload {
  id: string;
  username: string;
}

export interface RefreshTokenPayload {
  id: string;
  sessionId: string;
}
