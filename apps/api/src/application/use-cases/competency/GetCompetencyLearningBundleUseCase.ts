import type { ICompetencyRepository } from '../../../domain/ports/ICompetencyRepository';
import type { IContentRepository } from '../../../domain/ports/IContentRepository';
import type { ITaskRepository } from '../../../domain/ports/ITaskRepository';
import type { ISourceRepository } from '../../../domain/ports/ISourceRepository';
import type { BackwardScaffoldingGenerator } from '../../services/BackwardScaffoldingGenerator';
import type { CompetencyLearningBundle } from '@flashlearn/shared';

export class GetCompetencyLearningBundleUseCase {
  constructor(
    private readonly competencyRepo: ICompetencyRepository,
    private readonly contentRepo: IContentRepository,
    private readonly taskRepo: ITaskRepository,
    private readonly sourceRepo: ISourceRepository,
    private readonly scaffoldingGenerator: BackwardScaffoldingGenerator
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

    // 3. Citations
    const citations: string[] = [];
    if (competency.sourceId) {
      const source = await this.sourceRepo.findById(competency.sourceId);
      if (source) {
        citations.push(`${source.code} v${source.version}: ${source.title}`);
      }
    }

    // 4. Backward Scaffolding Generation
    const scaffolding = this.scaffoldingGenerator.generate(node, tasks, citations);

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
      readingMaterials,
      workedExamples: scaffolding.workedExamples,
      jobAid: scaffolding.jobAid,
      microSandbox: scaffolding.microSandbox,
    };
  }
}
