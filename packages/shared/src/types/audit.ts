export type AuditAction =
  | 'GATE_GRANT'
  | 'GATE_REVOCATION'
  | 'CLASS_C_EXPERT_VERIFICATION'
  | 'SOURCE_SUPERSEDED'
  | 'STALENESS_TRIGGERED'
  | 'ORACLE_EVALUATED'
  | 'CONTENT_GENERATED';

export interface AuditLogEntry {
  id: string;
  workspaceId: string;
  actorId: string;
  action: AuditAction;
  targetType: 'gate' | 'competency' | 'attempt' | 'source' | 'content';
  targetId: string;
  payload: Record<string, any>;
  createdAt: string;
}

export interface AuditComplianceBundle {
  workspaceId: string;
  workspaceName: string;
  exportedAt: string;
  totalLogs: number;
  bundleSignature: string;
  sources: Array<{ code: string; version: string; status: string; totalChunks: number }>;
  gateGrants: Array<{ userId: string; gateLevel: number; status: string; grantedAt: string }>;
  logs: AuditLogEntry[];
}
