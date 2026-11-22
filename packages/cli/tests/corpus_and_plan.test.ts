import { describe, expect, it, spyOn } from 'bun:test';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { strToU8, zipSync } from 'fflate';
import { runCli } from '../src/index';
import { ExitCode } from '../src/core/envelope';
import { loadCurriculumPlan } from '../src/core/plan/plan-builder';
import {
  diffPlanWithRemote,
  pruneRemoteFromPlan,
  pullRemoteToPlan,
  pushPlanToRemote,
} from '../src/core/plan/plan-remote-sync';
import type { ApiClient } from '../src/core/client';

function buildSyntheticEpub(destPath: string) {
  const zipped = zipSync({
    'mimetype': strToU8('application/epub+zip'),
    'META-INF/container.xml': strToU8(
      `<?xml version="1.0"?><container version="1.0"><rootfiles><rootfile full-path="OEBPS/content.opf"/></rootfiles></container>`
    ),
    'OEBPS/content.opf': strToU8(`<?xml version="1.0"?>
      <package><metadata><dc:title>Kriptografi Modern Ebook</dc:title></metadata>
      <manifest>
        <item id="ch1" href="ch1.xhtml" media-type="application/xhtml+xml"/>
        <item id="ch2" href="ch2.xhtml" media-type="application/xhtml+xml"/>
      </manifest>
      <spine><itemref idref="ch1"/><itemref idref="ch2"/></spine></package>`),
    'OEBPS/ch1.xhtml': strToU8(
      `<html><body><h1>Bab 1: Enkripsi Asimetris dan Kunci Publik</h1><p>${'Enkripsi asimetris memisahkan kunci pengunci dan pembuka untuk keamanan jaringan modern. '.repeat(28)}</p></body></html>`
    ),
    'OEBPS/ch2.xhtml': strToU8(
      `<html><body><h1>Bab 2: Langkah Implementasi Tanda Tangan Digital</h1><p>${'Langkah verifikasi tanda tangan memakai hash pesan dan kunci publik pengirim secara deterministik. '.repeat(28)}</p></body></html>`
    ),
  });
  writeFileSync(destPath, zipped);
}

function buildSyntheticPptx(destPath: string) {
  const zipped = zipSync({
    'ppt/slides/slide1.xml': strToU8(
      `<p:sld><a:p><a:r><a:t>Enkripsi Asimetris pada TLS</a:t></a:r></a:p><a:p><a:r><a:t>Handshake TLS menukar kunci sesi aman.</a:t></a:r></a:p></p:sld>`
    ),
    'ppt/notesSlides/notesSlide1.xml': strToU8(
      `<p:notes><a:p><a:r><a:t>Tekankan bahwa RSA/ECDH hanya dipakai saat handshake awal.</a:t></a:r></a:p></p:notes>`
    ),
    'ppt/slides/slide2.xml': strToU8(
      `<p:sld><a:p><a:r><a:t>Kasus Kebijakan &amp; Audit Sertifikat CA</a:t></a:r></a:p><a:p><a:r><a:t>Bandingkan risiko pencabutan sertifikat CRL vs OCSP.</a:t></a:r></a:p></p:sld>`
    ),
  });
  writeFileSync(destPath, zipped);
}

function createFakeRemoteClient() {
  const workspaces: any[] = [];
  const domains: any[] = [];
  const contents: any[] = [];
  const artifacts: any[] = [];
  const calls: Array<{ method: string; path: string }> = [];

  const client = {
    async request(path: string, opts: any = {}) {
      const method = opts.method || 'GET';
      calls.push({ method, path });

      if (path === '/api/v1/workspaces' && method === 'GET') return workspaces;
      if (path === '/api/v1/workspaces' && method === 'POST') {
        const ws = { id: `ws-${workspaces.length + 1}`, ...opts.body };
        workspaces.push(ws);
        return ws;
      }
      if (path.startsWith('/api/v1/workspaces/') && method === 'GET') {
        const key = path.split('/').pop();
        return workspaces.find((w) => w.id === key || w.slug === key);
      }
      if (path.startsWith('/api/v1/domains/workspace/') && method === 'GET') {
        const wsId = path.split('/').pop();
        return { domains: domains.filter((d) => d.workspaceId === wsId) };
      }
      if (path === '/api/v1/domains' && method === 'POST') {
        const dom = { id: `dom-${domains.length + 1}`, ...opts.body };
        domains.push(dom);
        return dom;
      }
      if (path.startsWith('/api/v1/contents/workspace/') && method === 'GET') {
        const wsId = path.split('/').pop();
        return contents.filter((c) => c.workspaceId === wsId);
      }
      if (path === '/api/v1/contents' && method === 'POST') {
        const c = { id: `cnt-${contents.length + 1}`, updatedAt: new Date().toISOString(), ...opts.body };
        contents.push(c);
        return c;
      }
      if (path.startsWith('/api/v1/contents/') && method === 'PUT') {
        const id = path.split('/')[4];
        const idx = contents.findIndex((c) => c.id === id);
        if (idx >= 0) contents[idx] = { ...contents[idx], ...opts.body };
        return contents[idx];
      }
      if (path.startsWith('/api/v1/contents/') && method === 'DELETE') {
        const id = path.split('/')[4];
        const idx = contents.findIndex((c) => c.id === id);
        if (idx >= 0) contents.splice(idx, 1);
        return { success: true };
      }
      return {};
    },
  } as unknown as ApiClient;

  return { client, workspaces, domains, contents, artifacts, calls };
}

describe('Phase 14 & 15: Multi-Format Corpus Slicer, Lossless Lecture Planner & Cross-PC Remote Sync', () => {
  it('indexes mixed EPUB + PPTX + Markdown books losslessly, detects cross-book overlaps, and packs <= 2h lecture units', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'fl-corpus-plan-'));
    const booksDir = join(dir, 'books');
    const workDir = join(dir, 'plan-work');
    mkdirSync(booksDir, { recursive: true });

    try {
      buildSyntheticEpub(join(booksDir, '01-kriptografi.epub'));
      buildSyntheticPptx(join(booksDir, '02-tls-deck.pptx'));
      writeFileSync(
        join(booksDir, '03-catatan-tambahan.md'),
        '# Ringkasan Hash Kriptografi\nFungsi hash SHA-256 bersifat satu arah dan deterministik.\n'
      );

      let out = '';
      const spy = spyOn(process.stdout, 'write').mockImplementation((chunk: any) => {
        out += String(chunk);
        return true;
      });

      const initCode = await runCli([
        'plan',
        'init',
        '--input',
        booksDir,
        '--dir',
        workDir,
        '--title',
        'Kriptografi Terapan Lengkap',
        '--max-unit-minutes',
        '90',
      ]);
      expect(initCode).toBe(ExitCode.SUCCESS);
      const initJson = JSON.parse(out);
      expect(initJson.data.coverage.unmappedSliceIds).toEqual([]);
      expect(initJson.data.coverage.mappedSlices).toBe(initJson.data.coverage.totalSlices);
      expect(initJson.data.coverage.totalSlices).toBeGreaterThanOrEqual(4);
      for (const u of initJson.data.units) {
        expect(u.estimatedLectureMinutes).toBeLessThanOrEqual(120);
      }

      expect(existsSync(join(workDir, 'HANDOFF.md'))).toBe(true);
      expect(existsSync(join(workDir, 'glossary-master.json'))).toBe(true);
      expect(existsSync(join(workDir, 'dag-ledger.json'))).toBe(true);

      // Session 1: fetch next handoff packet (only 2 modules, not full corpus)
      out = '';
      const nextCode = await runCli(['plan', 'next', '--dir', workDir, '--count', '2']);
      expect(nextCode).toBe(ExitCode.SUCCESS);
      const nextJson = JSON.parse(out);
      expect(nextJson.data.nextBatch).toHaveLength(2);
      expect(nextJson.data.nextBatch[0].slices[0].content).toContain('Enkripsi');

      // Check cross-book overlap hint detected between EPUB & PPTX both mentioning "Enkripsi Asimetris"
      const corpusIdx = JSON.parse(readFileSync(join(workDir, 'corpus-index.json'), 'utf-8'));
      const withOverlap = corpusIdx.slices.filter((s: any) => (s.overlapHints || []).length > 0);
      expect(withOverlap.length).toBeGreaterThan(0);

      // Mark first module audited & verify HANDOFF.md updates for next Coding Agent session
      const firstSlug = nextJson.data.nextBatch[0].module.slug;
      out = '';
      const markCode = await runCli([
        'plan',
        'mark',
        '--dir',
        workDir,
        '--module',
        firstSlug,
        '--state',
        'audited',
      ]);
      expect(markCode).toBe(ExitCode.SUCCESS);
      const handoffText = readFileSync(join(workDir, 'HANDOFF.md'), 'utf-8');
      expect(handoffText).toContain('1` audited');

      spy.mockRestore();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('supports Cross-PC remote push, diff, prune, and pull strictly via HTTP ApiClient (zero DB access)', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'fl-remote-sync-'));
    const pcADir = join(dir, 'pc-a');
    const pcBDir = join(dir, 'pc-b');
    mkdirSync(join(pcADir, 'books'), { recursive: true });

    try {
      writeFileSync(join(pcADir, 'books', 'intro.md'), '# Dasar HTTP Status\nStatus 200 OK, 404 Not Found, 500 Server Error.\n');

      let out = '';
      const spy = spyOn(process.stdout, 'write').mockImplementation((chunk: any) => {
        out += String(chunk);
        return true;
      });
      await runCli(['plan', 'init', '--input', join(pcADir, 'books'), '--dir', pcADir, '--title', 'HTTP Cepat']);
      spy.mockRestore();

      const plan = loadCurriculumPlan(pcADir);
      const mod = plan.modules[0];
      const validMicroPayload = {
        schemaVersion: 'uila-v2',
        knowledgeProfile: 'micro_know',
        estimatedMinutes: 3,
        learningObjective: 'Mengenali status HTTP dasar.',
        microKnow: {
          coreIdea: 'Status 2xx sukses, 4xx salah klien, 5xx error server.',
          whyItMatters: 'Mempercepat debugging API.',
          concreteExamples: [{ label: '404', detail: 'Resource tidak ditemukan.' }],
          keyTakeaways: ['4xx = klien', '5xx = server'],
        },
        glossary: [{ term: 'Idempoten', definition: 'Aman diulang tanpa efek ganda.', tier: 2 }],
        uila: {
          groundingDecision: { mode: 'direct_formalism', priorKnowledgeAssumed: 'familiar', setupCostSeconds: 5, rationale: 'Ringkas.' },
          block1_anomaly: { groundState: '', oldWay: '', breakdownPoint: '' },
          block2_grounding: {},
          block3_coreMechanics: { invariantProperty: '', variableComponents: [], contrastingCases: [] },
          block4_notationContract: { formulaOrCode: '', minimalFormalization: '', termsDeconstruction: [] },
          block5_stressTest: {
            probeType: 'prediction_what_if',
            prompt: 'Status 404 menandakan error di mana?',
            options: [
              { optionId: 'a', text: 'Sisi klien / URL tidak ditemukan', isCorrect: true, causalRationale: '4xx adalah client error.' },
              { optionId: 'b', text: 'Server kehabisan disk', isCorrect: false, diagnosticAxis: 'conceptGap', causalRationale: 'Disk penuh adalah 5xx.' },
            ],
            hintLadder: { level0Reflective: 'Cek digit pertama', level1Directional: '4xx vs 5xx', level2Constraint: '404 = Not Found', level3WorkedExample: '404 berarti URL salah.' },
            groundTruth: 'Sisi klien',
          },
        },
      };
      writeFileSync(join(pcADir, mod.manifestPath!), JSON.stringify(validMicroPayload, null, 2));

      const remote = createFakeRemoteClient();

      // 1. Push from PC A
      const pushRes = await pushPlanToRemote(remote.client, pcADir);
      expect(pushRes.pushedCount).toBe(1);
      expect(remote.workspaces).toHaveLength(1);
      expect(remote.domains).toHaveLength(1);
      expect(remote.contents).toHaveLength(1);

      // Verify glossary-master.json was automatically enriched
      const glossary = JSON.parse(readFileSync(join(pcADir, 'glossary-master.json'), 'utf-8'));
      expect(glossary.terms.map((t: any) => t.term)).toContain('Idempoten');

      // 2. Diff should report in_sync
      const diff1 = await diffPlanWithRemote(remote.client, pcADir);
      expect(diff1.summary.inSync).toBe(1);

      // 3. Simulate another stale remote content -> diff reports remote_only -> prune deletes it
      remote.contents.push({ id: 'cnt-orphan', workspaceId: remote.workspaces[0].id, slug: 'old-deleted-mod', title: 'Old' });
      const diff2 = await diffPlanWithRemote(remote.client, pcADir);
      expect(diff2.summary.remoteOnly).toBe(1);

      const pruneRes = await pruneRemoteFromPlan(remote.client, pcADir);
      expect(pruneRes.deletedCount).toBe(1);
      expect(remote.contents).toHaveLength(1);

      // 4. Pull onto fresh PC B directory!
      const pullRes = await pullRemoteToPlan(remote.client, remote.workspaces[0].slug, pcBDir);
      expect(pullRes.modulesPulled).toBe(1);
      expect(existsSync(join(pcBDir, 'curriculum-plan.json'))).toBe(true);
      expect(existsSync(join(pcBDir, 'HANDOFF.md'))).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
