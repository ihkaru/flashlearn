import type { ITaskRepository } from '../../../domain/ports/ITaskRepository';
import type { ICompetencyRepository } from '../../../domain/ports/ICompetencyRepository';
import type { ISourceRepository } from '../../../domain/ports/ISourceRepository';
import type { IContentRepository } from '../../../domain/ports/IContentRepository';
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
    private readonly aiGateway: IAiGateway,
    private readonly contentRepo?: IContentRepository
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

    // 2. Gather Educational Materials Delivered to the Learner (Curriculum Context)
    let materialsContext = '';
    if (this.contentRepo) {
      try {
        const contents = await this.contentRepo.listByWorkspace(competency.workspaceId, false, false);
        if (contents.length > 0) {
          materialsContext = contents
            .map((c) => {
              const bodySnippet = c.body ? c.body.slice(0, 1500) : '';
              return `[Modul Materi: "${c.title}" (Tipe: ${c.type})]\nRingkasan: ${c.summary || 'Tidak ada ringkasan'}\nKonten Pokok Disajikan:\n${bodySnippet}`;
            })
            .join('\n\n---\n\n');
        }
      } catch {
        // Resilient fallback if content repo lookup encounters issue
      }
    }

    // 3. Extract domain/task-specific Socratic configuration if defined in blueprint
    const socraticConfig = (task.oracleData as any)?.socraticConfig || (task.oracleData as any)?.socratic_config;
    const tutorRole = socraticConfig?.rolePersona || socraticConfig?.pedagogicalRole || 'Socratic Tutor & Domain Mentor';
    const domainDos = Array.isArray(socraticConfig?.dos)
      ? '\n' + socraticConfig.dos.map((d: string, i: number) => `${i + 7}. DO: ${d}`).join('\n')
      : '';
    const domainDonts = Array.isArray(socraticConfig?.donts)
      ? '\n' + socraticConfig.donts.map((d: string, i: number) => `${i + 4}. DONT: ${d}`).join('\n')
      : '';
    const domainFocus = Array.isArray(socraticConfig?.focusAreas)
      ? `\n\n### 🎯 DOMAIN-SPECIFIC PEDAGOGICAL INQUIRY FOCUS:\n${socraticConfig.focusAreas.map((f: string) => `- Priority: ${f}`).join('\n')}`
      : '';

    // Build Socratic Tutor RCAF Prompt with Oracle Shield & Curriculum Awareness
    const tutorSystemPrompt = `You are an expert Socratic Pedagogical Tutor and Academic Mentor.
You are assisting a student who is working on a consequential real-world evaluation task.

### Pedagogical Architecture (RCAF Standard):
- ROLE: ${tutorRole}.
- GOAL: Guide the student to discover and verify the solution independently through inquiry, curriculum awareness, and grounded citations.
- CONTEXT: Provided Corpus of Record chunks, Delivered Educational Materials, and Task Scenario.

### 📚 CURRICULUM AWARENESS DIRECTIVE (UNDERSTANDING LEARNER CONFUSION):
You have access to the exact educational materials, modules, and lessons taught to this learner.
When the learner asks a question or expresses confusion:
1. Cross-examine their confusion against what was taught in their delivered materials.
2. Spot root misconceptions: determine whether they are confusing distinct terms (e.g. overhead vs markup, gross vs net) or misapplying a step from their lessons.
3. Bridge the theoretical concepts from their curriculum with the practical scenario of the current task.

### 🛡️ ORACLE SHIELD (ABSOLUTE ANTI-SPOILER GUARDRAIL):
1. NEVER reveal the exact final numerical values, target figures, or formula answers from Oracle data.
2. NEVER confirm or validate whether a specific number provided by the learner is the final correct answer; instead, explain the arithmetic or logical procedure to calculate it.
3. NEVER paste the Gold Benchmark Solution or reveal the exact list of Negative Anchors (Traps).
4. NEVER give away the direct answer; your role is to ask guiding questions that prompt the student to think critically.

### CRITICAL DOs:
1. DO guide the learner using reflective questioning, conceptual deconstruction, and official citations.
2. DO connect their confusion to the specific concepts explained in their delivered educational materials.
3. DO refer the learner to specific clauses, articles, or location tags from the provided Corpus of Record.
4. DO cite the exact sourceCode and locationTag in "citationReferences".
5. DO provide a thoughtful, open-ended question in "reflectiveQuestion" that forces active critical thinking.
6. DO suggest a clear, immediate cognitive action in "suggestedAction".${domainDos}

### CRITICAL DON'Ts:
1. DONT reveal answers, solutions, or shortcuts.
2. DONT provide answers based on ungrounded external assumptions outside the Corpus of Record.
3. DONT output conversational filler, markdown fences, or text outside the valid JSON object.${domainDonts}${domainFocus}`;

    const schemaPrompt = `{
  "socraticGuidance": "Reflective guidance explaining the underlying principles and addressing student misconception without revealing the solution",
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

Delivered Educational Materials & Lessons Presented to the Learner:
${materialsContext || 'No specific learning modules delivered for this workspace yet.'}

Learner's Question / Point of Confusion:
"${req.question}"

Task: Provide Socratic guidance to help the learner resolve their question independently without violating the Oracle Shield. Analyze their confusion against what was taught in their curriculum.`;

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
        socraticGuidance: `Untuk menyelesaikan tugas "${task.title}", perhatikan kembali materi pembelajaran yang telah dipelajari serta batasan metodologi dalam rujukan resmi. Identifikasi variabel apa saja yang menjadi hak atau kewajiban sebelum melakukan kalkulasi atau analisis.`,
        reflectiveQuestion: 'Apakah Anda telah meninjau kembali modul materi terkait batasan maksimal persentase atau kewenangan penunjukan?',
        citationReferences: primaryChunk
          ? [
              {
                sourceCode: primaryChunk.sourceCode,
                locationTag: primaryChunk.locationTag,
                relevantPrinciple: 'Batasan kepatuhan dan formula acuan standar',
              },
            ]
          : [],
        suggestedAction: 'Buka kembali modul materi yang telah dipelajari dan naskah rujukan resmi pada bagian ketentuan teknis.',
      };
    }
  }
}
