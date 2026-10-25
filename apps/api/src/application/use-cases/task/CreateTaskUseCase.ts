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

    if (dto.scenario.trim().length < 20) {
      throw new Error('Task scenario must be an authentic description with at least 20 characters');
    }

    const existingTasks = await this.taskRepo.listByCompetency(dto.competencyId);
    if (existingTasks.some((t) => t.title.trim().toLowerCase() === dto.title.trim().toLowerCase())) {
      throw new Error(`Task with title '${dto.title}' already exists for this competency`);
    }

    return await this.taskRepo.create({
      competencyId: dto.competencyId,
      title: dto.title,
      scenario: dto.scenario,
      taskType: dto.taskType || 'case_study',
      oracleData: dto.oracleData || {},
      adversarialSpec: dto.adversarialSpec || null,
      rubricCriteria: dto.rubricCriteria || [],
      passingScore: dto.passingScore || 85,
    });
  }
}
