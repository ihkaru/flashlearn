import { resolve } from 'node:path';
import type { ApiClient } from '../core/client';
import { CliError, ExitCode } from '../core/envelope';
import { uploadSingleAssetFile } from '../core/media-uploader';

export async function handleAssetCommand(
  action: string,
  args: string[],
  flags: Record<string, any>,
  client: ApiClient
): Promise<{ data: any; nextActions?: any[] }> {
  switch (action) {
    case 'upload': {
      const workspaceId = flags['workspace-id'] || flags.workspace;
      const filePath = flags.file || args[0];
      if (!workspaceId || !filePath) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Flags --workspace-id and --file are required for `flashlearn asset upload`.',
          exitCode: ExitCode.VALIDATION_ERROR,
          suggestedFix:
            'Usage: `flashlearn asset upload --workspace-id <id> --file ./assets/fig-01.webp [--caption "..."] [--alt "..."] [--source-page 71]`',
        });
      }

      const url = await uploadSingleAssetFile(
        resolve(String(filePath)),
        {
          enabled: true,
          dryRun: Boolean(flags['dry-run']),
          workspaceId: String(workspaceId),
          client,
          vaultUrl: flags['mediavault-url'],
          apiKey: flags['mediavault-key'],
        },
        {
          caption: flags.caption,
          altText: flags.alt || flags['alt-text'],
          sourceRef: flags['source-ref'],
          sourcePage: flags['source-page'] ? Number(flags['source-page']) : undefined,
        }
      );

      return {
        data: {
          workspaceId,
          file: resolve(String(filePath)),
          url,
          dryRun: Boolean(flags['dry-run']),
        },
      };
    }

    case 'list': {
      const workspaceId = flags['workspace-id'] || flags.workspace || args[0];
      if (!workspaceId) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Workspace ID is required for `flashlearn asset list`.',
          exitCode: ExitCode.VALIDATION_ERROR,
          suggestedFix: 'Usage: `flashlearn asset list --workspace-id <id>`',
        });
      }
      const data = await client.request(`/api/v1/workspaces/${workspaceId}/assets`);
      return { data };
    }

    case 'delete': {
      const assetId = args[0] || flags.id;
      if (!assetId) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Asset ID is required for `flashlearn asset delete`.',
          exitCode: ExitCode.VALIDATION_ERROR,
          suggestedFix: 'Usage: `flashlearn asset delete <asset-id> --yes`',
        });
      }
      if (!flags.yes && !flags.force && !flags['dry-run']) {
        throw new CliError({
          code: 'USAGE_ERROR',
          message: 'Destructive delete requires --yes (or --dry-run to preview).',
          exitCode: ExitCode.USAGE_ERROR,
        });
      }
      const data = await client.request(`/api/v1/assets/${assetId}`, { method: 'DELETE' });
      return { data };
    }

    default:
      throw new CliError({
        code: 'UNKNOWN_ACTION',
        message: `Unknown asset action '${action}'. Valid actions: upload, list, delete.`,
        exitCode: ExitCode.VALIDATION_ERROR,
      });
  }
}
