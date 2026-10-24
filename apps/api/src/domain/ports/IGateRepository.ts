import type { GateEntity } from '../entities/Gate';
import type { UserGateGrantEntity } from '../entities/UserGateGrant';
import type { GateLevel, GateRequirement } from '@flashlearn/shared';

export interface IGateRepository {
  createGate(gate: {
    workspaceId: string;
    level: GateLevel;
    title: string;
    description: string;
  }): Promise<GateEntity>;

  addRequirements(gateId: string, requirements: Array<{
    competencyId: string;
    minimumScore: number;
    requiresHumanApproval: boolean;
  }>): Promise<GateRequirement[]>;

  findById(id: string): Promise<GateEntity | null>;
  findByWorkspaceAndLevel(workspaceId: string, level: GateLevel): Promise<GateEntity | null>;
  listByWorkspace(workspaceId: string): Promise<GateEntity[]>;

  createGrant(grant: {
    userId: string;
    gateId: string;
    status: 'active' | 'provisional' | 'revoked';
    grantedBy: string;
    evidenceSnapshot: Record<string, any>;
  }): Promise<UserGateGrantEntity>;

  findGrantById(grantId: string): Promise<UserGateGrantEntity | null>;
  findGrantByUserAndGate(userId: string, gateId: string): Promise<UserGateGrantEntity | null>;
  listGrantsByUser(userId: string): Promise<UserGateGrantEntity[]>;
  listGrantsByWorkspace(workspaceId: string): Promise<UserGateGrantEntity[]>;
  updateGrantStatus(grantId: string, status: 'active' | 'provisional' | 'revoked', reason?: string): Promise<void>;
  suspendGrantsForWorkspace(workspaceId: string, reason: string): Promise<number>;
}
