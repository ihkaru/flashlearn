export type UserRole = 'superadmin' | 'creator' | 'guest';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKeyItem {
  id: string;
  userId: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface CreateApiKeyResponse {
  key: string; // Secret fl_live_... (Shown only once)
  apiKey: ApiKeyItem;
}

export interface CreateApiKeyRequest {
  name: string;
  permissions?: string[];
  expiresInDays?: number;
}

export interface GoogleAuthRequest {
  credential: string; // Google Identity Services JWT ID Token
}

export interface AuthSessionResponse {
  token: string;
  user: User;
}
