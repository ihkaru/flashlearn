import type { UserGateGrant, GateGrantStatus, GateLevel } from '@flashlearn/shared';

export interface UserGateGrantProps {
  id: string;
  userId: string;
  gateId: string;
  status: GateGrantStatus;
  grantedAt?: Date;
  grantedBy: string;
  revokedAt?: Date | null;
  revocationReason?: string | null;
  evidenceSnapshot: {
    gateLevel: GateLevel;
    verifiedCompetencyIds: string[];
    timestamp: string;
    evaluatorNotes?: string;
  };
}

export class UserGateGrantEntity implements UserGateGrant {
  readonly id: string;
  readonly userId: string;
  readonly gateId: string;
  readonly status: GateGrantStatus;
  readonly grantedAt: string;
  readonly grantedBy: string;
  readonly revokedAt?: string | null;
  readonly revocationReason?: string | null;
  readonly evidenceSnapshot: {
    gateLevel: GateLevel;
    verifiedCompetencyIds: string[];
    timestamp: string;
    evaluatorNotes?: string;
  };

  constructor(props: UserGateGrantProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.gateId = props.gateId;
    this.status = props.status;
    this.grantedAt = (props.grantedAt || new Date()).toISOString();
    this.grantedBy = props.grantedBy;
    this.revokedAt = props.revokedAt ? props.revokedAt.toISOString() : null;
    this.revocationReason = props.revocationReason || null;
    this.evidenceSnapshot = props.evidenceSnapshot;
  }

  isActive(): boolean {
    return this.status === 'active';
  }

  isSuspendedOrProvisional(): boolean {
    return this.status === 'provisional';
  }
}
