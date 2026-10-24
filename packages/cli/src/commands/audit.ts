import { readFileSync, writeFileSync } from 'node:fs';
import { verifyTranscriptMerkle } from '@flashlearn/shared';
import type { ApiClient } from '../core/client';
import { CliError, ExitCode, type NextAction } from '../core/envelope';

export async function handleAuditCommand(
  action: string,
  args: string[],
  flags: Record<string, any>,
  client: ApiClient
): Promise<{ data: any; nextActions?: NextAction[] }> {
  switch (action) {
    case 'list': {
      const workspaceId = flags['workspace-id'] || flags.workspace;
      const actionFilter = flags.action;
      const limit = flags.limit ? Number(flags.limit) : 50;

      const data = await client.request('/api/v1/audit/logs', {
        query: { workspaceId, action: actionFilter, limit },
      });
      return { data };
    }

    case 'bundle': {
      const workspaceId = flags['workspace-id'] || flags.workspace;
      if (!workspaceId) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: '--workspace-id is required: `flashlearn audit bundle --workspace-id <id>`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }
      const data = await client.request('/api/v1/audit/bundle', {
        query: { workspaceId },
      });

      if (flags.output || flags.file) {
        const outPath = flags.output || flags.file;
        try {
          writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf-8');
          return {
            data: {
              savedTo: outPath,
              recordsCount: data.records?.length || 0,
              sha256Signature: data.sha256Signature,
            },
          };
        } catch (err: any) {
          throw new CliError({
            code: 'WRITE_ERROR',
            message: `Could not save audit bundle to ${outPath}: ${err.message}`,
            exitCode: ExitCode.GENERAL_ERROR,
          });
        }
      }

      return { data };
    }

    case 'verify-transcript': {
      const filePath = flags.file || args[0];
      if (!filePath) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: '--file is required: `flashlearn audit verify-transcript --file <path>`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }
      try {
        const raw = readFileSync(filePath, 'utf-8');
        const bundle = JSON.parse(raw);
        const result = verifyTranscriptMerkle(bundle);
        return { data: result };
      } catch (err: any) {
        throw new CliError({
          code: 'VERIFICATION_ERROR',
          message: `Failed to verify transcript bundle: ${err.message}`,
          exitCode: ExitCode.GENERAL_ERROR,
        });
      }
    }

    default:
      throw new CliError({
        code: 'UNKNOWN_ACTION',
        message: `Unknown action '${action}' for noun 'audit'. Available: list, bundle.`,
        exitCode: ExitCode.USAGE_ERROR,
      });
  }
}
