import type { DiagnosticSessionEntity, DiagnosticSessionProps } from '../entities/DiagnosticSession';

export interface CreateDiagnosticSessionData {
  workspaceId: string;
  userId: string;
  initialFringe?: string[];
}

export interface IDiagnosticSessionRepository {
  findById(id: string): Promise<DiagnosticSessionEntity | null>;
  findActiveByUserAndWorkspace(userId: string, workspaceId: string): Promise<DiagnosticSessionEntity | null>;
  create(data: CreateDiagnosticSessionData): Promise<DiagnosticSessionEntity>;
  update(session: DiagnosticSessionEntity): Promise<DiagnosticSessionEntity>;
}
