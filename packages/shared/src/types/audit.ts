export type AuditAction =
  | 'GATE_GRANT'
  | 'GATE_REVOCATION'
  | 'CLASS_C_EXPERT_VERIFICATION'
  | 'SOURCE_SUPERSEDED'
  | 'STALENESS_TRIGGERED';

export interface AuditLogEntry {
  id: string;
  workspaceId: string;
  actorId: string;
  action: AuditAction;
  targetType: 'gate' | 'competency' | 'attempt' | 'source';
  targetId: string;
  payload: Record<string, any>;
  createdAt: string;
}
