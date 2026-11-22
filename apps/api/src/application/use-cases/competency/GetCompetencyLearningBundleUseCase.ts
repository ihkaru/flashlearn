import type { ICompetencyRepository } from '../../../domain/ports/ICompetencyRepository';
import type { IContentRepository } from '../../../domain/ports/IContentRepository';
import type { ITaskRepository } from '../../../domain/ports/ITaskRepository';
import type { ISourceRepository } from '../../../domain/ports/ISourceRepository';
import type { ISpacedFlashcardRepository } from '../../../domain/ports/ISpacedFlashcardRepository';
import type { BackwardScaffoldingGenerator } from '../../services/BackwardScaffoldingGenerator';
import type { CompetencyLearningBundle } from '@flashlearn/shared';

export class GetCompetencyLearningBundleUseCase {
  constructor(
    private readonly competencyRepo: ICompetencyRepository,
    private readonly contentRepo: IContentRepository,
    private readonly taskRepo: ITaskRepository,
    private readonly sourceRepo: ISourceRepository,
    private readonly scaffoldingGenerator: BackwardScaffoldingGenerator,
    private readonly flashcardRepo: ISpacedFlashcardRepository
  ) {}

  async execute(competencyId: string): Promise<CompetencyLearningBundle> {
    const competency = await this.competencyRepo.findById(competencyId);
    if (!competency) {
      throw new Error(`Competency not found: ${competencyId}`);
    }

    const node = competency.toNode();

    // 1. Fetch reading materials linked to competency or matched by workspace + code
    let contents = await this.contentRepo.listByCompetency(competencyId);
    if (contents.length === 0) {
      const workspaceContents = await this.contentRepo.listByWorkspace(competency.workspaceId, true);
      contents = workspaceContents.filter(
        (c) =>
          c.title.toLowerCase().includes(competency.code.toLowerCase()) ||
          c.props.slug.toLowerCase().includes(competency.code.toLowerCase())
      );
    }

    // 2. Fetch tasks for competency
    const tasks = await this.taskRepo.listByCompetency(competencyId);

    // 3. Citations & Addressable Corpus Chunks (100% domain-agnostic from DB)
    const citations: string[] = [];
    const corpusChunks: Array<{
      id: string;
      sourceCode: string;
      sourceTitle: string;
      locationTag: string;
      content: string;
      sha256Hash: string;
    }> = [];

    if (competency.sourceId) {
      const source = await this.sourceRepo.findById(competency.sourceId);
      if (source) {
        citations.push(`${source.code} v${source.version}: ${source.title}`);
        const chunks = await this.sourceRepo.listChunksBySourceId(source.id);
        for (const chk of chunks) {
          corpusChunks.push({
            id: chk.id,
            sourceCode: source.code,
            sourceTitle: source.title,
            locationTag: chk.locationTag,
            content: chk.content,
            sha256Hash: chk.sha256Hash,
          });
        }
      }
    }

    if (corpusChunks.length === 0) {
      const wsSources = await this.sourceRepo.listByWorkspace(competency.workspaceId);
      for (const source of wsSources) {
        if (citations.length === 0) {
          citations.push(`${source.code} v${source.version}: ${source.title}`);
        }
        const chunks = await this.sourceRepo.listChunksBySourceId(source.id);
        for (const chk of chunks) {
          corpusChunks.push({
            id: chk.id,
            sourceCode: source.code,
            sourceTitle: source.title,
            locationTag: chk.locationTag,
            content: chk.content,
            sha256Hash: chk.sha256Hash,
          });
        }
      }
    }

    // 4. Backward Scaffolding Generation
    const scaffolding = this.scaffoldingGenerator.generate(node, tasks, citations);

    // 5. Fetch Causal Probes (Spaced Flashcards) for Cognitive Schema Priming
    const flashcards = await this.flashcardRepo.listByCompetency(competencyId);
    const causalProbes = flashcards.map((fc) => ({
      id: fc.id,
      type: (fc.cardType || 'causal_prediction') as any,
      prompt: fc.front,
      predictionOptions: fc.predictionOptions,
      causalRationale: fc.causalRationale || fc.back,
    }));

    const readingMaterials = contents.map((c) => ({
      id: c.id,
      title: c.title,
      summary: c.props.summary,
      body: c.body,
      readingTimeMinutes: c.props.readingTimeMinutes,
      type: c.type,
    }));

    return {
      competency: node,
      corpusChunks,
      readingMaterials,
      causalProbes,
      workedExamples: scaffolding.workedExamples,
      jobAid: scaffolding.jobAid,
      microSandbox: scaffolding.microSandbox,
    };
  }
}
