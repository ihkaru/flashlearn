import { eq, and, inArray } from 'drizzle-orm';
import { db } from '../database/db';
import { competencies, competencyEdges } from '../database/schema';
import { CompetencyEntity } from '../../domain/entities/Competency';
import type {
  ICompetencyRepository,
  CreateCompetencyData,
} from '../../domain/ports/ICompetencyRepository';
import type { OracleClass, RiskLevel, CompetencyEdge } from '@flashlearn/shared';

export class DrizzleCompetencyRepository implements ICompetencyRepository {
  private mapToEntity(
    row: typeof competencies.$inferSelect,
    prerequisiteIds: string[] = []
  ): CompetencyEntity {
    return new CompetencyEntity({
      id: row.id,
      workspaceId: row.workspaceId,
      code: row.code,
      title: row.title,
      description: row.description,
      oracleClass: row.oracleClass as OracleClass,
      riskLevel: row.riskLevel as RiskLevel,
      isExpertApproved: row.isExpertApproved,
      approvedBy: row.approvedBy,
      prerequisiteIds,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findById(id: string): Promise<CompetencyEntity | null> {
    const [row] = await db.select().from(competencies).where(eq(competencies.id, id));
    if (!row) return null;

    const prereqs = await this.getPrerequisites(id);
    return this.mapToEntity(row, prereqs);
  }

  async findByCode(workspaceId: string, code: string): Promise<CompetencyEntity | null> {
    const [row] = await db
      .select()
      .from(competencies)
      .where(and(eq(competencies.workspaceId, workspaceId), eq(competencies.code, code)));
    if (!row) return null;

    const prereqs = await this.getPrerequisites(row.id);
    return this.mapToEntity(row, prereqs);
  }

  async listByWorkspace(workspaceId: string): Promise<CompetencyEntity[]> {
    const rows = await db
      .select()
      .from(competencies)
      .where(eq(competencies.workspaceId, workspaceId))
      .orderBy(competencies.code);

    if (rows.length === 0) return [];

    const ids = rows.map((r) => r.id);
    const edges = await db
      .select()
      .from(competencyEdges)
      .where(inArray(competencyEdges.competencyId, ids));

    const prereqMap = new Map<string, string[]>();
    for (const edge of edges) {
      const list = prereqMap.get(edge.competencyId) || [];
      list.push(edge.prerequisiteId);
      prereqMap.set(edge.competencyId, list);
    }

    return rows.map((r) => this.mapToEntity(r, prereqMap.get(r.id) || []));
  }

  async create(data: CreateCompetencyData): Promise<CompetencyEntity> {
    const [row] = await db
      .insert(competencies)
      .values({
        workspaceId: data.workspaceId,
        code: data.code.trim().toUpperCase(),
        title: data.title,
        description: data.description,
        oracleClass: data.oracleClass,
        riskLevel: data.riskLevel || 'low',
        isExpertApproved: false,
      })
      .returning();

    return this.mapToEntity(row, []);
  }

  async update(id: string, data: Partial<CreateCompetencyData>): Promise<CompetencyEntity | null> {
    const updatePayload: Record<string, any> = { updatedAt: new Date() };
    if (data.title !== undefined) updatePayload.title = data.title;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.code !== undefined) updatePayload.code = data.code.trim().toUpperCase();
    if (data.oracleClass !== undefined) updatePayload.oracleClass = data.oracleClass;
    if (data.riskLevel !== undefined) updatePayload.riskLevel = data.riskLevel;

    const [row] = await db
      .update(competencies)
      .set(updatePayload)
      .where(eq(competencies.id, id))
      .returning();

    return row ? this.findById(id) : null;
  }

  async delete(id: string): Promise<boolean> {
    const [row] = await db.delete(competencies).where(eq(competencies.id, id)).returning();
    return !!row;
  }

  async addPrerequisite(competencyId: string, prerequisiteId: string): Promise<void> {
    if (competencyId === prerequisiteId) {
      throw new Error('A competency node cannot be a prerequisite of itself');
    }

    // Check if edge already exists
    const [existing] = await db
      .select()
      .from(competencyEdges)
      .where(
        and(
          eq(competencyEdges.competencyId, competencyId),
          eq(competencyEdges.prerequisiteId, prerequisiteId)
        )
      );

    if (existing) return;

    await db.insert(competencyEdges).values({
      competencyId,
      prerequisiteId,
    });
  }

  async removePrerequisite(competencyId: string, prerequisiteId: string): Promise<void> {
    await db
      .delete(competencyEdges)
      .where(
        and(
          eq(competencyEdges.competencyId, competencyId),
          eq(competencyEdges.prerequisiteId, prerequisiteId)
        )
      );
  }

  async getPrerequisites(competencyId: string): Promise<string[]> {
    const edges = await db
      .select({ prereqId: competencyEdges.prerequisiteId })
      .from(competencyEdges)
      .where(eq(competencyEdges.competencyId, competencyId));

    return edges.map((e) => e.prereqId);
  }

  async listEdges(workspaceId: string): Promise<CompetencyEdge[]> {
    const compRows = await db
      .select({ id: competencies.id })
      .from(competencies)
      .where(eq(competencies.workspaceId, workspaceId));

    if (compRows.length === 0) return [];

    const compIds = compRows.map((c) => c.id);
    const edges = await db
      .select({
        competencyId: competencyEdges.competencyId,
        prerequisiteId: competencyEdges.prerequisiteId,
      })
      .from(competencyEdges)
      .where(inArray(competencyEdges.competencyId, compIds));

    return edges;
  }

  async approveByExpert(id: string, expertUserId: string): Promise<CompetencyEntity | null> {
    const [row] = await db
      .update(competencies)
      .set({
        isExpertApproved: true,
        approvedBy: expertUserId,
        updatedAt: new Date(),
      })
      .where(eq(competencies.id, id))
      .returning();

    return row ? this.findById(id) : null;
  }
}
