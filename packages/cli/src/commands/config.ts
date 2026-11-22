import {
  saveStoredConfig,
  unsetStoredConfig,
  resolveConfigWithSources,
  maskSecret,
} from '../core/config';
import { CliError, ExitCode, type NextAction } from '../core/envelope';

function normalizeUrl(rawUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new CliError({
      code: 'VALIDATION_ERROR',
      message: `Invalid URL '${rawUrl}'. Expected full http(s) URL (e.g. https://learn.dvlpid.my.id).`,
      exitCode: ExitCode.VALIDATION_ERROR,
    });
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new CliError({
      code: 'VALIDATION_ERROR',
      message: `Unsupported URL protocol '${parsed.protocol}'. Use http:// or https://.`,
      exitCode: ExitCode.VALIDATION_ERROR,
    });
  }
  return rawUrl.replace(/\/+$/, '');
}

function buildConfigSnapshot(flags: Record<string, any>) {
  const showSecrets = Boolean(flags['show-secrets']);
  const { config, sources, configFile } = resolveConfigWithSources(flags);
  return {
    configFile,
    effective: {
      baseUrl: config.apiUrl,
      apiUrl: config.apiUrl,
      apiKey: showSecrets ? config.apiKey : maskSecret(config.apiKey),
      hasApiKey: Boolean(config.apiKey),
      token: showSecrets ? config.token : maskSecret(config.token),
      hasToken: Boolean(config.token),
      workspaceId: config.workspaceId ?? null,
    },
    sources,
  };
}

export async function handleConfigCommand(
  action: string,
  _args: string[],
  flags: Record<string, any>
): Promise<{ data: any; nextActions?: NextAction[] }> {
  const configPath = flags['config'];

  switch (action) {
    case 'get':
    case 'show':
    case 'list': {
      return {
        data: buildConfigSnapshot(flags),
        nextActions: [
          {
            command: 'flashlearn auth whoami',
            description: 'Verify active base URL and API key against backend',
          },
        ],
      };
    }

    case 'set': {
      const updateData: Record<string, any> = {};
      const rawUrl = flags['base-url'] || flags['api-url'];
      if (typeof rawUrl === 'string' && rawUrl.trim().length > 0) {
        updateData.apiUrl = normalizeUrl(rawUrl.trim());
      }
      if (typeof flags['api-key'] === 'string' && flags['api-key'].trim().length > 0) {
        const key = flags['api-key'].trim();
        if (!key.startsWith('fl_live_')) {
          throw new CliError({
            code: 'VALIDATION_ERROR',
            message: 'FlashLearn API keys must start with `fl_live_`.',
            exitCode: ExitCode.VALIDATION_ERROR,
            suggestedFix: 'Pass a valid key created via `flashlearn apikey create` or Infisical.',
          });
        }
        updateData.apiKey = key;
      }
      if (typeof flags['token'] === 'string' && flags['token'].trim().length > 0) {
        updateData.token = flags['token'].trim();
      }
      const ws = flags['workspace'] || flags['workspace-id'];
      if (typeof ws === 'string' && ws.trim().length > 0) {
        updateData.workspaceId = ws.trim();
      }

      if (Object.keys(updateData).length === 0) {
        throw new CliError({
          code: 'VALIDATION_ERROR',
          message: 'Provide at least one option to set: --base-url (or --api-url), --api-key, --token, or --workspace.',
          exitCode: ExitCode.VALIDATION_ERROR,
          suggestedFix: 'flashlearn config set --base-url https://learn.dvlpid.my.id --api-key fl_live_...',
        });
      }

      const savedPath = saveStoredConfig(updateData, configPath);
      return {
        data: {
          savedTo: savedPath,
          updatedKeys: Object.keys(updateData),
          ...buildConfigSnapshot(flags),
        },
        nextActions: [
          {
            command: 'flashlearn auth whoami',
            description: 'Verify credentials against the configured FlashLearn server',
          },
        ],
      };
    }

    case 'unset':
    case 'clear': {
      const keysToRemove: string[] = [];
      if (flags['all']) {
        keysToRemove.push('apiUrl', 'baseUrl', 'apiKey', 'token', 'workspaceId');
      } else {
        if (flags['base-url'] || flags['api-url']) keysToRemove.push('apiUrl', 'baseUrl');
        if (flags['api-key']) keysToRemove.push('apiKey');
        if (flags['token']) keysToRemove.push('token');
        if (flags['workspace'] || flags['workspace-id']) keysToRemove.push('workspaceId');
      }

      if (keysToRemove.length === 0) {
        throw new CliError({
          code: 'VALIDATION_ERROR',
          message: 'Specify keys to unset: --base-url, --api-key, --token, --workspace, or --all.',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }

      const savedPath = unsetStoredConfig(keysToRemove, configPath);
      return {
        data: {
          savedTo: savedPath,
          removedKeys: keysToRemove,
          ...buildConfigSnapshot({ config: configPath, 'show-secrets': flags['show-secrets'] }),
        },
      };
    }

    default:
      throw new CliError({
        code: 'UNKNOWN_ACTION',
        message: `Unknown action '${action}' for noun 'config'. Available: get, set, unset.`,
        exitCode: ExitCode.USAGE_ERROR,
      });
  }
}
