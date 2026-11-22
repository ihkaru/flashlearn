import { container } from '../../di/container';
import type { User, UserRole } from '@flashlearn/shared';

export interface AuthContext {
  user: User | null;
  role: UserRole;
  isApiKey: boolean;
  permissions?: string[];
}

export async function resolveAuth(headers: Record<string, string | undefined>): Promise<AuthContext> {
  const authHeader = headers['authorization'] || headers['Authorization'];
  const apiKeyHeader = headers['x-api-key'] || headers['X-Api-Key'];

  if (apiKeyHeader && apiKeyHeader.trim().startsWith('fl_live_')) {
    const verified = await container.verifyApiKeyUseCase.execute(apiKeyHeader.trim());
    if (verified) {
      return {
        user: verified.user,
        role: verified.user.role,
        isApiKey: true,
        permissions: verified.permissions,
      };
    }
    return { user: null, role: 'guest', isApiKey: false };
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, role: 'guest', isApiKey: false };
  }

  const token = authHeader.slice(7).trim();

  // 1. Check if token is an API Key: fl_live_...
  if (token.startsWith('fl_live_')) {
    const verified = await container.verifyApiKeyUseCase.execute(token);
    if (verified) {
      return {
        user: verified.user,
        role: verified.user.role,
        isApiKey: true,
        permissions: verified.permissions,
      };
    }
    return { user: null, role: 'guest', isApiKey: false };
  }

  // 2. Check if token is a standard user JWT
  const payload = container.tokenService.verifyToken(token);
  if (payload) {
    const user = await container.getCurrentUserUseCase.execute(payload.userId);
    if (user) {
      return {
        user,
        role: user.role,
        isApiKey: false,
      };
    }
  }

  return { user: null, role: 'guest', isApiKey: false };
}
