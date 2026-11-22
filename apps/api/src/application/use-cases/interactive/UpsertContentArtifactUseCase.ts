import { createHash } from 'node:crypto';
import {
  auditHtmlArtifactSafety,
  type ContentArtifact,
  type ContentArtifactKind,
  type ContentArtifactMetadata,
  type UserRole,
} from '@flashlearn/shared';
import type { IContentRepository } from '../../../domain/ports/IContentRepository';
import type { IWorkspaceRepository } from '../../../domain/ports/IWorkspaceRepository';
import type { IInteractiveRepository } from '../../../domain/ports/IInteractiveRepository';

export interface UpsertArtifactInput {
  contentId: string;
  kind: ContentArtifactKind;
  htmlContent: string;
  mimeType?: string;
  metadata?: ContentArtifactMetadata | null;
}

export class UpsertContentArtifactUseCase {
  constructor(
    private readonly contentRepository: IContentRepository,
    private readonly workspaceRepository: IWorkspaceRepository,
    private readonly interactiveRepository: IInteractiveRepository
  ) {}

  async execute(
    currentUserId: string,
    role: UserRole,
    input: UpsertArtifactInput
  ): Promise<{ artifact: Omit<ContentArtifact, 'htmlContent'>; warnings: string[] }> {
    const isSuperadmin = role === 'superadmin';
    const content = await this.contentRepository.findById(input.contentId);
    if (!content) {
      throw new Error('Content not found');
    }

    const workspace = await this.workspaceRepository.findById(content.workspaceId);
    if (!workspace || !workspace.canBeModifiedBy(currentUserId, isSuperadmin)) {
      throw new Error('Forbidden: You can only upload artifacts to workspaces you created');
    }

    const audit = auditHtmlArtifactSafety(input.htmlContent);
    if (!audit.safe) {
      throw new Error(`Artifact security audit failed: ${audit.errors.join(' | ')}`);
    }

    const sha256Hash = createHash('sha256').update(input.htmlContent, 'utf-8').digest('hex');
    const mergedMetadata: ContentArtifactMetadata = {
      slideCount: input.metadata?.slideCount ?? audit.slideCount,
      lang: input.metadata?.lang ?? audit.lang,
      style: input.metadata?.style,
      mediaUrls: input.metadata?.mediaUrls,
      extractedNotesCount: audit.extractedNotes.length,
    };

    const saved = await this.interactiveRepository.upsertArtifact({
      contentId: input.contentId,
      kind: input.kind,
      mimeType: input.mimeType || 'text/html',
      htmlContent: input.htmlContent,
      sha256Hash,
      byteSize: audit.byteSize,
      metadata: mergedMetadata,
    });

    const { htmlContent: _omit, ...summary } = saved;
    return {
      artifact: summary,
      warnings: audit.warnings,
    };
  }
}
