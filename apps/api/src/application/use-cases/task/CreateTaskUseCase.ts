import type { ITaskRepository } from '../../../domain/ports/ITaskRepository';
import type { ICompetencyRepository } from '../../../domain/ports/ICompetencyRepository';
import type { TaskEntity } from '../../../domain/entities/Task';
import type { CreateTaskDto } from '@flashlearn/shared';

export class CreateTaskUseCase {
  constructor(
    private readonly taskRepo: ITaskRepository,
    private readonly competencyRepo: ICompetencyRepository
  ) {}

  async execute(dto: CreateTaskDto): Promise<TaskEntity> {
    if (!dto.competencyId || !dto.title || !dto.scenario) {
      throw new Error('Competency ID, title, and scenario are required to create a task');
    }

    const competency = await this.competencyRepo.findById(dto.competencyId);
    if (!competency) {
      throw new Error(`Target competency node '${dto.competencyId}' not found`);
    }

    return await this.taskRepo.create({
      competencyId: dto.competencyId,
      title: dto.title,
      scenario: dto.scenario,
      taskType: dto.taskType || 'case_study',
      oracleData: dto.oracleData || {},
      rubricCriteria: dto.rubricCriteria || [],
      passingScore: dto.passingScore || 85,
    });
  }
}
