import { describe, test, expect } from 'bun:test';
import { AiGatewayService } from '../src/infrastructure/services/AiGatewayService';
import { OracleEvaluatorClassA } from '../src/domain/services/OracleEvaluatorClassA';
import { OracleEvaluatorClassB } from '../src/domain/services/OracleEvaluatorClassB';
import { OracleEvaluatorAdversarial } from '../src/domain/services/OracleEvaluatorAdversarial';
import { GateAuthorizationEngine } from '../src/domain/services/GateAuthorizationEngine';
import { AskSocraticTutorUseCase } from '../src/application/use-cases/task/AskSocraticTutorUseCase';
import { TaskEntity } from '../src/domain/entities/Task';
import { CompetencyEntity } from '../src/domain/entities/Competency';
import { GateEntity } from '../src/domain/entities/Gate';
import { MasteryRecordEntity } from '../src/domain/entities/MasteryRecord';
import { AttemptEntity } from '../src/domain/entities/Attempt';
import type { IAiGateway, AiChatOptions } from '../src/domain/ports/IAiGateway';

function buildTask(overrides: Partial<ConstructorParameters<typeof TaskEntity>[0]> = {}): TaskEntity {
  return new TaskEntity({
    id: 'task-1',
    competencyId: 'comp-1',
    title: 'Sample Task',
    scenario: 'Evaluate this operational scenario carefully against statutory standards.',
    taskType: 'calculation',
    oracleData: {},
    rubricCriteria: [{ id: 'c1', title: 'Accuracy', weight: 100, description: 'Exact result' }],
    passingScore: 80,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

describe('LLM Gateway & Multi-Tier Oracle Integrity (Hermetic Suite)', () => {
  test('AiGatewayService fails fast when AI_GATEWAY_KEY is missing', async () => {
    const gw = new AiGatewayService({
      baseUrl: 'https://example.invalid/v1',
      apiKey: '',
      defaultModel: 'test-model',
    });

    await expect(gw.chat('hello')).rejects.toThrow('AI_GATEWAY_NOT_CONFIGURED');
    const health = await gw.healthCheck();
    expect(health.configured).toBe(false);
    expect(health.reachable).toBe(false);
  });

  test('AiGatewayService retries transient 503 and sends multi-turn messages + JSON response', async () => {
    let attempts = 0;
    let capturedBody: any = null;
    const fakeFetch = (async (_url: any, init: any) => {
      attempts++;
      capturedBody = JSON.parse(init.body);
      if (attempts === 1) {
        return new Response('Service Unavailable', { status: 503 });
      }
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: '{"ok":true,"score":95}' } }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }) as unknown as typeof fetch;

    const gw = new AiGatewayService({
      baseUrl: 'https://llm.local/v1',
      apiKey: 'sk-test-valid',
      defaultModel: 'test-model',
      fetchImpl: fakeFetch,
    });

    const parsed = await gw.chatJson<{ ok: boolean; score: number }>(
      'Evaluate now',
      '{"ok":true,"score":100}',
      {
        systemPrompt: 'You are an auditor.',
        messages: [
          { role: 'user', content: 'Earlier question' },
          { role: 'assistant', content: 'Earlier answer' },
        ],
        retries: 2,
      }
    );

    expect(attempts).toBe(2);
    expect(parsed).toEqual({ ok: true, score: 95 });
    expect(capturedBody.response_format).toEqual({ type: 'json_object' });
    expect(capturedBody.messages.length).toBe(4);
    expect(capturedBody.messages[1].content).toBe('Earlier question');
  });

  test('AiGatewayService parses SSE token streams cleanly', async () => {
    const encoder = new TextEncoder();
    const ssePayload = [
      'data: {"choices":[{"delta":{"content":"Halo "}}]}\n\n',
      ': OPENROUTER PROCESSING\n\n',
      'data: {"choices":[{"delta":{"content":"dunia"}}]}\n\n',
      'data: [DONE]\n\n',
    ].join('');

    const fakeFetch = (async () =>
      new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(ssePayload));
            controller.close();
          },
        }),
        { status: 200, headers: { 'Content-Type': 'text/event-stream' } }
      )) as unknown as typeof fetch;

    const gw = new AiGatewayService({
      baseUrl: 'https://llm.local/v1',
      apiKey: 'sk-test-valid',
      fetchImpl: fakeFetch,
    });

    let collected = '';
    for await (const token of gw.chatStream('Say hi')) {
      collected += token;
    }
    expect(collected).toBe('Halo dunia');
  });

  test('AiGatewayService handles reasoning-model truncation (auto-bumps max_tokens) and strips <think> tags in chatJson', async () => {
    const requestedMaxTokens: number[] = [];
    const fakeFetch = (async (_url: any, init: any) => {
      const body = JSON.parse(init.body);
      requestedMaxTokens.push(body.max_tokens);
      if (requestedMaxTokens.length === 1) {
        return new Response(
          `\n   \n${JSON.stringify({
            choices: [
              {
                finish_reason: 'length',
                message: { role: 'assistant', content: null, reasoning: 'thinking too long...' },
              },
            ],
          })}`,
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({
          choices: [
            {
              finish_reason: 'stop',
              message: {
                role: 'assistant',
                content: '<think>draft {"broken": 1}</think>\n```json\n{"passed":true,"score":88}\n```',
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }) as unknown as typeof fetch;

    const gw = new AiGatewayService({
      baseUrl: 'https://router.dvlpid.my.id/v1',
      apiKey: 'sk-test-valid',
      fetchImpl: fakeFetch,
    });

    const result = await gw.chatJson<{ passed: boolean; score: number }>(
      'Grade',
      '{"passed":true,"score":100}',
      { maxTokens: 512 }
    );

    expect(requestedMaxTokens).toEqual([512, 4096]);
    expect(result).toEqual({ passed: true, score: 88 });
  });

  test('OracleEvaluatorClassA fails fast instead of auto-passing 100% on misconfigured oracleData', () => {
    const evaluator = new OracleEvaluatorClassA();
    const emptyTask = buildTask({ oracleData: {} });
    expect(() => evaluator.evaluate(emptyTask, {})).toThrow('ORACLE_CLASS_A_MISCONFIGURED');
  });

  test('OracleEvaluatorClassA evaluates seed variables format with ±1% relative tolerance', () => {
    const evaluator = new OracleEvaluatorClassA();
    const seedTask = buildTask({
      oracleData: {
        formula: 'Ce / (Ca + Ce)',
        variables: { Ce: 4, Ca: 16, expectedInstability: 0.2 },
      },
      rubricCriteria: [{ id: 'expectedInstability', title: 'Instability Index', weight: 100, description: 'I' }],
    });

    const badRes = evaluator.evaluate(seedTask, { calculatedValue: 0.9 });
    expect(badRes.passed).toBe(false);
    expect(badRes.score).toBe(0);

    const goodRes = evaluator.evaluate(seedTask, { calculatedValue: 0.2 });
    expect(goodRes.passed).toBe(true);
    expect(goodRes.score).toBe(100);
  });

  test('OracleEvaluatorClassB & Adversarial fail fast when AI Gateway is offline (zero silent 100% pass)', async () => {
    const failingGateway: IAiGateway = {
      async chat() {
        throw new Error('ECONNREFUSED');
      },
      async chatJson() {
        throw new Error('ECONNREFUSED');
      },
    };

    const evalB = new OracleEvaluatorClassB(failingGateway);
    const taskB = buildTask({
      taskType: 'case_study',
      oracleData: { goldSolution: 'Reject expired certificate', negativeAnchors: [] },
    });
    await expect(evalB.evaluate(taskB, { text: 'garbage answer' })).rejects.toThrow(
      'AI_EVALUATOR_UNAVAILABLE'
    );

    const evalAdv = new OracleEvaluatorAdversarial(failingGateway);
    const taskAdv = buildTask({
      taskType: 'adversarial_dilemma',
      adversarialSpec: {
        trapType: 'AUTHORITY_PRESSURE',
        correctDisposition: 'REJECT_AND_DEMAND_DATA',
        trapCues: [{ cue: 'missing audit report', weight: 1 }],
        statutoryPolicy: 'SOP Pasal 8',
      },
    });
    await expect(evalAdv.evaluate(taskAdv, { text: 'ok' })).rejects.toThrow(
      'AI_EVALUATOR_UNAVAILABLE'
    );
  });

  test('AskSocraticTutorUseCase forwards conversationHistory to IAiGateway and fails fast offline', async () => {
    let capturedOptions: AiChatOptions | undefined;
    const recordingGateway: IAiGateway = {
      async chat() {
        return '';
      },
      async chatJson<T>(_prompt: string, _schema: string, options?: AiChatOptions): Promise<T> {
        capturedOptions = options;
        return {
          socraticGuidance: 'Periksa kembali pasal kewenangan.',
          reflectiveQuestion: 'Syarat apa yang belum lengkap?',
          citationReferences: [],
          suggestedAction: 'Tinjau Corpus of Record.',
        } as unknown as T;
      },
    };

    const task = buildTask({ taskType: 'case_study' });
    const comp = new CompetencyEntity({
      id: 'comp-1',
      workspaceId: 'ws-1',
      code: 'C-01',
      title: 'Audit',
      description: 'Audit',
      oracleClass: 'B',
      riskLevel: 'medium',
      isExpertApproved: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const useCase = new AskSocraticTutorUseCase(
      { findById: async () => task } as any,
      { findById: async () => comp } as any,
      { findById: async () => null, listByWorkspace: async () => [] } as any,
      recordingGateway
    );

    const res = await useCase.execute('task-1', {
      question: 'Kenapa ini ditolak?',
      conversationHistory: [
        { role: 'user', text: 'Halo' },
        { role: 'assistant', text: 'Ada yang bisa dibantu?' },
      ],
    });

    expect(res.socraticGuidance).toContain('pasal');
    expect(capturedOptions?.messages?.length).toBe(2);
    expect(capturedOptions?.messages?.[0].content).toBe('Halo');
  });

  test('GateAuthorizationEngine enforces Multi-Observation Entrustment (>=2 variants)', () => {
    const engine = new GateAuthorizationEngine();
    const comp = new CompetencyEntity({
      id: 'comp-1',
      workspaceId: 'ws-1',
      code: 'PROC-02',
      title: 'TCO',
      description: 'TCO',
      oracleClass: 'A',
      riskLevel: 'medium',
      isExpertApproved: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const gate = new GateEntity({
      id: 'gate-2',
      workspaceId: 'ws-1',
      level: 2,
      title: 'Senior Officer',
      description: 'Level 2',
      requirements: [
        {
          competencyId: 'comp-1',
          minimumScore: 80,
          requiredObservationsCount: 2,
          requiresHumanApproval: false,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const attempt = new AttemptEntity({
      id: 'att-1',
      taskId: 'task-1',
      userId: 'u-1',
      submission: {},
      score: 95,
      feedback: 'ok',
      assessedBy: 'oracle_class_a_deterministic',
      oracleClassUsed: 'A',
      passed: true,
      createdAt: new Date(),
    });

    const singleVariantMastery = new MasteryRecordEntity({
      id: 'm-1',
      userId: 'u-1',
      competencyId: 'comp-1',
      status: 'mastered',
      verifiedAttemptId: 'att-1',
      passedVariantCodes: ['variant_a'],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const denied = engine.evaluateEligibility({
      gate,
      competencyMap: new Map([['comp-1', comp]]),
      masteryMap: new Map([['comp-1', singleVariantMastery]]),
      attemptMap: new Map([['att-1', attempt]]),
    });
    expect(denied.eligible).toBe(false);
    expect(denied.missingCompetencies[0].title).toContain('1/2');

    const dualVariantMastery = new MasteryRecordEntity({
      id: 'm-1',
      userId: 'u-1',
      competencyId: 'comp-1',
      status: 'mastered',
      verifiedAttemptId: 'att-1',
      passedVariantCodes: ['variant_a', 'variant_b'],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const granted = engine.evaluateEligibility({
      gate,
      competencyMap: new Map([['comp-1', comp]]),
      masteryMap: new Map([['comp-1', dualVariantMastery]]),
      attemptMap: new Map([['att-1', attempt]]),
    });
    expect(granted.eligible).toBe(true);
  });
});
