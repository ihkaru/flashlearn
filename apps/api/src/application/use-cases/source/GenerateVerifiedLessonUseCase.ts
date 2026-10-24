import type { ISourceRepository } from '../../../domain/ports/ISourceRepository';
import type { IAiGateway } from '../../../domain/ports/IAiGateway';
import type { CitationValidatorService } from '../../../infrastructure/services/CitationValidatorService';
import type {
  GenerateLessonRequest,
  GenerateLessonResponse,
  VerifiedClaim,
} from '@flashlearn/shared';

export class GenerateVerifiedLessonUseCase {
  constructor(
    private readonly sourceRepo: ISourceRepository,
    private readonly aiGateway: IAiGateway,
    private readonly citationValidator: CitationValidatorService
  ) {}

  async execute(request: GenerateLessonRequest): Promise<GenerateLessonResponse> {
    // 1. Fetch Source and addressable chunks
    const source = await this.sourceRepo.findByCode(request.sourceCode);
    if (!source) {
      throw new Error(`Source with code '${request.sourceCode}' not found`);
    }

    const chunks = await this.sourceRepo.listChunksBySourceId(source.id);
    if (chunks.length === 0) {
      throw new Error(`Source '${request.sourceCode}' has no registered addressable chunks`);
    }

    // Prepare corpus index summary for the generator prompt
    const corpusContext = chunks
      .map((c) => `[${source.code} - ${c.locationTag}]\n${c.content}`)
      .join('\n\n---\n\n');

    // 2. STAGE 1: Generator LLM Call (RCAF Architecture with Granular DOs & DON'Ts)
    const generatorSystemPrompt = `You are a Master Curriculum Designer and Verifiable Knowledge Author.
Your mission is to generate a comprehensive, highly practical, and engaging training lesson on the topic: "${request.topic}".
Every substantive factual statement MUST be deterministically verifiable against the provided Corpus of Record.

### Pedagogical & Grounding Architecture (RCAF Standard):
- ROLE: Curriculum Designer & Subject-Matter Specialist.
- AUDIENCE: Developing professional learners seeking verified competence.
- CONTEXT: Provided addressable Corpus of Record chunks.

### CRITICAL DOs:
1. DO plan the educational narrative in "curriculumOutline" first, ensuring a logical learning progression.
2. DO ensure every factual statement in "claims" has an exact verbatim match in "directQuote" from the corpus.
3. DO copy characters, words, casing, and punctuation character-for-character from the source chunk into "directQuote".
4. DO extract the exact locationTag matching the chunk header (e.g. from "[${source.code} - Pasal 28]", set locationTag to "Pasal 28").
5. DO compose a rich, well-structured Markdown lesson in "body" with clear subheadings, real-world context, and key takeaways.
6. DO catalog under "unknowns" any adjacent sub-topics, exceptions, or practical questions relevant to "${request.topic}" that are NOT explicitly addressed by the provided Corpus of Record.
7. DO summarize the primary competency takeaways in "summary".

### CRITICAL DON'Ts:
1. DONT paraphrase, summarize, or alter even a single character in "directQuote" (it will fail deterministic substring and SHA-256 verification).
2. DONT extrapolate, hallucinate, or import external knowledge, regulations, or figures not explicitly present in the provided chunks.
3. DONT combine disparate sentences into one merged quote; keep each cited claim atomic and individually testable.
4. DONT leave "directQuote" empty or vague when making a factual claim in "claimText".
5. DONT guess answers to ungrounded aspects of "${request.topic}"—instead, place them transparently in "unknowns".
6. DONT output conversational filler, markdown formatting blocks (like \`\`\`json), or text outside the valid JSON object.`;

    const generatorSchemaPrompt = `{
  "curriculumOutline": "Structured outline of topics and verified learning objectives",
  "title": "Clear, professional educational title",
  "summary": "Executive summary of key learning objectives and competency outcomes",
  "body": "Markdown structured reading lesson incorporating the verified points with clear headings",
  "claims": [
    {
      "claimText": "Concise factual statement",
      "sourceCode": "${source.code}",
      "locationTag": "Exact location tag from chunk header e.g. Pasal 28",
      "directQuote": "Exact verbatim substring from the source chunk"
    }
  ],
  "unknowns": ["List of relevant questions or edge cases NOT covered in this source corpus"]
}`;

    const userPrompt = `Corpus of Record:
${corpusContext}

Task: Generate an educational lesson on "${request.topic}".
Ensure every claim has an exact verbatim directQuote and accurate locationTag matching the Corpus of Record.`;

    const generatorOutput = await this.aiGateway.chatJson<{
      title: string;
      summary: string;
      body: string;
      claims: VerifiedClaim[];
      unknowns: string[];
    }>(userPrompt, generatorSchemaPrompt, {
      systemPrompt: generatorSystemPrompt,
      model: process.env.AI_SMART_MODEL || process.env.AI_DEFAULT_MODEL || 'my9model-free',
    });

    // 3. STAGE 2: Deterministic Citation Validation (Non-LLM)
    const rawClaims = generatorOutput.claims || [];
    const validationResult = await this.citationValidator.validateClaims(rawClaims);

    // Filter out invalid claims from the final verified payload
    const verifiedClaims = validationResult.details.map((d) => ({
      claimText: d.claimText,
      sourceCode: d.sourceCode,
      locationTag: d.locationTag,
      directQuote: d.directQuote,
      isVerified: d.isValid,
      verificationError: d.error,
    }));

    return {
      title: generatorOutput.title,
      summary: generatorOutput.summary,
      body: generatorOutput.body,
      verifiedClaims,
      unknowns: generatorOutput.unknowns || [],
      validationResult,
    };
  }
}
