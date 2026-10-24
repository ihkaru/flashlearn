import { readFileSync } from 'node:fs';
import type { ApiClient } from '../core/client';
import { CliError, ExitCode, type NextAction } from '../core/envelope';

export async function handleSourceCommand(
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
          message: '--workspace-id is required: `flashlearn source list --workspace-id <id>`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }
      const data = await client.request('/api/v1/sources', { query: { workspaceId } });
      return {
        data,
        nextActions: [
          { command: `flashlearn source ingest --workspace-id ${workspaceId} --code <CODE> --title "<TITLE>" --file <FILE>`, description: 'Ingest new legal text' },
        ],
      };
    }

    case 'get': {
      const id = args[0];
      if (!id) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Source ID is required: `flashlearn source get <id>`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }
      const data = await client.request(`/api/v1/sources/${id}`);
      return {
        data,
        nextActions: [
          { command: `flashlearn source chunks ${id}`, description: 'Inspect addressable chunks and SHA-256 hashes' },
        ],
      };
    }

    case 'chunks': {
      const id = args[0];
      if (!id) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Source ID is required: `flashlearn source chunks <id>`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }
      const data = await client.request(`/api/v1/sources/${id}/chunks`);
      return { data };
    }

    case 'ingest': {
      const workspaceId = flags['workspace-id'] || flags.workspace;
      const title = flags.title;
      const code = flags.code;
      const filePath = flags.file;

      if (!workspaceId || !title || !code || !filePath) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Required flags: --workspace-id, --title, --code, and --file.',
          exitCode: ExitCode.VALIDATION_ERROR,
          suggestedFix: 'flashlearn source ingest --workspace-id <id> --title "Title" --code "CODE-01" --file ./doc.md',
        });
      }

      let rawText = '';
      try {
        rawText = readFileSync(filePath, 'utf-8');
      } catch (err: any) {
        throw new CliError({
          code: 'INVALID_FILE',
          message: `Cannot read text file ${filePath}: ${err.message}`,
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }

      const body = {
        workspaceId,
        title,
        code,
        version: flags.version || '1.0.0',
        owner: flags.owner || 'Official Authority',
        effectiveDate: flags['effective-date'] || new Date().toISOString().slice(0, 10),
        rawText,
      };

      const data = await client.request('/api/v1/sources', { method: 'POST', body });
      return {
        data,
        nextActions: [
          { command: `flashlearn source chunks ${data.source?.id || data.id}`, description: 'Inspect generated addressable chunks' },
          { command: `flashlearn competency create --workspace-id ${workspaceId} --source-id ${data.source?.id || data.id} --code <CODE> --title "<TITLE>" --oracle-class A --risk-level low`, description: 'Create competency node linked to this source' },
        ],
      };
    }

    case 'supersede': {
      const id = args[0];
      if (!id) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Source ID is required: `flashlearn source supersede <id> [--reason "<RATIONALE>"]`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }
      const body = { reason: flags.reason || 'Superseded via FlashLearn Agent CLI' };
      const data = await client.request(`/api/v1/sources/${id}/supersede`, { method: 'POST', body });
      return {
        data,
        nextActions: [
          { command: `flashlearn audit list --action SOURCE_SUPERSEDED`, description: 'Verify staleness cascade in audit trail' },
        ],
      };
    }

    case 'validate-citations': {
      const filePath = flags.file || args[0];
      if (!filePath) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: '--file path to claims JSON is required: `flashlearn source validate-citations --file <claims.json>`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }
      let claims: any;
      try {
        claims = JSON.parse(readFileSync(filePath, 'utf-8'));
      } catch (err: any) {
        throw new CliError({
          code: 'INVALID_FILE',
          message: `Failed to parse claims JSON: ${err.message}`,
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }
      const claimsArray = Array.isArray(claims) ? claims : claims.claims;
      const data = await client.request('/api/v1/sources/validate-citations', { method: 'POST', body: { claims: claimsArray } });
      return { data };
    }

    default:
      throw new CliError({
        code: 'UNKNOWN_ACTION',
        message: `Unknown action '${action}' for noun 'source'. Available: list, get, chunks, ingest, supersede, validate-citations.`,
        exitCode: ExitCode.USAGE_ERROR,
      });
  }
}
