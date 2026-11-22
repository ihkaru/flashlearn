import { existsSync, readFileSync, writeFileSync, mkdirSync, chmodSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

export interface CliConfig {
  apiUrl: string;
  apiKey?: string;
  token?: string;
  workspaceId?: string;
  output: 'json' | 'text';
  dryRun: boolean;
  yes: boolean;
  fields?: string[];
  limit?: number;
  tail?: number; // alias: last
  offset?: number;
  filter?: string;
  verbose: boolean;
}

export type ConfigSource = 'flag' | 'env' | 'stored' | 'default' | 'unset';

export interface ResolvedConfigSources {
  apiUrl: ConfigSource;
  apiKey: ConfigSource;
  token: ConfigSource;
  workspaceId: ConfigSource;
}

function nonEmptyString(val: unknown): string | undefined {
  return typeof val === 'string' && val.trim().length > 0 ? val.trim() : undefined;
}

export function getConfigFilePath(overridePath?: unknown): string {
  return (
    nonEmptyString(overridePath) ||
    nonEmptyString(process.env.FLASHLEARN_CONFIG_PATH) ||
    nonEmptyString(process.env.FL_CONFIG_PATH) ||
    join(homedir(), '.flashlearn', 'config.json')
  );
}

export function maskSecret(value?: unknown): string | undefined {
  if (typeof value !== 'string' || value.length === 0) return undefined;
  if (value.startsWith('fl_live_') && value.length > 14) {
    return `${value.slice(0, 14)}...`;
  }
  if (value.length <= 8) return '***';
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

export function loadStoredConfig(overridePath?: string): Record<string, any> {
  const filePath = getConfigFilePath(overridePath);
  try {
    if (existsSync(filePath)) {
      return JSON.parse(readFileSync(filePath, 'utf-8'));
    }
  } catch (err: any) {
    console.error(`Warning: could not parse config at ${filePath}: ${err.message}`);
  }
  return {};
}

export function saveStoredConfig(data: Record<string, any>, overridePath?: string): string {
  const filePath = getConfigFilePath(overridePath);
  const dirPath = dirname(filePath);
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true, mode: 0o700 });
  }
  const current = loadStoredConfig(filePath);
  const merged = { ...current, ...data };
  writeFileSync(filePath, JSON.stringify(merged, null, 2) + '\n', { encoding: 'utf-8', mode: 0o600 });
  try {
    chmodSync(filePath, 0o600);
  } catch (err: any) {
    console.error(`Warning: could not tighten permissions on ${filePath}: ${err.message}`);
  }
  return filePath;
}

export function unsetStoredConfig(keys: string[], overridePath?: string): string {
  const filePath = getConfigFilePath(overridePath);
  const current = loadStoredConfig(filePath);
  for (const key of keys) {
    delete current[key];
  }
  const dirPath = dirname(filePath);
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true, mode: 0o700 });
  }
  writeFileSync(filePath, JSON.stringify(current, null, 2) + '\n', { encoding: 'utf-8', mode: 0o600 });
  return filePath;
}

export function resolveConfigWithSources(parsedFlags: Record<string, any>): {
  config: CliConfig;
  sources: ResolvedConfigSources;
  configFile: string;
} {
  const configFile = getConfigFilePath(parsedFlags['config']);
  const stored = loadStoredConfig(configFile);

  const flagUrl = nonEmptyString(parsedFlags['base-url']) || nonEmptyString(parsedFlags['api-url']);
  const envUrl =
    nonEmptyString(process.env.FLASHLEARN_BASE_URL) ||
    nonEmptyString(process.env.FLASHLEARN_API_URL) ||
    nonEmptyString(process.env.FL_BASE_URL) ||
    nonEmptyString(process.env.FL_API_URL);
  const storedUrl = nonEmptyString(stored.apiUrl) || nonEmptyString(stored.baseUrl);

  const apiUrl = flagUrl || envUrl || storedUrl || 'http://localhost:3000';
  const apiUrlSource: ConfigSource = flagUrl
    ? 'flag'
    : envUrl
      ? 'env'
      : storedUrl
        ? 'stored'
        : 'default';

  const flagApiKey = nonEmptyString(parsedFlags['api-key']);
  const envApiKey =
    nonEmptyString(process.env.FLASHLEARN_API_KEY) ||
    nonEmptyString(process.env.FLASHLEARN_SUPERADMIN_API_KEY) ||
    nonEmptyString(process.env.FL_API_KEY);
  const storedApiKey = nonEmptyString(stored.apiKey);

  const apiKey = flagApiKey || envApiKey || storedApiKey;
  const apiKeySource: ConfigSource = flagApiKey
    ? 'flag'
    : envApiKey
      ? 'env'
      : storedApiKey
        ? 'stored'
        : 'unset';

  const flagToken = nonEmptyString(parsedFlags['token']);
  const envToken = nonEmptyString(process.env.FLASHLEARN_TOKEN) || nonEmptyString(process.env.FL_TOKEN);
  const storedToken = nonEmptyString(stored.token);

  const token = flagToken || envToken || storedToken;
  const tokenSource: ConfigSource = flagToken
    ? 'flag'
    : envToken
      ? 'env'
      : storedToken
        ? 'stored'
        : 'unset';

  const flagWorkspace = nonEmptyString(parsedFlags['workspace']) || nonEmptyString(parsedFlags['workspace-id']);
  const envWorkspace = nonEmptyString(process.env.FLASHLEARN_WORKSPACE_ID) || nonEmptyString(process.env.FL_WORKSPACE);
  const storedWorkspace = nonEmptyString(stored.workspaceId);

  const workspaceId = flagWorkspace || envWorkspace || storedWorkspace;
  const workspaceSource: ConfigSource = flagWorkspace
    ? 'flag'
    : envWorkspace
      ? 'env'
      : storedWorkspace
        ? 'stored'
        : 'unset';

  const output = (parsedFlags['output'] || process.env.FL_OUTPUT || 'json') === 'text' ? 'text' : 'json';
  const dryRun = Boolean(parsedFlags['dry-run'] || false);
  const yes = Boolean(parsedFlags['yes'] || parsedFlags['y'] || parsedFlags['force'] || false);
  const verbose = Boolean(parsedFlags['verbose'] || false);

  let fields: string[] | undefined;
  const rawFields = parsedFlags['fields'] || parsedFlags['select'];
  if (typeof rawFields === 'string') {
    fields = rawFields.split(',').map((s) => s.trim()).filter(Boolean);
  }

  const limit = parsedFlags.limit !== undefined ? Number(parsedFlags.limit) : undefined;
  const tail =
    parsedFlags.tail !== undefined
      ? Number(parsedFlags.tail)
      : parsedFlags.last !== undefined
        ? Number(parsedFlags.last)
        : undefined;
  const offset = parsedFlags.offset !== undefined ? Number(parsedFlags.offset) : undefined;
  const filter = parsedFlags.filter !== undefined ? String(parsedFlags.filter) : undefined;

  return {
    config: {
      apiUrl: String(apiUrl).replace(/\/+$/, ''),
      apiKey,
      token,
      workspaceId,
      output,
      dryRun,
      yes,
      fields,
      limit,
      tail,
      offset,
      filter,
      verbose,
    },
    sources: {
      apiUrl: apiUrlSource,
      apiKey: apiKeySource,
      token: tokenSource,
      workspaceId: workspaceSource,
    },
    configFile,
  };
}

export function resolveConfig(parsedFlags: Record<string, any>): CliConfig {
  return resolveConfigWithSources(parsedFlags).config;
}
