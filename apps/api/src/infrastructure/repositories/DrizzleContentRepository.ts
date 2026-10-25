import { eq, and, desc, isNull } from 'drizzle-orm';
import { db } from '../database/db';
import { contents, contentVersions, quizSubmissions, users } from '../database/schema';
import { ContentEntity } from '../../domain/entities/Content';
import type {
  IContentRepository,
  CreateContentData,
  UpdateContentData,
} from '../../domain/ports/IContentRepository';
import type { ContentType, QuizQuestion } from '@flashlearn/shared';

export class DrizzleContentRepository implements IContentRepository {
  private mapToEntity(row: typeof contents.$inferSelect): ContentEntity {
    return new ContentEntity({
      id: row.id,
      workspaceId: row.workspaceId,
      domainId: row.domainId,
      competencyId: row.competencyId,
      title: row.title,
      slug: row.slug,
      type: row.type as ContentType,
      summary: row.summary,
      readingTimeMinutes: row.readingTimeMinutes,
      body: row.body,
      questions: row.questions as QuizQuestion[] | null,
      isPublished: row.isPublished,
      deletedAt: row.deletedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findById(id: string, includeDeleted = false): Promise<ContentEntity | null> {
    const conditions = [eq(contents.id, id)];
    if (!includeDeleted) {
      conditions.push(isNull(contents.deletedAt));
    }
    const [row] = await db.select().from(contents).where(and(...conditions));
    return row ? this.mapToEntity(row) : null;
  }

  async findBySlug(workspaceId: string, slug: string): Promise<ContentEntity | null> {
    const [row] = await db
      .select()
      .from(contents)
      .where(and(eq(contents.workspaceId, workspaceId), eq(contents.slug, slug), isNull(contents.deletedAt)));
    return row ? this.mapToEntity(row) : null;
  }

  async listByWorkspace(workspaceId: string, onlyPublished = false, includeDeleted = false): Promise<ContentEntity[]> {
    const conditions = [eq(contents.workspaceId, workspaceId)];
    if (onlyPublished) {
      conditions.push(eq(contents.isPublished, true));
    }
    if (!includeDeleted) {
      conditions.push(isNull(contents.deletedAt));
    }

    const rows = await db
      .select()
      .from(contents)
      .where(and(...conditions))
      .orderBy(desc(contents.createdAt));

    return rows.map((r) => this.mapToEntity(r));
  }

  async listByCompetency(competencyId: string): Promise<ContentEntity[]> {
    const rows = await db
      .select()
      .from(contents)
      .where(and(eq(contents.competencyId, competencyId), isNull(contents.deletedAt)))
      .orderBy(desc(contents.createdAt));

    return rows.map((r) => this.mapToEntity(r));
  }

  async create(data: CreateContentData): Promise<ContentEntity> {
    const [row] = await db
      .insert(contents)
      .values({
        workspaceId: data.workspaceId,
        domainId: data.domainId || null,
        competencyId: data.competencyId || null,
        title: data.title,
        slug: data.slug,
        type: data.type,
        summary: data.summary,
        readingTimeMinutes: data.readingTimeMinutes,
        body: data.body,
        questions: data.questions,
        isPublished: data.isPublished,
      })
      .returning();

    return this.mapToEntity(row);
  }

  async update(id: string, data: UpdateContentData): Promise<ContentEntity | null> {
    const [row] = await db
      .update(contents)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(contents.id, id))
      .returning();

    return row ? this.mapToEntity(row) : null;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await db.delete(contents).where(eq(contents.id, id)).returning();
    return deleted.length > 0;
  }

  async softDelete(id: string): Promise<boolean> {
    const [row] = await db
      .update(contents)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(contents.id, id))
      .returning();
    return !!row;
  }

  async restore(id: string): Promise<ContentEntity | null> {
    const [row] = await db
      .update(contents)
      .set({ deletedAt: null, updatedAt: new Date() })
      .where(eq(contents.id, id))
      .returning();
    return row ? this.mapToEntity(row) : null;
  }

  async createVersion(
    contentId: string,
    versionNumber: number,
    action: string,
    snapshot: any,
    changedBy?: string | null
  ): Promise<void> {
    await db.insert(contentVersions).values({
      contentId,
      versionNumber,
      action,
      snapshot,
      changedBy: changedBy || null,
    });
  }

  async getLatestVersionNumber(contentId: string): Promise<number> {
    const [row] = await db
      .select({ versionNumber: contentVersions.versionNumber })
      .from(contentVersions)
      .where(eq(contentVersions.contentId, contentId))
      .orderBy(desc(contentVersions.versionNumber))
      .limit(1);

    return row ? row.versionNumber : 0;
  }

  async getVersion(contentId: string, versionNumber: number): Promise<any | null> {
    const [row] = await db
      .select()
      .from(contentVersions)
      .where(and(eq(contentVersions.contentId, contentId), eq(contentVersions.versionNumber, versionNumber)));

    return row || null;
  }

  async listVersions(contentId: string): Promise<any[]> {
    return await db
      .select()
      .from(contentVersions)
      .where(eq(contentVersions.contentId, contentId))
      .orderBy(desc(contentVersions.versionNumber));
  }

  async listSubmissions(contentId: string): Promise<any[]> {
    return await db
      .select({
        id: quizSubmissions.id,
        contentId: quizSubmissions.contentId,
        guestName: quizSubmissions.guestName,
        userId: quizSubmissions.userId,
        userName: users.name,
        userEmail: users.email,
        score: quizSubmissions.score,
        totalQuestions: quizSubmissions.totalQuestions,
        percentage: quizSubmissions.percentage,
        answers: quizSubmissions.answers,
        createdAt: quizSubmissions.createdAt,
      })
      .from(quizSubmissions)
      .leftJoin(users, eq(quizSubmissions.userId, users.id))
      .where(eq(quizSubmissions.contentId, contentId))
      .orderBy(desc(quizSubmissions.createdAt));
  }

  async checkGuestNameExists(contentId: string, name: string): Promise<boolean> {
    const normalized = name.trim().toLowerCase();
    const rows = await db
      .select({ guestName: quizSubmissions.guestName })
      .from(quizSubmissions)
      .where(eq(quizSubmissions.contentId, contentId));

    return rows.some((r) => r.guestName && r.guestName.trim().toLowerCase() === normalized);
  }
}
