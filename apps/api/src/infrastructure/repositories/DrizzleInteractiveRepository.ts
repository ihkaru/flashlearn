import { eq, and, desc, inArray, isNull } from 'drizzle-orm';
import { db } from '../database/db';
import { contentArtifacts, learnerContentProgress, contents, workspaces } from '../database/schema';
import type {
  ContentArtifact,
  ContentArtifactKind,
  LearnerContentProgress,
  SaveLearnerProgressRequest,
} from '@flashlearn/shared';
import type {
  IInteractiveRepository,
  LearnerIdentity,
  RecentResumableSession,
  UpsertArtifactData,
} from '../../domain/ports/IInteractiveRepository';

export class DrizzleInteractiveRepository implements IInteractiveRepository {
  private mapArtifact(row: typeof contentArtifacts.$inferSelect): ContentArtifact {
    return {
      id: row.id,
      contentId: row.contentId,
      kind: row.kind as ContentArtifactKind,
      mimeType: row.mimeType,
      htmlContent: row.htmlContent,
      sha256Hash: row.sha256Hash,
      byteSize: row.byteSize,
      metadata: row.metadata ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapProgress(row: typeof learnerContentProgress.$inferSelect): LearnerContentProgress {
    return {
      id: row.id,
      contentId: row.contentId,
      userId: row.userId,
      sessionKey: row.sessionKey,
      currentStepIndex: row.currentStepIndex,
      totalSteps: row.totalSteps,
      currentSlideIndex: row.currentSlideIndex,
      completedStepIds: row.completedStepIds || [],
      anchoringCompleted: row.anchoringCompleted,
      diagnosticAttempts: row.diagnosticAttempts,
      lastLossScore: row.lastLossScore !== null ? Number(row.lastLossScore) : null,
      lossVector: row.lossVector ?? null,
      thetaMastery: Number(row.thetaMastery || 0),
      isCompleted: row.isCompleted,
      dailyActivityLog: row.dailyActivityLog || {},
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async upsertArtifact(data: UpsertArtifactData): Promise<ContentArtifact> {
    const [existing] = await db
      .select({ id: contentArtifacts.id })
      .from(contentArtifacts)
      .where(and(eq(contentArtifacts.contentId, data.contentId), eq(contentArtifacts.kind, data.kind)));

    if (existing) {
      const [updated] = await db
        .update(contentArtifacts)
        .set({
          mimeType: data.mimeType,
          htmlContent: data.htmlContent,
          sha256Hash: data.sha256Hash,
          byteSize: data.byteSize,
          metadata: data.metadata ?? null,
          updatedAt: new Date(),
        })
        .where(eq(contentArtifacts.id, existing.id))
        .returning();
      return this.mapArtifact(updated);
    }

    const [created] = await db
      .insert(contentArtifacts)
      .values({
        contentId: data.contentId,
        kind: data.kind,
        mimeType: data.mimeType,
        htmlContent: data.htmlContent,
        sha256Hash: data.sha256Hash,
        byteSize: data.byteSize,
        metadata: data.metadata ?? null,
      })
      .returning();
    return this.mapArtifact(created);
  }

  async getArtifact(contentId: string, kind: ContentArtifactKind): Promise<ContentArtifact | null> {
    const [row] = await db
      .select()
      .from(contentArtifacts)
      .where(and(eq(contentArtifacts.contentId, contentId), eq(contentArtifacts.kind, kind)));
    return row ? this.mapArtifact(row) : null;
  }

  async listArtifactKindsByContentIds(contentIds: string[]): Promise<Map<string, ContentArtifactKind[]>> {
    const map = new Map<string, ContentArtifactKind[]>();
    if (contentIds.length === 0) return map;

    const rows = await db
      .select({ contentId: contentArtifacts.contentId, kind: contentArtifacts.kind })
      .from(contentArtifacts)
      .where(inArray(contentArtifacts.contentId, contentIds));

    for (const row of rows) {
      const list = map.get(row.contentId) || [];
      list.push(row.kind as ContentArtifactKind);
      map.set(row.contentId, list);
    }
    return map;
  }

  async deleteArtifact(contentId: string, kind: ContentArtifactKind): Promise<boolean> {
    const rows = await db
      .delete(contentArtifacts)
      .where(and(eq(contentArtifacts.contentId, contentId), eq(contentArtifacts.kind, kind)))
      .returning({ id: contentArtifacts.id });
    return rows.length > 0;
  }

  private buildIdentityCondition(identity: LearnerIdentity) {
    if (identity.userId) {
      return eq(learnerContentProgress.userId, identity.userId);
    }
    if (identity.sessionKey) {
      return and(
        isNull(learnerContentProgress.userId),
        eq(learnerContentProgress.sessionKey, identity.sessionKey)
      );
    }
    return null;
  }

  async getProgress(
    contentId: string,
    identity: LearnerIdentity
  ): Promise<LearnerContentProgress | null> {
    const idCond = this.buildIdentityCondition(identity);
    if (!idCond) return null;

    const [row] = await db
      .select()
      .from(learnerContentProgress)
      .where(and(eq(learnerContentProgress.contentId, contentId), idCond));

    return row ? this.mapProgress(row) : null;
  }

  async listProgressByWorkspace(
    workspaceId: string,
    identity: LearnerIdentity
  ): Promise<LearnerContentProgress[]> {
    const idCond = this.buildIdentityCondition(identity);
    if (!idCond) return [];

    const rows = await db
      .select({ progress: learnerContentProgress })
      .from(learnerContentProgress)
      .innerJoin(contents, eq(learnerContentProgress.contentId, contents.id))
      .where(and(eq(contents.workspaceId, workspaceId), isNull(contents.deletedAt), idCond))
      .orderBy(desc(learnerContentProgress.updatedAt));

    return rows.map((r) => this.mapProgress(r.progress));
  }

  async listRecentProgress(
    identity: LearnerIdentity,
    limit = 6
  ): Promise<RecentResumableSession[]> {
    const idCond = this.buildIdentityCondition(identity);
    if (!idCond) return [];

    const rows = await db
      .select({
        progress: learnerContentProgress,
        contentTitle: contents.title,
        contentType: contents.type,
        workspaceId: contents.workspaceId,
        workspaceName: workspaces.name,
      })
      .from(learnerContentProgress)
      .innerJoin(contents, eq(learnerContentProgress.contentId, contents.id))
      .innerJoin(workspaces, eq(contents.workspaceId, workspaces.id))
      .where(and(isNull(contents.deletedAt), eq(contents.isPublished, true), idCond))
      .orderBy(desc(learnerContentProgress.updatedAt))
      .limit(limit);

    return rows.map((r) => ({
      ...this.mapProgress(r.progress),
      contentTitle: r.contentTitle,
      contentType: r.contentType,
      workspaceId: r.workspaceId,
      workspaceName: r.workspaceName,
    }));
  }

  async saveProgress(
    contentId: string,
    identity: LearnerIdentity,
    input: SaveLearnerProgressRequest
  ): Promise<LearnerContentProgress> {
    const existing = await this.getProgress(contentId, identity);
    const todayKey = new Date().toISOString().slice(0, 10);
    const mergedLog = { ...(existing?.dailyActivityLog || {}) };

    if (input.incrementStepsToday || input.incrementProbesToday) {
      const prev = mergedLog[todayKey] || { stepsCompleted: 0, probesSolved: 0 };
      mergedLog[todayKey] = {
        stepsCompleted: prev.stepsCompleted + (input.incrementStepsToday || 0),
        probesSolved: prev.probesSolved + (input.incrementProbesToday || 0),
      };
    }

    const payloadValues = {
      currentStepIndex: Math.max(0, input.currentStepIndex),
      totalSteps: Math.max(1, input.totalSteps),
      currentSlideIndex: Math.max(0, input.currentSlideIndex),
      completedStepIds: Array.from(new Set(input.completedStepIds || [])),
      anchoringCompleted: Boolean(input.anchoringCompleted),
      diagnosticAttempts: Math.max(0, input.diagnosticAttempts || 0),
      lastLossScore:
        input.lastLossScore !== undefined && input.lastLossScore !== null
          ? Number(input.lastLossScore).toFixed(3)
          : existing?.lastLossScore !== undefined && existing?.lastLossScore !== null
          ? Number(existing.lastLossScore).toFixed(3)
          : null,
      lossVector: input.lossVector !== undefined ? input.lossVector : existing?.lossVector ?? null,
      thetaMastery: Math.min(1, Math.max(0, Number(input.thetaMastery || 0))).toFixed(3),
      isCompleted: Boolean(input.isCompleted),
      dailyActivityLog: mergedLog,
      updatedAt: new Date(),
    };

    if (existing?.id) {
      const [updated] = await db
        .update(learnerContentProgress)
        .set(payloadValues)
        .where(eq(learnerContentProgress.id, existing.id))
        .returning();
      return this.mapProgress(updated);
    }

    const [created] = await db
      .insert(learnerContentProgress)
      .values({
        contentId,
        userId: identity.userId ?? null,
        sessionKey: identity.userId ? null : identity.sessionKey ?? null,
        ...payloadValues,
      })
      .returning();
    return this.mapProgress(created);
  }
}
