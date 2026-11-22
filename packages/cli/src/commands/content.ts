import { readFileSync } from 'node:fs';
import type { ContentArtifactKind } from '@flashlearn/shared';
import type { ApiClient } from '../core/client';
import { CliError, ExitCode, type NextAction } from '../core/envelope';
import {
  importInteractiveModule,
  prepareValidatedHtmlArtifact,
} from '../core/interactive-importer';

export async function handleContentCommand(
  action: string,
  args: string[],
  flags: Record<string, any>,
  client: ApiClient
): Promise<{ data: any; nextActions?: NextAction[] }> {
  switch (action) {
    case 'list': {
      const workspaceId = flags['workspace-id'] || flags.workspace;
      if (!workspaceId) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: '--workspace-id is required: `flashlearn content list --workspace-id <id>`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }
      const data = await client.request(`/api/v1/contents/workspace/${workspaceId}`);
      return { data };
    }

    case 'get': {
      const id = args[0];
      if (!id) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Content ID is required: `flashlearn content get <id>`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }
      const data = await client.request(`/api/v1/contents/${id}`);
      return { data };
    }

    case 'create': {
      const workspaceId = flags['workspace-id'] || flags.workspace;
      const title = flags.title;
      const type = flags.type || 'materi';

      if (!workspaceId || !title) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Required: --workspace-id and --title.',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }

      let bodyText = flags.body;
      if (flags['body-file']) {
        try {
          bodyText = readFileSync(flags['body-file'], 'utf-8');
        } catch (err: any) {
          throw new CliError({
            code: 'INVALID_FILE',
            message: `Failed to read body file: ${err.message}`,
            exitCode: ExitCode.VALIDATION_ERROR,
          });
        }
      }

      let questions: any[] | undefined;
      if (flags['questions-file']) {
        try {
          const parsed = JSON.parse(readFileSync(flags['questions-file'], 'utf-8'));
          questions = Array.isArray(parsed) ? parsed : parsed.questions;
        } catch (err: any) {
          throw new CliError({
            code: 'INVALID_FILE',
            message: `Failed to read questions file: ${err.message}`,
            exitCode: ExitCode.VALIDATION_ERROR,
          });
        }
      } else if (flags.questions) {
        try {
          const parsed = JSON.parse(flags.questions);
          questions = Array.isArray(parsed) ? parsed : parsed.questions;
        } catch (err: any) {
          throw new CliError({
            code: 'INVALID_JSON',
            message: `Failed to parse inline questions JSON: ${err.message}`,
            exitCode: ExitCode.VALIDATION_ERROR,
          });
        }
      }

      const body = {
        workspaceId,
        title,
        type,
        body: bodyText,
        questions,
        summary: flags.summary,
        readingTimeMinutes: flags['reading-time'] ? Number(flags['reading-time']) : undefined,
      };

      const data = await client.request('/api/v1/contents', { method: 'POST', body });
      return { data };
    }

    case 'update': {
      const id = args[0];
      if (!id) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Content ID is required: `flashlearn content update <id>`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }

      let bodyText = flags.body;
      if (flags['body-file']) {
        bodyText = readFileSync(flags['body-file'], 'utf-8');
      }

      let questions: any[] | undefined;
      if (flags['questions-file']) {
        const parsed = JSON.parse(readFileSync(flags['questions-file'], 'utf-8'));
        questions = Array.isArray(parsed) ? parsed : parsed.questions;
      } else if (flags.questions) {
        const parsed = JSON.parse(flags.questions);
        questions = Array.isArray(parsed) ? parsed : parsed.questions;
      }

      const body = {
        title: flags.title,
        body: bodyText,
        questions,
        summary: flags.summary,
        isPublished: flags.published !== undefined ? flags.published === 'true' || flags.published === true : undefined,
      };

      const data = await client.request(`/api/v1/contents/${id}`, { method: 'PUT', body });
      return { data };
    }

    case 'delete': {
      const id = args[0];
      if (!id) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Content ID is required: `flashlearn content delete <id> --yes`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }
      if (!flags.yes && !flags.y && !flags.force) {
        throw new CliError({
          code: 'CONFIRMATION_REQUIRED',
          message: 'Destructive action requires --yes or --force flag.',
          exitCode: ExitCode.USAGE_ERROR,
        });
      }
      const data = await client.request(`/api/v1/contents/${id}`, { method: 'DELETE' });
      return { data };
    }

    case 'rollback': {
      const id = args[0];
      const versionNumber = flags.version !== undefined ? Number(flags.version) : undefined;
      if (!id || versionNumber === undefined) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Content ID and --version are required: `flashlearn content rollback <id> --version <num>`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }
      const data = await client.request(`/api/v1/contents/${id}/rollback`, {
        method: 'POST',
        body: { versionNumber },
      });
      return { data };
    }

    case 'import-interactive': {
      const workspaceId = flags['workspace-id'] || flags.workspace;
      const title = flags.title;
      const manifestPath = flags.manifest || flags.file || args[0];

      if (!workspaceId || !title || !manifestPath) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message:
            'Required: --workspace-id, --title, and --manifest <uila-v2.json>. Optional: --deck <index.html> --sim <sim.html> --slug <slug> --competency-id <id>',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }

      const data = await importInteractiveModule(client, {
        workspaceId,
        domainId: flags['domain-id'],
        competencyId: flags['competency-id'],
        title,
        slug: flags.slug,
        summary: flags.summary,
        readingTimeMinutes: flags['reading-time'] ? Number(flags['reading-time']) : undefined,
        manifestPath,
        deckPath: flags.deck,
        simPath: flags.sim,
        dryRun: Boolean(flags['dry-run']),
        mediaOpts: {
          enabled: Boolean(flags['upload-media']),
          dryRun: Boolean(flags['dry-run']),
          vaultUrl: flags['mediavault-url'],
          apiKey: flags['mediavault-key'],
        },
      });
      return { data };
    }

    case 'upload-artifact': {
      const contentId = args[0] || flags['content-id'];
      const kind = (flags.kind || 'slide_deck_html') as ContentArtifactKind;
      const filePath = flags.file || args[1];

      if (!contentId || !filePath) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message:
            'Usage: `flashlearn content upload-artifact <content-id> --kind slide_deck_html --file <index.html>`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }
      if (kind !== 'slide_deck_html' && kind !== 'anchoring_sim_html') {
        throw new CliError({
          code: 'INVALID_ARGUMENT',
          message: '--kind must be slide_deck_html or anchoring_sim_html',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }

      const prepared = await prepareValidatedHtmlArtifact(filePath, {
        enabled: Boolean(flags['upload-media']),
        dryRun: Boolean(flags['dry-run']),
        vaultUrl: flags['mediavault-url'],
        apiKey: flags['mediavault-key'],
      });

      if (flags['dry-run']) {
        return {
          data: {
            dryRun: true,
            contentId,
            kind,
            slideCount: prepared.slideCount,
            lang: prepared.lang,
            warnings: prepared.warnings,
            mediaUrls: prepared.mediaUrls,
          },
        };
      }

      const data = await client.request(`/api/v1/contents/${contentId}/artifacts/${kind}`, {
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
      return { data };
    }

    default:
      throw new CliError({
        code: 'UNKNOWN_ACTION',
        message: `Unknown action '${action}' for noun 'content'. Available: list, get, create, update, delete, rollback, import-interactive, upload-artifact.`,
        exitCode: ExitCode.USAGE_ERROR,
      });
  }
}
