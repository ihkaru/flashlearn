import { readFileSync } from 'node:fs';
import type { ApiClient } from '../core/client';
import { CliError, ExitCode, type NextAction } from '../core/envelope';

export async function handleGateCommand(
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
          message: '--workspace-id is required: `flashlearn gate list --workspace-id <id>`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }
      const data = await client.request(`/api/v1/gates/workspace/${workspaceId}`);
      return { data };
    }

    case 'create': {
      const workspaceId = flags['workspace-id'] || flags.workspace;
      const level = flags.level !== undefined ? Number(flags.level) : undefined;
      const title = flags.title;
      const description = flags.description;

      if (!workspaceId || level === undefined || !title || !description) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Required flags: --workspace-id, --level (0-3), --title, and --description.',
          exitCode: ExitCode.VALIDATION_ERROR,
          suggestedFix: 'flashlearn gate create --workspace-id <id> --level 3 --title "Title" --description "Desc"',
        });
      }

      let requirements: any[] | undefined;
      if (flags['requirements-file']) {
        try {
          const content = JSON.parse(readFileSync(flags['requirements-file'], 'utf-8'));
          requirements = Array.isArray(content) ? content : content.requirements;
        } catch (err: any) {
          throw new CliError({
            code: 'INVALID_FILE',
            message: `Failed to read requirements file: ${err.message}`,
            exitCode: ExitCode.VALIDATION_ERROR,
          });
        }
      } else if (flags.requirements) {
        try {
          const content = JSON.parse(flags.requirements);
          requirements = Array.isArray(content) ? content : content.requirements;
        } catch (err: any) {
          throw new CliError({
            code: 'INVALID_JSON',
            message: `Failed to parse inline requirements JSON: ${err.message}`,
            exitCode: ExitCode.VALIDATION_ERROR,
          });
        }
      }

      const body = {
        workspaceId,
        level,
        title,
        description,
        requirements,
      };

      const data = await client.request('/api/v1/gates', { method: 'POST', body });
      return { data };
    }

    case 'passports': {
      const data = await client.request('/api/v1/gates/passports');
      return {
        data,
        nextActions: [
          { command: 'flashlearn gate verify <grant-id>', description: 'Verify public status of passport' },
        ],
      };
    }

    case 'verify': {
      const grantId = args[0] || flags['grant-id'];
      if (!grantId) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Grant / Passport ID is required: `flashlearn gate verify <grant-id>`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }
      const data = await client.request(`/api/v1/gates/verify/${grantId}`);
      return { data };
    }

    case 'grant': {
      const gateId = args[0] || flags['gate-id'];
      if (!gateId) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Gate ID is required: `flashlearn gate grant <gate-id>`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }
      const data = await client.request(`/api/v1/gates/${gateId}/grant`, { method: 'POST' });
      return {
        data,
        nextActions: [
          { command: 'flashlearn gate passports', description: 'View active authority passports' },
        ],
      };
    }

    default:
      throw new CliError({
        code: 'UNKNOWN_ACTION',
        message: `Unknown action '${action}' for noun 'gate'. Available: list, create, passports, verify, grant.`,
        exitCode: ExitCode.USAGE_ERROR,
      });
  }
}
