import type { ApiClient } from '../core/client';
import { CliError, ExitCode, type NextAction } from '../core/envelope';

export async function handleApiKeyCommand(
  action: string,
  args: string[],
  flags: Record<string, any>,
  client: ApiClient
): Promise<{ data: any; nextActions?: NextAction[] }> {
  switch (action) {
    case 'list': {
      const data = await client.request('/api/v1/api-keys');
      return { data };
    }

    case 'create': {
      const name = flags.name || args[0];
      if (!name) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: '--name is required: `flashlearn apikey create --name "Agent Key"`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }

      const body = {
        name,
        permissions: flags.permissions ? String(flags.permissions).split(',') : ['*'],
        expiresInDays: flags['expires-days'] ? Number(flags['expires-days']) : 0,
      };

      const data = await client.request('/api/v1/api-keys', { method: 'POST', body });
      return {
        data,
        nextActions: [
          { command: `export FL_API_KEY=${data.rawKey || data.key}`, description: 'Set environment variable for subsequent CLI requests' },
        ],
      };
    }

    case 'revoke': {
      const id = args[0];
      if (!id) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'API Key ID is required: `flashlearn apikey revoke <id>`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }
      const data = await client.request(`/api/v1/api-keys/${id}`, { method: 'DELETE' });
      return { data };
    }

    default:
      throw new CliError({
        code: 'UNKNOWN_ACTION',
        message: `Unknown action '${action}' for noun 'apikey'. Available: list, create, revoke.`,
        exitCode: ExitCode.USAGE_ERROR,
      });
  }
}
