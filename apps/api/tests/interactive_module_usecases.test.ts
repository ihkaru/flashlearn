import { describe, expect, it } from 'bun:test';
import { UpsertContentArtifactUseCase } from '../src/application/use-cases/interactive/UpsertContentArtifactUseCase';
import { GetContentArtifactUseCase } from '../src/application/use-cases/interactive/GetContentArtifactUseCase';
import { SaveLearnerProgressUseCase } from '../src/application/use-cases/interactive/SaveLearnerProgressUseCase';
import { GetLearnerProgressUseCase } from '../src/application/use-cases/interactive/GetLearnerProgressUseCase';
import { ContentEntity } from '../src/domain/entities/Content';
import { WorkspaceEntity } from '../src/domain/entities/Workspace';
import type { IInteractiveRepository, LearnerIdentity, UpsertArtifactData } from '../src/domain/ports/IInteractiveRepository';
import type { ContentArtifact, ContentArtifactKind, LearnerContentProgress, SaveLearnerProgressRequest } from '@flashlearn/shared';

class InMemoryInteractiveRepo implements IInteractiveRepository {
  artifacts = new Map<string, ContentArtifact>();
  progresses = new Map<string, LearnerContentProgress>();

  async upsertArtifact(data: UpsertArtifactData): Promise<ContentArtifact> {
    const key = `${data.contentId}:${data.kind}`;
    const now = new Date().toISOString();
    const record: ContentArtifact = {
      id: this.artifacts.get(key)?.id || `art-${this.artifacts.size + 1}`,
      ...data,
      createdAt: this.artifacts.get(key)?.createdAt || now,
      updatedAt: now,
    };
    this.artifacts.set(key, record);
    return record;
  }

  async getArtifact(contentId: string, kind: ContentArtifactKind): Promise<ContentArtifact | null> {
    return this.artifacts.get(`${contentId}:${kind}`) || null;
  }

  async listArtifactKindsByContentIds(contentIds: string[]): Promise<Map<string, ContentArtifactKind[]>> {
    const map = new Map<string, ContentArtifactKind[]>();
    for (const id of contentIds) {
      const kinds: ContentArtifactKind[] = [];
      if (this.artifacts.has(`${id}:slide_deck_html`)) kinds.push('slide_deck_html');
      if (this.artifacts.has(`${id}:anchoring_sim_html`)) kinds.push('anchoring_sim_html');
      if (kinds.length) map.set(id, kinds);
    }
    return map;
  }

  async deleteArtifact(contentId: string, kind: ContentArtifactKind): Promise<boolean> {
    return this.artifacts.delete(`${contentId}:${kind}`);
  }

  private pKey(contentId: string, id: LearnerIdentity): string {
    return `${contentId}:${id.userId ? `u:${id.userId}` : `s:${id.sessionKey}`}`;
  }

  async getProgress(contentId: string, identity: LearnerIdentity): Promise<LearnerContentProgress | null> {
    return this.progresses.get(this.pKey(contentId, identity)) || null;
  }

  async listProgressByWorkspace(): Promise<LearnerContentProgress[]> {
    return Array.from(this.progresses.values());
  }

  async listRecentProgress(): Promise<any[]> {
    return Array.from(this.progresses.values());
  }

  async saveProgress(
    contentId: string,
    identity: LearnerIdentity,
    input: SaveLearnerProgressRequest
  ): Promise<LearnerContentProgress> {
    const key = this.pKey(contentId, identity);
    const prev = this.progresses.get(key);
    const today = new Date().toISOString().slice(0, 10);
    const log = { ...(prev?.dailyActivityLog || {}) };
    if (input.incrementStepsToday || input.incrementProbesToday) {
      const cur = log[today] || { stepsCompleted: 0, probesSolved: 0 };
      log[today] = {
        stepsCompleted: cur.stepsCompleted + (input.incrementStepsToday || 0),
        probesSolved: cur.probesSolved + (input.incrementProbesToday || 0),
      };
    }

    const saved: LearnerContentProgress = {
      id: prev?.id || `prog-${this.progresses.size + 1}`,
      contentId,
      userId: identity.userId ?? null,
      sessionKey: identity.userId ? null : identity.sessionKey ?? null,
      currentStepIndex: input.currentStepIndex,
      totalSteps: input.totalSteps,
      currentSlideIndex: input.currentSlideIndex,
      completedStepIds: input.completedStepIds,
      anchoringCompleted: input.anchoringCompleted,
      diagnosticAttempts: input.diagnosticAttempts,
      lastLossScore: input.lastLossScore ?? null,
      lossVector: input.lossVector ?? null,
      thetaMastery: input.thetaMastery,
      isCompleted: input.isCompleted,
      dailyActivityLog: log,
      updatedAt: new Date().toISOString(),
    };
    this.progresses.set(key, saved);
    return saved;
  }
}

describe('Interactive Artifact & Resumable Progress Use Cases (Phase 07)', () => {
  const workspace = new WorkspaceEntity({
    id: 'ws-1',
    name: 'Kriptografi Dasar',
    slug: 'kriptografi',
    description: null,
    icon: null,
    creatorId: 'creator-1',
    isPublic: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const content = new ContentEntity({
    id: 'cnt-1',
    workspaceId: 'ws-1',
    competencyId: 'comp-1',
    title: 'Enkripsi Asimetris',
    slug: 'enkripsi-asimetris',
    type: 'interactive_module',
    summary: 'Memahami public-private key via gembok transparan.',
    readingTimeMinutes: 6,
    body: null,
    questions: null,
    interactivePayload: null,
    isPublished: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const contentRepo: any = {
    findById: async (id: string) => (id === 'cnt-1' ? content : null),
  };
  const workspaceRepo: any = {
    findById: async (id: string) => (id === 'ws-1' ? workspace : null),
  };

  it('upserts safe HTML deck artifacts with SHA-256 hash and blocks unauthorized uploaders', async () => {
    const repo = new InMemoryInteractiveRepo();
    const upsertUc = new UpsertContentArtifactUseCase(contentRepo, workspaceRepo, repo);
    const getUc = new GetContentArtifactUseCase(contentRepo, workspaceRepo, repo);

    await expect(
      upsertUc.execute('other-user', 'creator', {
        contentId: 'cnt-1',
        kind: 'slide_deck_html',
        htmlContent: '<html lang="id"><body><section class="slide"></section></body></html>',
      })
    ).rejects.toThrow('Forbidden');

    const res = await upsertUc.execute('creator-1', 'creator', {
      contentId: 'cnt-1',
      kind: 'slide_deck_html',
      htmlContent: '<!doctype html><html lang="id"><body><section class="slide" data-slide-id="s1"></section></body></html>',
    });

    expect(res.artifact.sha256Hash).toHaveLength(64);
    expect(res.artifact.metadata?.slideCount).toBe(1);

    const loaded = await getUc.execute('cnt-1', 'slide_deck_html', null, 'guest');
    expect(loaded?.htmlContent).toContain('data-slide-id="s1"');
  });

  it('persists guest and authenticated resume progress and syncs unaided sandbox milestone on mastery', async () => {
    const repo = new InMemoryInteractiveRepo();
    let recordedUnaided: Array<{ userId: string; compId: string }> = [];
    const masteryRepo: any = {
      markUnaidedSandboxPassed: async (userId: string, compId: string) => {
        recordedUnaided.push({ userId, compId });
      },
    };

    const saveUc = new SaveLearnerProgressUseCase(contentRepo, repo, masteryRepo);
    const getUc = new GetLearnerProgressUseCase(repo);

    // Guest auto-save at step 2 -> resume later
    await saveUc.execute(
      'cnt-1',
      { sessionKey: 'guest-device-abc123' },
      {
        currentStepIndex: 2,
        totalSteps: 7,
        currentSlideIndex: 2,
        completedStepIds: ['step-anomaly', 'step-anchoring'],
        anchoringCompleted: true,
        diagnosticAttempts: 0,
        thetaMastery: 0.3,
        isCompleted: false,
        incrementStepsToday: 2,
      }
    );

    const resumedGuest = await getUc.getForContent('cnt-1', { sessionKey: 'guest-device-abc123' });
    expect(resumedGuest?.currentStepIndex).toBe(2);
    expect(resumedGuest?.anchoringCompleted).toBe(true);
    expect(recordedUnaided).toHaveLength(0);

    // Authenticated completion triggers unaided sandbox unlock on linked competency
    await saveUc.execute(
      'cnt-1',
      { userId: 'learner-99' },
      {
        currentStepIndex: 6,
        totalSteps: 7,
        currentSlideIndex: 5,
        completedStepIds: ['step-anomaly', 'step-anchoring', 'step-bridging', 'step-mechanics', 'step-notation', 'step-stress-test'],
        anchoringCompleted: true,
        diagnosticAttempts: 1,
        lastLossScore: 0,
        thetaMastery: 0.85,
        isCompleted: true,
        incrementProbesToday: 1,
      }
    );

    expect(recordedUnaided).toEqual([{ userId: 'learner-99', compId: 'comp-1' }]);
  });
});
