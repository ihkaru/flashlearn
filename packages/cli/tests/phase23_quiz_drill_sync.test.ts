import { describe, expect, it } from 'bun:test';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { CurriculumPlanDocument } from '@flashlearn/shared';
import type { ApiClient } from '../src/core/client';
import { diffPlanWithRemote, pushPlanToRemote } from '../src/core/plan/plan-remote-sync';

function createPlanFixture(workDir: string) {
  mkdirSync(join(workDir, 'modules'), { recursive: true });
  const quizManifest = {
    schemaVersion: 'quiz-drill-v1',
    title: 'Drill Soal Statistika 1',
    summary: 'Latihan 3 soal lintas topik.',
    questions: [
      {
        id: 'q1',
        question: 'Apa ukuran pemusatan yang tahan terhadap outlier?',
        options: [
          { id: 'a', text: 'Mean', isCorrect: false },
          { id: 'b', text: 'Median', isCorrect: true },
        ],
        explanation: 'Median hanya bergantung pada posisi tengah data terurut.',
        topic: 'Pemusatan Data',
        sourceRef: 'Bab 1',
      },
      {
        id: 'q2',
        question: 'Simpangan baku adalah akar dari?',
        options: [
          { id: 'a', text: 'Varians', isCorrect: true },
          { id: 'b', text: 'Modus', isCorrect: false },
        ],
        explanation: 'Simpangan baku mengembalikan satuan kuadrat varians ke satuan asli.',
        topic: 'Sebaran Data',
        sourceRef: 'Bab 2',
      },
    ],
  };
  writeFileSync(
    join(workDir, 'modules/drill-stat-1.json'),
    JSON.stringify(quizManifest, null, 2),
    'utf-8'
  );

  const plan: CurriculumPlanDocument = {
    schemaVersion: 'curriculum-plan-v1',
    projectSlug: 'stat-101',
    workspaceName: 'Statistika 101',
    workspaceSlug: 'stat-101',
    workspaceId: 'ws-1',
    scaleClass: 'S',
    maxUnitMinutes: 120,
    corpusIndexPath: 'corpus-index.json',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    coverage: { totalSlices: 1, mappedSlices: 1, unmappedSliceIds: [] },
    units: [
      {
        unitCode: 'U01',
        unitTitle: 'Unit 1',
        unitOrder: 1,
        summary: 'Unit dasar',
        estimatedLectureMinutes: 60,
        remoteDomainId: 'dom-1',
        moduleSlugs: ['drill-stat-1'],
      },
    ],
    modules: [
      {
        slug: 'drill-stat-1',
        title: 'Drill Soal Statistika 1',
        unitCode: 'U01',
        moduleOrder: 1,
        contentType: 'quiz',
        knowledgeProfile: 'bridging_understand',
        estimatedMinutes: 20,
        needsSlideDeck: false,
        sourceSliceIds: ['s1'],
        prerequisites: [],
        state: 'uila_ready',
        manifestPath: 'modules/drill-stat-1.json',
      },
    ],
  };

  writeFileSync(join(workDir, 'curriculum-plan.json'), JSON.stringify(plan, null, 2), 'utf-8');
}

describe('Phase 23: CLI Quiz Drill Push & DEBT-07 Soft-Delete Diff Filter', () => {
  it('supports quiz-drill-v1 dry-run and live upsert (POST then PUT) via pushPlanToRemote', async () => {
    const workDir = mkdtempSync(join(tmpdir(), 'fl-phase23-cli-'));
    try {
      createPlanFixture(workDir);
      const remoteContents: any[] = [];
      const calls: Array<{ method: string; path: string; body?: any }> = [];

      const client = {
        async request(path: string, opts: any = {}) {
          const method = opts.method || 'GET';
          calls.push({ method, path, body: opts.body });
          if (path === '/api/v1/contents/workspace/ws-1' && method === 'GET') {
            return remoteContents;
          }
          if (path === '/api/v1/contents' && method === 'POST') {
            const created = { id: 'cnt-quiz-1', ...opts.body };
            remoteContents.push(created);
            return created;
          }
          if (path === '/api/v1/contents/cnt-quiz-1' && method === 'PUT') {
            Object.assign(remoteContents[0], opts.body);
            return remoteContents[0];
          }
          return {};
        },
      } as unknown as ApiClient;

      // 1. Dry-run
      const dry = await pushPlanToRemote(client, workDir, { dryRun: true });
      expect(dry.pushedCount).toBe(1);
      expect(dry.results[0]).toEqual({
        slug: 'drill-stat-1',
        unitCode: 'U01',
        dryRun: true,
        contentType: 'quiz',
        questionCount: 2,
        topicsCount: 2,
        warnings: [],
      });

      // 2. Live push (creates via POST)
      const created = await pushPlanToRemote(client, workDir, { dryRun: false });
      expect(created.pushedCount).toBe(1);
      expect(created.results[0].action).toBe('created');
      expect(created.results[0].contentId).toBe('cnt-quiz-1');
      expect(remoteContents[0].type).toBe('quiz');
      expect(remoteContents[0].questions).toHaveLength(2);

      // 3. Second live push (updates via PUT)
      const updated = await pushPlanToRemote(client, workDir, { dryRun: false });
      expect(updated.results[0].action).toBe('updated');
      expect(calls.some((c) => c.method === 'PUT' && c.path === '/api/v1/contents/cnt-quiz-1')).toBe(true);
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  });

  it('DEBT-07: excludes soft-deleted remote contents from diffPlanWithRemote', async () => {
    const workDir = mkdtempSync(join(tmpdir(), 'fl-phase23-debt07-'));
    try {
      createPlanFixture(workDir);
      const client = {
        async request(path: string) {
          if (path === '/api/v1/contents/workspace/ws-1') {
            return [
              { id: 'cnt-active', slug: 'orphan-active', title: 'Active Orphan', deletedAt: null },
              {
                id: 'cnt-deleted-1',
                slug: 'pruned-by-deletedAt',
                title: 'Soft Deleted 1',
                deletedAt: '2026-11-20T00:00:00.000Z',
              },
              {
                id: 'cnt-deleted-2',
                slug: 'pruned-by-status',
                title: 'Soft Deleted 2',
                status: 'deleted',
              },
            ];
          }
          return [];
        },
      } as unknown as ApiClient;

      const diff = await diffPlanWithRemote(client, workDir);
      const remoteOnlySlugs = diff.entries
        .filter((e) => e.status === 'remote_only')
        .map((e) => e.slug);
      expect(remoteOnlySlugs).toEqual(['orphan-active']);
      expect(diff.summary.remoteOnly).toBe(1);
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  });
});
