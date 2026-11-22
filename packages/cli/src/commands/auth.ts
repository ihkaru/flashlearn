import { saveStoredConfig, resolveConfigWithSources, maskSecret } from '../core/config';
import type { ApiClient } from '../core/client';
import { CliError, ExitCode, type NextAction } from '../core/envelope';

export async function handleAuthCommand(
  action: string,
  _args: string[],
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
      const rawUrl = flags['base-url'] || flags['api-url'];
      if (typeof rawUrl === 'string' && rawUrl.trim().length > 0) {
        updateData.apiUrl = rawUrl.trim().replace(/\/+$/, '');
      }
      if (typeof flags['api-key'] === 'string' && flags['api-key'].trim().length > 0) {
        updateData.apiKey = flags['api-key'].trim();
      }
      if (typeof flags['token'] === 'string' && flags['token'].trim().length > 0) {
        updateData.token = flags['token'].trim();
      }
      const ws = flags['workspace'] || flags['workspace-id'];
      if (typeof ws === 'string' && ws.trim().length > 0) {
        updateData.workspaceId = ws.trim();
      }

      const configPath = flags['config'];
      if (Object.keys(updateData).length > 0) {
        saveStoredConfig(updateData, configPath);
      }

      const { config, sources, configFile } = resolveConfigWithSources(flags);
      const showSecrets = Boolean(flags['show-secrets']);
      return {
        data: {
          configFile,
          currentConfig: {
            baseUrl: config.apiUrl,
            apiUrl: config.apiUrl,
            apiKey: showSecrets ? config.apiKey : maskSecret(config.apiKey),
            hasApiKey: Boolean(config.apiKey),
            token: showSecrets ? config.token : maskSecret(config.token),
            workspaceId: config.workspaceId ?? null,
          },
          sources,
          updatedKeys: Object.keys(updateData).length > 0 ? Object.keys(updateData) : undefined,
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
