import { fetchWithAuth } from './core';
import type { AuditLogEntry, AuditComplianceBundle } from '@flashlearn/shared';

export const auditApi = {
  listLogs: (workspaceId: string, limit = 50): Promise<AuditLogEntry[]> =>
    fetchWithAuth(`/api/v1/audit/logs?workspaceId=${workspaceId}&limit=${limit}`),
  exportBundle: (workspaceId: string): Promise<AuditComplianceBundle> =>
    fetchWithAuth(`/api/v1/audit/bundle?workspaceId=${workspaceId}`),
};
