import { SCHEMA_REGISTRY, type ResourceSchemaDef, type ActionDef } from './schema-registry';
import { CliError, ExitCode } from './envelope';

export interface HelpPayload {
  title: string;
  description: string;
  usage: string;
  globalFlags: Record<string, string>;
  target?: ResourceSchemaDef | ActionDef | Record<string, any>;
  examples: string[];
}

export function generateHelp(noun?: string, action?: string): HelpPayload {
  const globalFlags = {
    '--fields <f1,f2>': 'Field masking / token optimization (e.g. --fields id,title,code)',
    '--limit <n>': 'Limit output to the first N items in any array/list response',
    '--tail <n>': 'Limit output to the LAST N items (e.g. --tail 5 for latest logs/attempts)',
    '--last <n>': 'Alias for --tail',
    '--offset <n>': 'Skip the first N items',
    '--filter <k=v>': 'Filter list by key=value pair or query substring',
    '--dry-run': 'Simulate mutating state action without applying server changes',
    '--yes, -y': 'Automatic yes confirmation for destructive operations',
    '--output <json|text>': 'Output format (default: json for agent-first loops)',
    '--api-url <url>': 'Base URL for backend (default: http://localhost:3000)',
    '--api-key <key>': 'API authentication key (fl_live_...)',
    '--token <jwt>': 'JWT user session token',
  };

  // Case 1: Granular Action Help
  if (noun && action && SCHEMA_REGISTRY[noun.toLowerCase()]) {
    const resource = SCHEMA_REGISTRY[noun.toLowerCase()];
    const actionDef = resource.actions.find((a) => a.action.toLowerCase() === action.toLowerCase());

    if (actionDef) {
      return {
        title: `FlashLearn CLI: ${resource.noun} ${actionDef.action}`,
        description: actionDef.description,
        usage: `flashlearn ${resource.noun} ${actionDef.action} [arguments] [options]`,
        target: actionDef,
        globalFlags,
        examples: [actionDef.example],
      };
    }
  }

  // Case 2: Specific Noun Help
  if (noun && SCHEMA_REGISTRY[noun.toLowerCase()]) {
    const resource = SCHEMA_REGISTRY[noun.toLowerCase()];
    return {
      title: `FlashLearn CLI: ${resource.noun}`,
      description: resource.description,
      usage: `flashlearn ${resource.noun} <action> [arguments] [options]`,
      target: resource,
      globalFlags,
      examples: resource.actions.map((a) => a.example),
    };
  }

  // Case 3: Global CLI Overview Help
  return {
    title: 'FlashLearn Agent-First CLI (October 2026 Standards)',
    description: 'Evidence-based competency authorization and learning management CLI for AI agents',
    usage: 'flashlearn <noun> <action> [arguments] [options]',
    target: {
      availableNouns: Object.keys(SCHEMA_REGISTRY),
      taxonomy: Object.entries(SCHEMA_REGISTRY).map(([k, v]) => ({
        noun: k,
        description: v.description,
        actionsCount: v.actions.length,
      })),
    },
    globalFlags,
    examples: [
      'flashlearn schema',
      'flashlearn workspace list --public --limit 5',
      'flashlearn source chunks src_123 --tail 3',
      'flashlearn competency graph --workspace-id <ws_id>',
      'flashlearn task socratic-hint task_123 --question "Bagaimana batas overhead dihitung?"',
      'flashlearn audit list --workspace-id <ws_id> --last 10',
    ],
  };
}
