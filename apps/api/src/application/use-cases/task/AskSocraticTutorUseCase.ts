import type { ITaskRepository } from '../../../domain/ports/ITaskRepository';
import type { ICompetencyRepository } from '../../../domain/ports/ICompetencyRepository';
import type { ISourceRepository } from '../../../domain/ports/ISourceRepository';
import type { IAiGateway } from '../../../domain/ports/IAiGateway';
import type {
  SocraticHintRequest,
  SocraticTutorResponse,
} from '@flashlearn/shared';

export class AskSocraticTutorUseCase {
  constructor(
    private readonly taskRepo: ITaskRepository,
    private readonly competencyRepo: ICompetencyRepository,
    private readonly sourceRepo: ISourceRepository,
    private readonly aiGateway: IAiGateway
  ) {}

  async execute(taskId: string, req: SocraticHintRequest): Promise<SocraticTutorResponse> {
    const task = await this.taskRepo.findById(taskId);
    if (!task) {
      throw new Error(`Task '${taskId}' not found`);
    }

    const competency = await this.competencyRepo.findById(task.competencyId);
    if (!competency) {
      throw new Error(`Associated competency '${task.competencyId}' not found`);
    }

    // 1. Gather relevant Corpus of Record chunks
    let chunks: Array<{ sourceCode: string; locationTag: string; content: string }> = [];

    if (competency.sourceId) {
      const source = await this.sourceRepo.findById(competency.sourceId);
      if (source) {
        const scChunks = await this.sourceRepo.listChunksBySourceId(source.id);
        chunks = scChunks.map((c) => ({
          sourceCode: source.code,
          locationTag: c.locationTag,
          content: c.content,
        }));
      }
    }

    // Fallback: search workspace chunks if none linked directly
    if (chunks.length === 0) {
      const sources = await this.sourceRepo.listByWorkspace(competency.workspaceId);
      for (const s of sources) {
        const scChunks = await this.sourceRepo.listChunksBySourceId(s.id);
        for (const c of scChunks) {
          chunks.push({
            sourceCode: s.code,
            locationTag: c.locationTag,
            content: c.content,
          });
        }
      }
    }

    const corpusContext = chunks
      .map((c) => `[${c.sourceCode} - ${c.locationTag}]\n${c.content}`)
      .join('\n\n---\n\n');

    // 2. Build Socratic Tutor RCAF Prompt with Oracle Shield
    const tutorSystemPrompt = `You are an expert Socratic Pedagogical Tutor and Academic Mentor.
You are assisting a student who is working on a consequential real-world evaluation task.

### Pedagogical Architecture (RCAF Standard):
- ROLE: Socratic Tutor & Domain Mentor.
- GOAL: Guide the student to discover and verify the solution independently through inquiry and grounded citations.
- CONTEXT: Provided Corpus of Record chunks and Task Scenario.

### 🛡️ ORACLE SHIELD (ABSOLUTE ANTI-SPOILER GUARDRAIL):
1. NEVER reveal the exact final numerical values, target figures, or formula answers from Oracle data.
2. NEVER confirm or validate whether a specific number provided by the learner is the final correct answer; instead, explain the arithmetic or logical procedure to calculate it.
3. NEVER paste the Gold Benchmark Solution or reveal the exact list of Negative Anchors (Traps).
4. NEVER give away the direct answer; your role is to ask guiding questions that prompt the student to think critically.

### CRITICAL DOs:
1. DO guide the learner using reflective questioning, conceptual deconstruction, and official citations.
2. DO refer the learner to specific clauses, articles, or location tags from the provided Corpus of Record.
3. DO cite the exact sourceCode and locationTag in "citationReferences".
4. DO provide a thoughtful, open-ended question in "reflectiveQuestion" that forces active critical thinking.
5. DO suggest a clear, immediate cognitive action in "suggestedAction" (e.g. "Review paragraph 2 of Article 28 to check overhead limits").

### CRITICAL DON'Ts:
1. DONT reveal answers, solutions, or shortcuts.
2. DONT provide answers based on ungrounded external assumptions outside the Corpus of Record.
3. DONT output conversational filler, markdown fences, or text outside the valid JSON object.`;

    const schemaPrompt = `{
  "socraticGuidance": "Reflective guidance explaining the underlying principles without revealing the solution",
  "reflectiveQuestion": "A targeted Socratic question that prompts the student to identify their error or deduce the formula",
  "citationReferences": [
    {
      "sourceCode": "Code of the referenced source e.g. PERPRES-16-2021",
      "locationTag": "Article or clause location e.g. Pasal 26 Ayat 3",
      "relevantPrinciple": "Summary of the rule or principle stated in this clause"
    }
  ],
  "suggestedAction": "Concrete next step for the learner to take"
}`;

    const prompt = `Task Title: ${task.title}
Task Scenario:
${task.scenario}

Corpus of Record:
${corpusContext || 'No specific corpus chunks registered.'}

Learner's Question / Point of Confusion:
"${req.question}"

Task: Provide Socratic guidance to help the learner resolve their question independently without violating the Oracle Shield.`;

    try {
      return await this.aiGateway.chatJson<SocraticTutorResponse>(prompt, schemaPrompt, {
        systemPrompt: tutorSystemPrompt,
        model: process.env.AI_SMART_MODEL || process.env.AI_DEFAULT_MODEL || 'my9model-free',
        temperature: 0.2,
      });
    } catch (err: any) {
      // Resilient fallback when offline
      const primaryChunk = chunks[0];
      return {
        socraticGuidance: `Untuk menyelesaikan tugas "${task.title}", perhatikan kembali definisi komponen dan batasan metodologi yang diatur dalam rujukan resmi. Identifikasi variabel apa saja yang menjadi hak atau kewajiban sebelum melakukan kalkulasi atau analisis.`,
        reflectiveQuestion: 'Apakah Anda telah meninjau dokumen rujukan standar terkait batasan maksimal persentase atau kewenangan penunjukan?',
        citationReferences: primaryChunk
          ? [
              {
                sourceCode: primaryChunk.sourceCode,
                locationTag: primaryChunk.locationTag,
                relevantPrinciple: 'Batasan kepatuhan dan formula acuan standar',
              },
            ]
          : [],
        suggestedAction: 'Buka kembali naskah rujukan resmi pada bagian ketentuan teknis dan ulangi pemeriksaan langkah demi langkah.',
      };
    }
  }
}
