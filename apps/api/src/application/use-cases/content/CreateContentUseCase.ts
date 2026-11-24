import type { IContentRepository } from '../../../domain/ports/IContentRepository';
import type { IWorkspaceRepository } from '../../../domain/ports/IWorkspaceRepository';
import {
  validateInteractiveModulePayload,
  type Content,
  type CreateContentRequest,
  type UserRole,
} from '@flashlearn/shared';

export class CreateContentUseCase {
  constructor(
    private readonly contentRepository: IContentRepository,
    private readonly workspaceRepository: IWorkspaceRepository
  ) {}

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async execute(
    currentUserId: string,
    role: UserRole,
    input: CreateContentRequest
  ): Promise<Content> {
    const isSuperadmin = role === 'superadmin';
    const workspace = await this.workspaceRepository.findById(input.workspaceId);

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    if (!workspace.canBeModifiedBy(currentUserId, isSuperadmin)) {
      throw new Error('Forbidden: You can only add content to workspaces you created');
    }

    if (input.type === 'interactive_module') {
      const report = validateInteractiveModulePayload(input.interactivePayload);
      if (!report.valid) {
        const msg = report.issues
          .filter((i) => i.severity === 'error')
          .map((i) => `${i.code}: ${i.message}`)
          .join('; ');
        throw new Error(`Invalid interactive_module payload: ${msg}`);
      }
    }

    if (input.slug !== undefined && input.slug !== '') {
      if (!/^[a-z0-9-]+$/.test(input.slug)) {
        throw new Error('Invalid slug: must contain only lowercase alphanumeric characters and hyphens (/^[a-z0-9-]+$/)');
      }
    }

    const baseSlug = input.slug || this.slugify(input.title);
    let finalSlug = baseSlug;
    let counter = 1;

    while (await this.contentRepository.findBySlug(input.workspaceId, finalSlug)) {
      finalSlug = `${baseSlug}-${counter++}`;
    }

    const entity = await this.contentRepository.create({
      workspaceId: input.workspaceId,
      domainId: input.domainId ?? null,
      competencyId: input.competencyId ?? null,
      title: input.title,
      slug: finalSlug,
      type: input.type,
      summary: input.summary,
      readingTimeMinutes: input.readingTimeMinutes || 5,
      body: input.body,
      questions: input.questions,
      interactivePayload: input.interactivePayload ?? null,
      isPublished: input.isPublished !== undefined ? input.isPublished : true,
    });

    await this.contentRepository.createVersion(
      entity.id,
      1,
      'create',
      entity.toJSON(true),
      currentUserId
    );

    return entity.toJSON();
  }
}
