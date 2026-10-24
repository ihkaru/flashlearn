import { describe, test, expect, spyOn } from 'bun:test';
import { runCli } from '../src/index';
import { ExitCode } from '../src/core/envelope';

describe('FlashLearn CLI Advanced Capabilities (Phases 11-13)', () => {
  let stdoutData = '';
  let stderrData = '';

  const captureOutput = () => {
    stdoutData = '';
    stderrData = '';
    spyOn(process.stdout, 'write').mockImplementation((chunk: any) => {
      stdoutData += String(chunk);
      return true;
    });
    spyOn(process.stderr, 'write').mockImplementation((chunk: any) => {
      stderrData += String(chunk);
      return true;
    });
  };

  test('Phase 11 Adversarial Stress Test: task create with adversarial dilemma spec and dry-run', async () => {
    // 1. Action help includes adversarial spec
    captureOutput();
    let code = await runCli(['task', 'create', '--help']);
    expect(code).toBe(ExitCode.SUCCESS);
    let parsed = JSON.parse(stdoutData);
    expect(parsed.data.title).toBe('FlashLearn CLI: task create');
    expect(parsed.data.description).toContain('adversarial');
    const advArg = parsed.data.target.args.find((a: any) => a.name === '--adversarial-spec');
    expect(advArg).toBeDefined();

    // 2. Dry-run creation with inline adversarial spec
    captureOutput();
    code = await runCli([
      'task',
      'create',
      '--competency-id=comp_adv_123',
      '--title=Audit Cepat Fasilitas Kritis',
      '--scenario=Vendor menyerahkan dokumen data center dengan omisi sertifikat.',
      '--type=adversarial_dilemma',
      '--adversarial-spec={"trapType":"OMISSION_DATA","correctDisposition":"REJECT_AND_DEMAND_DATA","trapCues":[{"cue":"Sertifikat belum terlampir","weight":1}]}',
      '--dry-run',
    ]);
    expect(code).toBe(ExitCode.SUCCESS);
    parsed = JSON.parse(stdoutData);
    expect(parsed.data.dryRun).toBe(true);
    expect(parsed.data.target.payload.taskType).toBe('adversarial_dilemma');
    expect(parsed.data.target.payload.adversarialSpec.trapType).toBe('OMISSION_DATA');
  });

  test('Domain Synthesizer & Autonomous Builder: workspace/domain synthesize from markdown', async () => {
    // 1. Action help
    captureOutput();
    let code = await runCli(['workspace', 'synthesize', '--help']);
    expect(code).toBe(ExitCode.SUCCESS);
    let parsed = JSON.parse(stdoutData);
    expect(parsed.data.title).toBe('FlashLearn CLI: workspace synthesize');
    expect(parsed.data.description).toContain('Tarjan SCC');

    // 2. Dry-run synthesis from sample markdown
    captureOutput();
    code = await runCli([
      'domain',
      'synthesize',
      '--workspace-name=Pengadaan Berkelanjutan',
      '--source-files=./docs/samples/sop-manajemen-risiko-vendor.md',
      '--dry-run',
    ]);
    expect(code).toBe(ExitCode.SUCCESS);
    parsed = JSON.parse(stdoutData);
    expect(parsed.data.dryRun).toBe(true);
    expect(parsed.data.dagIsAcyclic).toBe(true);
    expect(parsed.data.sourcesCount).toBe(1);
    expect(parsed.data.chunksCount).toBe(8);
    expect(parsed.data.competenciesCount).toBe(3);
    expect(parsed.data.gatesCount).toBe(3);
    expect(parsed.data.tasksCount).toBe(3);
  });

  test('Phase 12 Adaptive Diagnostic Placement: diagnostic start, next, and submit CLI actions', async () => {
    // 1. Diagnostic help
    captureOutput();
    let code = await runCli(['diagnostic', '--help']);
    expect(code).toBe(ExitCode.SUCCESS);
    let parsed = JSON.parse(stdoutData);
    expect(parsed.data.title).toBe('FlashLearn CLI: diagnostic');
    expect(parsed.data.description).toContain('Knowledge Space Theory');

    // 2. Dry-run start diagnostic
    captureOutput();
    code = await runCli(['diagnostic', 'start', 'ws_kst_test_123', '--dry-run']);
    expect(code).toBe(ExitCode.SUCCESS);
    parsed = JSON.parse(stdoutData);
    expect(parsed.data.dryRun).toBe(true);
    expect(parsed.data.message).toContain('ws_kst_test_123');

    // 3. Dry-run submit probe solution
    captureOutput();
    code = await runCli([
      'diagnostic',
      'submit',
      'diag_sess_456',
      '--submission={"nilai_dasar":100}',
      '--dry-run',
    ]);
    expect(code).toBe(ExitCode.SUCCESS);
    parsed = JSON.parse(stdoutData);
    expect(parsed.data.dryRun).toBe(true);
    expect(parsed.data.submission.nilai_dasar).toBe(100);
  });

  test('Phase 13 Double-Blind Multi-Rater Consensus: assign-reviewers, score, and arbitrate actions', async () => {
    // 1. Action help includes assign-reviewers
    captureOutput();
    let code = await runCli(['attempt', 'assign-reviewers', '--help']);
    expect(code).toBe(ExitCode.SUCCESS);
    let parsed = JSON.parse(stdoutData);
    expect(parsed.data.title).toBe('FlashLearn CLI: attempt assign-reviewers');
    expect(parsed.data.description).toContain('double-blind');

    // 2. Dry-run assign reviewers
    captureOutput();
    code = await runCli([
      'attempt',
      'assign-reviewers',
      'att_test_123',
      '--primary=usr_rater_1',
      '--secondary=usr_rater_2',
      '--dry-run',
    ]);
    expect(code).toBe(ExitCode.SUCCESS);
    parsed = JSON.parse(stdoutData);
    expect(parsed.data.dryRun).toBe(true);
    expect(parsed.data.primaryReviewerId).toBe('usr_rater_1');

    // 3. Dry-run submit blind scorecard
    captureOutput();
    code = await runCli([
      'attempt',
      'score',
      '--blind-token=bln_abc12345',
      '--rubric-scores={"c1":90,"c2":85}',
      '--dry-run',
    ]);
    expect(code).toBe(ExitCode.SUCCESS);
    parsed = JSON.parse(stdoutData);
    expect(parsed.data.dryRun).toBe(true);
    expect(parsed.data.rubricScores.c1).toBe(90);

    // 4. Dry-run arbitrate
    captureOutput();
    code = await runCli([
      'attempt',
      'arbitrate',
      'att_test_123',
      '--score=91',
      '--notes=Final Chief Arbiter resolution',
      '--dry-run',
    ]);
    expect(code).toBe(ExitCode.SUCCESS);
    parsed = JSON.parse(stdoutData);
    expect(parsed.data.dryRun).toBe(true);
    expect(parsed.data.message).toContain('att_test_123');
  });
});
