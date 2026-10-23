import { eq, desc } from 'drizzle-orm';
import { db } from '../database/db';
import { tasks } from '../database/schema';
import { TaskEntity } from '../../domain/entities/Task';
import type { ITaskRepository, CreateTaskData } from '../../domain/ports/ITaskRepository';
import type { TaskType, OracleData, RubricCriterion } from '@flashlearn/shared';

export class DrizzleTaskRepository implements ITaskRepository {
  private mapToEntity(row: typeof tasks.$inferSelect): TaskEntity {
    return new TaskEntity({
      id: row.id,
      competencyId: row.competencyId,
      title: row.title,
      scenario: row.scenario,
      taskType: row.taskType as TaskType,
      oracleData: row.oracleData as OracleData,
      rubricCriteria: row.rubricCriteria as RubricCriterion[],
      passingScore: row.passingScore,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findById(id: string): Promise<TaskEntity | null> {
    const [row] = await db.select().from(tasks).where(eq(tasks.id, id));
    return row ? this.mapToEntity(row) : null;
  }

  async listByCompetency(competencyId: string): Promise<TaskEntity[]> {
    const rows = await db
      .select()
      .from(tasks)
      .where(eq(tasks.competencyId, competencyId))
      .orderBy(desc(tasks.createdAt));

    return rows.map((r) => this.mapToEntity(r));
  }

  async create(data: CreateTaskData): Promise<TaskEntity> {
    const [row] = await db
      .insert(tasks)
      .values({
        competencyId: data.competencyId,
        title: data.title,
        scenario: data.scenario,
        taskType: data.taskType,
        oracleData: data.oracleData,
        rubricCriteria: data.rubricCriteria,
        passingScore: data.passingScore || 85,
      })
      .returning();

    return this.mapToEntity(row);
  }

  async update(id: string, data: Partial<CreateTaskData>): Promise<TaskEntity | null> {
    const updatePayload: Record<string, any> = { updatedAt: new Date() };
    if (data.title !== undefined) updatePayload.title = data.title;
    if (data.scenario !== undefined) updatePayload.scenario = data.scenario;
    if (data.taskType !== undefined) updatePayload.taskType = data.taskType;
    if (data.oracleData !== undefined) updatePayload.oracleData = data.oracleData;
    if (data.rubricCriteria !== undefined) updatePayload.rubricCriteria = data.rubricCriteria;
    if (data.passingScore !== undefined) updatePayload.passingScore = data.passingScore;

    const [row] = await db.update(tasks).set(updatePayload).where(eq(tasks.id, id)).returning();
    return row ? this.mapToEntity(row) : null;
  }

  async delete(id: string): Promise<boolean> {
    const [row] = await db.delete(tasks).where(eq(tasks.id, id)).returning();
    return !!row;
  }
}
