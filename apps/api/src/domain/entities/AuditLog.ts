import type { AuditLogEntry, AuditAction } from '@flashlearn/shared';

export interface AuditLogProps {
  id: string;
  workspaceId: string;
  actorId: string;
  action: AuditAction;
  targetType: 'gate' | 'competency' | 'attempt' | 'source' | 'content';
  targetId: string;
  payload: Record<string, any>;
  createdAt?: Date;
}

export class AuditLogEntity implements AuditLogEntry {
  readonly id: string;
  readonly workspaceId: string;
  readonly actorId: string;
  readonly action: AuditAction;
  readonly targetType: 'gate' | 'competency' | 'attempt' | 'source' | 'content';
  readonly targetId: string;
  readonly payload: Record<string, any>;
  readonly createdAt: string;

  constructor(props: AuditLogProps) {
    this.id = props.id;
    this.workspaceId = props.workspaceId;
    this.actorId = props.actorId;
    this.action = props.action;
    this.targetType = props.targetType;
    this.targetId = props.targetId;
    this.payload = props.payload;
    this.createdAt = (props.createdAt || new Date()).toISOString();
  }
}
