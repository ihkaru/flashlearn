import type { TaskEntity } from '../entities/Task';
import type { TaskType, OracleData, RubricCriterion, AdversarialDilemmaSpec } from '@flashlearn/shared';

export interface CreateTaskData {
  competencyId: string;
  title: string;
  scenario: string;
  taskType: TaskType;
  oracleData: OracleData;
  adversarialSpec?: AdversarialDilemmaSpec | null;
  rubricCriteria: RubricCriterion[];
  passingScore?: number;
}

export interface ITaskRepository {
  findById(id: string): Promise<TaskEntity | null>;
  listByCompetency(competencyId: string): Promise<TaskEntity[]>;
  create(data: CreateTaskData): Promise<TaskEntity>;
  update(id: string, data: Partial<CreateTaskData>): Promise<TaskEntity | null>;
  delete(id: string): Promise<boolean>;
}
