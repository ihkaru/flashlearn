import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

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

const CONFIG_DIR = join(homedir(), '.flashlearn');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export function loadStoredConfig(): Record<string, any> {
  try {
    if (existsSync(CONFIG_FILE)) {
      return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
    }
  } catch {
    // Ignore corrupt local config
  }
  return {};
}

export function saveStoredConfig(data: Record<string, any>): void {
  try {
    if (!existsSync(CONFIG_DIR)) {
      mkdirSync(CONFIG_DIR, { recursive: true });
    }
    const current = loadStoredConfig();
    writeFileSync(CONFIG_FILE, JSON.stringify({ ...current, ...data }, null, 2), 'utf-8');
  } catch (err: any) {
    console.error(`Warning: could not save config to ${CONFIG_FILE}: ${err.message}`);
  }
}

export function resolveConfig(parsedFlags: Record<string, any>): CliConfig {
  const stored = loadStoredConfig();

  const apiUrl =
    parsedFlags['api-url'] ||
    process.env.FL_API_URL ||
    process.env.FLASHLEARN_API_URL ||
    stored.apiUrl ||
    'http://localhost:3000';

  const apiKey =
    parsedFlags['api-key'] ||
    process.env.FL_API_KEY ||
    stored.apiKey;

  const token =
    parsedFlags['token'] ||
    process.env.FL_TOKEN ||
    stored.token;

  const workspaceId =
    parsedFlags['workspace'] ||
    parsedFlags['workspace-id'] ||
    process.env.FL_WORKSPACE ||
    stored.workspaceId;

  // Agent-first: default to json unless explicitly specified as text
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
    apiUrl: apiUrl.replace(/\/+$/, ''),
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
  };
}
