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
});
