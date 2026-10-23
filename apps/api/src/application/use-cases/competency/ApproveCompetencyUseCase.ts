import type { ICompetencyRepository } from '../../../domain/ports/ICompetencyRepository';
import type { CompetencyEntity } from '../../../domain/entities/Competency';

export class ApproveCompetencyUseCase {
  constructor(private readonly competencyRepo: ICompetencyRepository) {}

  async execute(competencyId: string, expertUserId: string): Promise<CompetencyEntity> {
    const node = await this.competencyRepo.findById(competencyId);
    if (!node) {
      throw new Error(`Competency node '${competencyId}' not found`);
    }

    const updated = await this.competencyRepo.approveByExpert(competencyId, expertUserId);
    if (!updated) {
      throw new Error(`Failed to approve competency node '${competencyId}'`);
    }

    return updated;
  }
}
