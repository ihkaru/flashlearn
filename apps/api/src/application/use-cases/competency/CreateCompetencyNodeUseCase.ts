import type { ICompetencyRepository } from '../../../domain/ports/ICompetencyRepository';
import type { CompetencyGraphEngine } from '../../../domain/services/CompetencyGraphEngine';
import type { CompetencyEntity } from '../../../domain/entities/Competency';
import type { CreateCompetencyDto } from '@flashlearn/shared';

export class CreateCompetencyNodeUseCase {
  constructor(
    private readonly competencyRepo: ICompetencyRepository,
    private readonly graphEngine: CompetencyGraphEngine
  ) {}

  async execute(dto: CreateCompetencyDto): Promise<CompetencyEntity> {
    if (!dto.workspaceId || !dto.code || !dto.title) {
      throw new Error('Workspace ID, code, and title are required to create a competency node');
    }

    const existing = await this.competencyRepo.findByCode(dto.workspaceId, dto.code);
    if (existing) {
      throw new Error(`Competency with code '${dto.code}' already exists in this workspace`);
    }

    const node = await this.competencyRepo.create({
      workspaceId: dto.workspaceId,
      sourceId: dto.sourceId,
      code: dto.code,
      title: dto.title,
      description: dto.description || '',
      oracleClass: dto.oracleClass || 'A',
      riskLevel: dto.riskLevel || 'low',
    });

    // If initial prerequisiteIds provided, link them safely
    if (dto.prerequisiteIds && dto.prerequisiteIds.length > 0) {
      for (const pId of dto.prerequisiteIds) {
        await this.competencyRepo.addPrerequisite(node.id, pId);
      }
    }

    return (await this.competencyRepo.findById(node.id))!;
  }
}
