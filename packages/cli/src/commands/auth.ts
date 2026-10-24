import { saveStoredConfig, loadStoredConfig } from '../core/config';
import type { ApiClient } from '../core/client';
import { CliError, ExitCode, type NextAction } from '../core/envelope';

export async function handleAuthCommand(
  action: string,
  args: string[],
  flags: Record<string, any>,
  client: ApiClient
): Promise<{ data: any; nextActions?: NextAction[] }> {
  switch (action) {
    case 'whoami': {
      const data = await client.request('/api/v1/auth/me');
      return { data };
    }

    case 'config': {
      const updateData: Record<string, any> = {};
      if (flags['api-url']) updateData.apiUrl = flags['api-url'];
      if (flags['api-key']) updateData.apiKey = flags['api-key'];
      if (flags['token']) updateData.token = flags['token'];
      if (flags['workspace']) updateData.workspaceId = flags['workspace'];

      if (Object.keys(updateData).length > 0) {
        saveStoredConfig(updateData);
      }

      const current = loadStoredConfig();
      return {
        data: {
          currentConfig: current,
          updated: Object.keys(updateData).length > 0 ? updateData : undefined,
        },
      };
    }

    default:
      throw new CliError({
        code: 'UNKNOWN_ACTION',
        message: `Unknown action '${action}' for noun 'auth'. Available: whoami, config.`,
        exitCode: ExitCode.USAGE_ERROR,
      });
  }
}
