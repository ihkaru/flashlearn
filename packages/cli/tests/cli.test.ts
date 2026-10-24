import { describe, test, expect, spyOn } from 'bun:test';
import { runCli } from '../src/index';
import { ExitCode } from '../src/core/envelope';
import { SCHEMA_REGISTRY } from '../src/core/schema-registry';

describe('FlashLearn Agent-First CLI (October 2026 Standards)', () => {
  // Capture stdout and stderr
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

  test('Schema Introspection: Emits valid top-level schema envelope with all 13 nouns', async () => {
    captureOutput();
    const code = await runCli(['schema']);

    expect(code).toBe(ExitCode.SUCCESS);
    expect(stdoutData).toContain('"schemaVersion": "1.0.0"');
    expect(stdoutData).toContain('"status": "success"');

    const parsed = JSON.parse(stdoutData);
    expect(parsed.data.availableNouns).toContain('workspace');
    expect(parsed.data.availableNouns).toContain('source');
    expect(parsed.data.availableNouns).toContain('competency');
    expect(parsed.data.availableNouns).toContain('task');
    expect(parsed.data.availableNouns).toContain('attempt');
    expect(parsed.data.availableNouns).toContain('gate');
    expect(parsed.data.availableNouns).toContain('content');
    expect(parsed.data.availableNouns).toContain('quiz');
    expect(parsed.data.availableNouns).toContain('flashcard');
    expect(parsed.data.availableNouns).toContain('audit');
    expect(parsed.data.availableNouns).toContain('apikey');
    expect(parsed.data.availableNouns).toContain('auth');
    expect(parsed.data.availableNouns).toContain('schema');
  });

  test('Schema Introspection: Returns specific noun actions and arguments', async () => {
    captureOutput();
    const code = await runCli(['schema', 'task']);

    expect(code).toBe(ExitCode.SUCCESS);
    const parsed = JSON.parse(stdoutData);
    expect(parsed.data.noun).toBe('task');
    const actions = parsed.data.actions.map((a: any) => a.action);
    expect(actions).toContain('list');
    expect(actions).toContain('get');
    expect(actions).toContain('create');
    expect(actions).toContain('socratic-hint');
  });

  test('Context Window Optimization: Field masking via --fields filters output properties', async () => {
    captureOutput();
    const code = await runCli(['schema', 'competency', '--fields=noun,description']);

    expect(code).toBe(ExitCode.SUCCESS);
    const parsed = JSON.parse(stdoutData);
    expect(parsed.data.noun).toBe('competency');
    expect(parsed.data.description).toBeDefined();
    expect(parsed.data.actions).toBeUndefined(); // Filtered out to save tokens!
  });

  test('Validation Guardrail: Missing required flag exits with code 64 (EX_USAGE)', async () => {
    captureOutput();
    const code = await runCli(['workspace', 'create']);

    expect(code).toBe(ExitCode.VALIDATION_ERROR); // 64
    expect(stderrData).toContain('"status": "error"');
    const errorParsed = JSON.parse(stderrData);
    expect(errorParsed.error.code).toBe('MISSING_ARGUMENT');
  });

  test('Safety Guardrail: Destructive action without --yes exits with code 2 (USAGE_ERROR)', async () => {
    captureOutput();
    const code = await runCli(['workspace', 'delete', 'ws_target_123']);

    expect(code).toBe(ExitCode.USAGE_ERROR); // 2
    expect(stderrData).toContain('"code": "CONFIRMATION_REQUIRED"');
    const errorParsed = JSON.parse(stderrData);
    expect(errorParsed.error.suggestedFix).toContain('--yes');
  });

  test('Safety Guardrail: Mutating action with --dry-run simulates execution without HTTP call', async () => {
    captureOutput();
    const code = await runCli([
      'workspace',
      'create',
      '--name=Simulated Workspace',
      '--dry-run',
    ]);

    expect(code).toBe(ExitCode.SUCCESS);
    const parsed = JSON.parse(stdoutData);
    expect(parsed.data.dryRun).toBe(true);
    expect(parsed.data.target.method).toBe('POST');
    expect(parsed.data.target.path).toBe('/api/v1/workspaces');
    expect(parsed.data.target.payload.name).toBe('Simulated Workspace');
  });

  test('Zero-Omission Resource Coverage: Every learning resource has registered actions and schema', () => {
    const requiredResources = [
      'workspace',
      'source',
      'competency',
      'task',
      'attempt',
      'gate',
      'content',
      'quiz',
      'flashcard',
      'audit',
      'apikey',
      'auth',
    ];

    for (const res of requiredResources) {
      expect(SCHEMA_REGISTRY[res]).toBeDefined();
      expect(SCHEMA_REGISTRY[res].actions.length).toBeGreaterThanOrEqual(1);
      for (const act of SCHEMA_REGISTRY[res].actions) {
        expect(act.action).toBeDefined();
        expect(act.description).toBeDefined();
        expect(act.example).toBeDefined();
        expect(typeof act.mutating).toBe('boolean');
      }
    }
  });

  test('Unknown Noun: Returns code 127 (COMMAND_NOT_FOUND)', async () => {
    captureOutput();
    const code = await runCli(['invalid_resource_xyz', 'list']);

    expect(code).toBe(ExitCode.COMMAND_NOT_FOUND); // 127
    const errorParsed = JSON.parse(stderrData);
    expect(errorParsed.error.code).toBe('UNKNOWN_NOUN');
  });

  test('Comprehensive Help System: Global, Noun-level, and Action-level help', async () => {
    // 1. Global help
    captureOutput();
    let code = await runCli(['--help']);
    expect(code).toBe(ExitCode.SUCCESS);
    let parsed = JSON.parse(stdoutData);
    expect(parsed.data.title).toContain('FlashLearn Agent-First CLI');
    expect(parsed.data.globalFlags['--tail <n>']).toBeDefined();
    expect(parsed.data.globalFlags['--limit <n>']).toBeDefined();
    expect(parsed.data.globalFlags['--filter <k=v>']).toBeDefined();

    // 2. Noun-level help
    captureOutput();
    code = await runCli(['task', '--help']);
    expect(code).toBe(ExitCode.SUCCESS);
    parsed = JSON.parse(stdoutData);
    expect(parsed.data.title).toBe('FlashLearn CLI: task');
    expect(parsed.data.target.actions.length).toBeGreaterThanOrEqual(4);

    // 3. Action-level granular help
    captureOutput();
    code = await runCli(['task', 'create', '--help']);
    expect(code).toBe(ExitCode.SUCCESS);
    parsed = JSON.parse(stdoutData);
    expect(parsed.data.title).toBe('FlashLearn CLI: task create');
    expect(parsed.data.target.args).toBeDefined();
    expect(parsed.data.examples.length).toBeGreaterThanOrEqual(1);
  });

  test('Token Optimization: Slicing from last line via --tail / --last and filtering via --filter', async () => {
    const { transformData } = await import('../src/core/transform');

    const sampleList = [
      { id: '1', role: 'guest', name: 'Alpha' },
      { id: '2', role: 'creator', name: 'Beta' },
      { id: '3', role: 'creator', name: 'Gamma' },
      { id: '4', role: 'guest', name: 'Delta' },
      { id: '5', role: 'creator', name: 'Epsilon' },
    ];

    // 1. Tail / Last (take last 2 items)
    const tailRes = transformData(sampleList, { tail: 2 });
    expect(tailRes.itemCount).toBe(2);
    expect(tailRes.data.map((d: any) => d.id)).toEqual(['4', '5']);
    expect(tailRes.totalBeforeSlice).toBe(5);

    // 2. Filter key=value + tail
    const filterRes = transformData(sampleList, { filter: 'role=creator', tail: 2 });
    expect(filterRes.itemCount).toBe(2);
    expect(filterRes.totalBeforeSlice).toBe(3); // 3 creators total
    expect(filterRes.data.map((d: any) => d.id)).toEqual(['3', '5']); // last 2 creators

    // 3. Limit (take first 2 items)
    const limitRes = transformData(sampleList, { limit: 2 });
    expect(limitRes.itemCount).toBe(2);
    expect(limitRes.data.map((d: any) => d.id)).toEqual(['1', '2']);

    // 4. Combined: Filter + Tail + Field Masking
    const combinedRes = transformData(sampleList, {
      filter: 'role=creator',
      tail: 1,
      fields: ['id', 'name'],
    });
    expect(combinedRes.itemCount).toBe(1);
    expect(combinedRes.data[0]).toEqual({ id: '5', name: 'Epsilon' });
    expect(combinedRes.data[0].role).toBeUndefined(); // Filtered out to save tokens!
  });

  test('Learning Stage Creation: Material and Quiz content creation with simulated dry-run', async () => {
    // 1. Materi Creation
    captureOutput();
    let code = await runCli([
      'content',
      'create',
      '--workspace-id=ws_test',
      '--title=Tata Kelola Pengadaan',
      '--type=materi',
      '--body=# Bab 1: Dasar Hukum',
      '--dry-run',
    ]);
    expect(code).toBe(ExitCode.SUCCESS);
    let parsed = JSON.parse(stdoutData);
    expect(parsed.data.dryRun).toBe(true);
    expect(parsed.data.target.payload.type).toBe('materi');
    expect(parsed.data.target.payload.body).toBe('# Bab 1: Dasar Hukum');

    // 2. Quiz / Combined Creation with Questions
    captureOutput();
    code = await runCli([
      'content',
      'create',
      '--workspace-id=ws_test',
      '--title=Kuis Evaluasi Pajak',
      '--type=quiz',
      '--questions=[{"id":"q1","question":"Berapa tarif PPN standar?","options":[{"id":"o1","text":"11%","isCorrect":true}],"explanation":"PPN 11%"}]',
      '--dry-run',
    ]);
    expect(code).toBe(ExitCode.SUCCESS);
    parsed = JSON.parse(stdoutData);
    expect(parsed.data.dryRun).toBe(true);
    expect(parsed.data.target.payload.questions.length).toBe(1);
    expect(parsed.data.target.payload.questions[0].question).toContain('PPN');
  });

  test('Domain Diagnostics: workspace/domain describe action and help', async () => {
    // 1. Action help
    captureOutput();
    let code = await runCli(['workspace', 'describe', '--help']);
    expect(code).toBe(ExitCode.SUCCESS);
    let parsed = JSON.parse(stdoutData);
    expect(parsed.data.title).toBe('FlashLearn CLI: workspace describe');
    expect(parsed.data.description).toContain('readiness');

    // 2. Missing argument guardrail
    captureOutput();
    code = await runCli(['workspace', 'describe']);
    expect(code).toBe(ExitCode.VALIDATION_ERROR);
    expect(stderrData).toContain('MISSING_ARGUMENT');

    // 3. Domain alias works identically
    captureOutput();
    code = await runCli(['domain', 'describe']);
    expect(code).toBe(ExitCode.VALIDATION_ERROR);
    expect(stderrData).toContain('MISSING_ARGUMENT');
  });
});
