import { readFileSync } from 'node:fs';
import type { ApiClient } from '../core/client';
import { CliError, ExitCode, type NextAction } from '../core/envelope';

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

      let bodyText: string | undefined;
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
      } else if (flags.body) {
        bodyText = flags.body;
      }

      const body = {
        workspaceId,
        title,
        type,
        body: bodyText,
        summary: flags.summary,
        readingTimeMinutes: flags['reading-time'] ? Number(flags['reading-time']) : undefined,
      };

      const data = await client.request('/api/v1/contents', { method: 'POST', body });
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

    default:
      throw new CliError({
        code: 'UNKNOWN_ACTION',
        message: `Unknown action '${action}' for noun 'content'. Available: list, get, create, delete, rollback.`,
        exitCode: ExitCode.USAGE_ERROR,
      });
  }
}
