import { fetchWithAuth } from './core';
import type { ApiKeyItem, CreateApiKeyRequest, CreateApiKeyResponse } from '@flashlearn/shared';

export const apiKeyApi = {
  list: (): Promise<ApiKeyItem[]> =>
    fetchWithAuth('/api/v1/api-keys'),
  create: (data: CreateApiKeyRequest): Promise<CreateApiKeyResponse> =>
    fetchWithAuth('/api/v1/api-keys', { method: 'POST', body: JSON.stringify(data) }),
  revoke: (id: string): Promise<{ success: boolean }> =>
    fetchWithAuth(`/api/v1/api-keys/${id}`, { method: 'DELETE' }),
};
