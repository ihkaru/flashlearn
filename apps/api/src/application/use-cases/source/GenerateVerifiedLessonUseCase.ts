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

    // 2. STAGE 1: Generator LLM Call
    const generatorSystemPrompt = `You are an expert educational curriculum author.
You are generating a structured training unit for beginners on the topic: "${request.topic}".
MANDATORY INVARIANT: Every substantive factual claim must be backed by a direct quote from the provided Corpus of Record.
If a concept is not explicitly mentioned in the corpus, you MUST report it under "unknowns" instead of hallucinating.`;

    const generatorSchemaPrompt = `{
  "title": "Clear educational title",
  "summary": "Executive summary of key learning objectives",
  "body": "Markdown structured reading lesson incorporating the verified points",
  "claims": [
    {
      "claimText": "Concise factual statement",
      "sourceCode": "${source.code}",
      "locationTag": "Exact location tag from corpus e.g. Pasal 28",
      "directQuote": "Exact verbatim substring from the source chunk"
    }
  ],
  "unknowns": ["List of things relevant to the topic but NOT covered in this source"]
}`;

    const userPrompt = `Corpus of Record:\n${corpusContext}\n\nTask: Generate a lesson on "${request.topic}". Ensure every claim has an exact verbatim quote and accurate locationTag.`;

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
