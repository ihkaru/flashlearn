import type { IGateRepository } from '../../../domain/ports/IGateRepository';
import type { GateEntity } from '../../../domain/entities/Gate';
import type { GateLevel } from '@flashlearn/shared';

export interface CreateGateRequest {
  workspaceId: string;
  level: GateLevel;
  title: string;
  description: string;
  requirements?: Array<{
    competencyId: string;
    minimumScore: number;
    requiresHumanApproval: boolean;
  }>;
}

export class CreateGateUseCase {
  constructor(private readonly gateRepo: IGateRepository) {}

  async execute(req: CreateGateRequest): Promise<GateEntity> {
    const existing = await this.gateRepo.findByWorkspaceAndLevel(req.workspaceId, req.level);
    if (existing) {
      throw new Error(`Gate level ${req.level} already exists in workspace '${req.workspaceId}'`);
    }

    const gate = await this.gateRepo.createGate({
      workspaceId: req.workspaceId,
      level: req.level,
      title: req.title,
      description: req.description,
    });

    if (req.requirements && req.requirements.length > 0) {
      await this.gateRepo.addRequirements(gate.id, req.requirements);
      const reloaded = await this.gateRepo.findById(gate.id);
      if (reloaded) return reloaded;
    }

    return gate;
  }
}
