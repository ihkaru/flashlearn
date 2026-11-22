import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  auditHtmlArtifactSafety,
  validateInteractiveModulePayload,
  type ContentArtifactKind,
  type InteractiveModulePayload,
} from '@flashlearn/shared';
import type { ApiClient } from './client';
import { CliError, ExitCode } from './envelope';
import {
  rewriteLocalHtmlImages,
  rewriteModuleFigureAssets,
  type MediaUploadOptions,
} from './media-uploader';

export type MediaVaultUploadOptions = MediaUploadOptions;

export interface PreparedHtmlArtifact {
  htmlContent: string;
  slideCount: number;
  lang: string;
  warnings: string[];
  mediaUrls: string[];
  extractedNotes: any[];
}

export const rewriteLocalImagesViaMediaVault = rewriteLocalHtmlImages;

export function loadValidatedInteractiveManifest(manifestPath: string): InteractiveModulePayload {
  let raw: any;
  try {
    raw = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  } catch (err: any) {
    throw new CliError({
      code: 'INVALID_MANIFEST_FILE',
      message: `Failed to parse interactive manifest JSON at ${manifestPath}: ${err.message}`,
      exitCode: ExitCode.VALIDATION_ERROR,
    });
  }

  const payload: InteractiveModulePayload = raw.interactivePayload || raw;
  const report = validateInteractiveModulePayload(payload);
  if (!report.valid) {
    throw new CliError({
      code: 'INTERACTIVE_VALIDATION_FAILED',
      message: `Interactive module failed Clement-Brown/UILA validation (${report.issues.length} issue(s)).`,
      exitCode: ExitCode.VALIDATION_ERROR,
      details: report.issues,
    });
  }

  return payload;
}

export async function prepareValidatedHtmlArtifact(
  filePath: string,
  mediaOpts: MediaUploadOptions
): Promise<PreparedHtmlArtifact> {
  let rawHtml: string;
  try {
    rawHtml = readFileSync(filePath, 'utf-8');
  } catch (err: any) {
    throw new CliError({
      code: 'INVALID_ARTIFACT_FILE',
      message: `Failed to read HTML artifact at ${filePath}: ${err.message}`,
      exitCode: ExitCode.VALIDATION_ERROR,
    });
  }

  const rewritten = await rewriteLocalHtmlImages(rawHtml, dirname(resolve(filePath)), mediaOpts);
  const audit = auditHtmlArtifactSafety(rewritten.html);
  if (!audit.safe) {
    throw new CliError({
      code: 'ARTIFACT_SECURITY_FAILED',
      message: `Artifact "${filePath}" failed security audit: ${audit.errors.join(' | ')}`,
      exitCode: ExitCode.VALIDATION_ERROR,
      details: audit,
    });
  }

  return {
    htmlContent: rewritten.html,
    slideCount: audit.slideCount,
    lang: audit.lang,
    warnings: audit.warnings,
    mediaUrls: rewritten.mediaUrls,
    extractedNotes: audit.extractedNotes,
  };
}

export interface ImportInteractiveModuleOptions {
  workspaceId: string;
  domainId?: string;
  competencyId?: string;
  title: string;
  slug?: string;
  summary?: string;
  readingTimeMinutes?: number;
  manifestPath: string;
  deckPath?: string;
  simPath?: string;
  dryRun?: boolean;
  mediaOpts: MediaUploadOptions;
}

export async function importInteractiveModule(
  client: ApiClient,
  opts: ImportInteractiveModuleOptions
): Promise<Record<string, any>> {
  const payload = loadValidatedInteractiveManifest(opts.manifestPath);
  const enrichedMediaOpts: MediaUploadOptions = {
    ...opts.mediaOpts,
    dryRun: opts.dryRun ?? opts.mediaOpts.dryRun,
    workspaceId: opts.workspaceId,
    client,
  };

  const figureMediaUrls = await rewriteModuleFigureAssets(
    payload,
    dirname(resolve(opts.manifestPath)),
    enrichedMediaOpts
  );

  let deckArtifact: PreparedHtmlArtifact | null = null;
  let simArtifact: PreparedHtmlArtifact | null = null;

  if (opts.deckPath) {
    deckArtifact = await prepareValidatedHtmlArtifact(opts.deckPath, enrichedMediaOpts);
    if ((!payload.slideNotes || payload.slideNotes.length === 0) && deckArtifact.extractedNotes.length > 0) {
      payload.slideNotes = deckArtifact.extractedNotes;
    }
  }
  if (opts.simPath) {
    simArtifact = await prepareValidatedHtmlArtifact(opts.simPath, enrichedMediaOpts);
  }

  const allMediaUrls = [
    ...figureMediaUrls,
    ...(deckArtifact?.mediaUrls || []),
    ...(simArtifact?.mediaUrls || []),
  ];

  if (opts.dryRun) {
    return {
      dryRun: true,
      title: opts.title,
      slug: opts.slug,
      groundingMode: payload.uila.groundingDecision.mode,
      hasDeckArtifact: Boolean(deckArtifact),
      deckSlideCount: deckArtifact?.slideCount ?? 0,
      hasSimArtifact: Boolean(simArtifact),
      figuresCount: payload.figures?.length ?? 0,
      warnings: [...(deckArtifact?.warnings || []), ...(simArtifact?.warnings || [])],
      mediaUrls: allMediaUrls,
    };
  }

  // Idempotent upsert by slug if provided
  let existingId: string | null = null;
  if (opts.slug) {
    const existingList = await client.request<any[]>(`/api/v1/contents/workspace/${opts.workspaceId}`);
    const match = Array.isArray(existingList)
      ? existingList.find((c) => c.slug === opts.slug && !c.deletedAt)
      : null;
    if (match?.id) existingId = match.id;
  }

  const contentBody = {
    workspaceId: opts.workspaceId,
    domainId: opts.domainId,
    competencyId: opts.competencyId,
    title: opts.title,
    slug: opts.slug,
    type: 'interactive_module',
    summary: opts.summary || payload.learningObjective,
    readingTimeMinutes: opts.readingTimeMinutes || payload.estimatedMinutes || 6,
    interactivePayload: payload,
    isPublished: true,
  };

  const savedContent = existingId
    ? await client.request(`/api/v1/contents/${existingId}`, { method: 'PUT', body: contentBody })
    : await client.request('/api/v1/contents', { method: 'POST', body: contentBody });

  const uploadedArtifacts: Record<string, any> = {};
  if (deckArtifact) {
    uploadedArtifacts.slide_deck_html = await uploadArtifactToApi(
      client,
      savedContent.id,
      'slide_deck_html',
      deckArtifact
    );
  }
  if (simArtifact) {
    uploadedArtifacts.anchoring_sim_html = await uploadArtifactToApi(
      client,
      savedContent.id,
      'anchoring_sim_html',
      simArtifact
    );
  }

  return {
    action: existingId ? 'updated' : 'created',
    contentId: savedContent.id,
    slug: savedContent.slug,
    title: savedContent.title,
    groundingMode: payload.uila.groundingDecision.mode,
    figuresCount: payload.figures?.length ?? 0,
    mediaUrls: allMediaUrls,
    artifacts: uploadedArtifacts,
  };
}

async function uploadArtifactToApi(
  client: ApiClient,
  contentId: string,
  kind: ContentArtifactKind,
  prepared: PreparedHtmlArtifact
) {
  return await client.request(`/api/v1/contents/${contentId}/artifacts/${kind}`, {
    method: 'PUT',
    body: {
      htmlContent: prepared.htmlContent,
      mimeType: 'text/html',
      metadata: {
        slideCount: prepared.slideCount,
        lang: prepared.lang,
        mediaUrls: prepared.mediaUrls,
      },
    },
  });
}
