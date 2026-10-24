import { parseCliArgs } from './core/parser';
import { resolveConfig, type CliConfig } from './core/config';
import { ApiClient } from './core/client';
import {
  SCHEMA_VERSION,
  ExitCode,
  CliError,
  type SuccessEnvelope,
  type ErrorEnvelope,
} from './core/envelope';
import { transformData } from './core/transform';
import { generateHelp } from './core/help';

// Command Handlers
import { handleWorkspaceCommand } from './commands/workspace';
import { handleSourceCommand } from './commands/source';
import { handleCompetencyCommand } from './commands/competency';
import { handleTaskCommand } from './commands/task';
import { handleAttemptCommand } from './commands/attempt';
import { handleGateCommand } from './commands/gate';
import { handleContentCommand } from './commands/content';
import { handleQuizCommand } from './commands/quiz';
import { handleFlashcardCommand } from './commands/flashcard';
import { handleAuditCommand } from './commands/audit';
import { handleApiKeyCommand } from './commands/apikey';
import { handleAuthCommand } from './commands/auth';
import { handleSchemaCommand } from './commands/schema';
import { handleDiagnosticCommand } from './commands/diagnostic';

export async function runCli(rawArgv: string[]): Promise<number> {
  const startTime = Date.now();
  const parsed = parseCliArgs(rawArgv);
  const config = resolveConfig(parsed.flags);
  const client = new ApiClient(config);

  const commandStr = ['flashlearn', parsed.noun, parsed.action, ...parsed.positionals]
    .filter(Boolean)
    .join(' ');

  try {
    // Dynamic Schema Introspection flags
    if (parsed.flags.describe || parsed.flags['json-schema'] || parsed.noun === 'schema') {
      const res = await handleSchemaCommand(parsed.action || 'introspect', parsed.positionals, parsed.flags);
      emitSuccess(commandStr, res.data, res.nextActions, startTime, config);
      return ExitCode.SUCCESS;
    }

    // Comprehensive Help System (Global, Noun, or Action Level)
    if (!parsed.noun || parsed.flags.help || parsed.flags.h || parsed.noun === 'help') {
      const helpNoun = parsed.noun === 'help' ? parsed.action : parsed.noun;
      const helpAction = parsed.noun === 'help' ? parsed.positionals[0] : parsed.action;
      const helpData = generateHelp(helpNoun, helpAction);
      emitSuccess(commandStr || 'flashlearn --help', helpData, undefined, startTime, config);
      return ExitCode.SUCCESS;
    }

    const noun = parsed.noun.toLowerCase();
    const action = (parsed.action || 'list').toLowerCase();
    const args = parsed.positionals;

    let result: { data: any; nextActions?: any[] };

    switch (noun) {
      case 'workspace':
      case 'workspaces':
      case 'domain':
      case 'domains':
        result = await handleWorkspaceCommand(action, args, parsed.flags, client);
        break;
      case 'source':
      case 'sources':
        result = await handleSourceCommand(action, args, parsed.flags, client);
        break;
      case 'competency':
      case 'competencies':
        result = await handleCompetencyCommand(action, args, parsed.flags, client);
        break;
      case 'task':
      case 'tasks':
        result = await handleTaskCommand(action, args, parsed.flags, client);
        break;
      case 'attempt':
      case 'attempts':
        result = await handleAttemptCommand(action, args, parsed.flags, client);
        break;
      case 'gate':
      case 'gates':
        result = await handleGateCommand(action, args, parsed.flags, client);
        break;
      case 'content':
      case 'contents':
      case 'material':
        result = await handleContentCommand(action, args, parsed.flags, client);
        break;
      case 'quiz':
      case 'quizzes':
        result = await handleQuizCommand(action, args, parsed.flags, client);
        break;
      case 'flashcard':
      case 'flashcards':
      case 'spaced':
        result = await handleFlashcardCommand(action, args, parsed.flags, client);
        break;
      case 'audit':
      case 'logs':
        result = await handleAuditCommand(action, args, parsed.flags, client);
        break;
      case 'apikey':
      case 'apikeys':
      case 'keys':
        result = await handleApiKeyCommand(action, args, parsed.flags, client);
        break;
      case 'diagnostic':
      case 'placement':
        result = await handleDiagnosticCommand(action, args, parsed.flags, client);
        break;
      case 'auth':
      case 'session':
        result = await handleAuthCommand(action, args, parsed.flags, client);
        break;
      default:
        throw new CliError({
          code: 'UNKNOWN_NOUN',
          message: `Unknown resource noun '${parsed.noun}'. Run \`flashlearn --help\` or \`flashlearn schema\` to list available resources.`,
          exitCode: ExitCode.COMMAND_NOT_FOUND,
          suggestedFix: 'Run `flashlearn --help` to view valid resource commands.',
        });
    }

    emitSuccess(commandStr, result.data, result.nextActions, startTime, config);
    return ExitCode.SUCCESS;
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    const isCliError = err instanceof CliError;
    const exitCode = isCliError ? err.exitCode : ExitCode.GENERAL_ERROR;

    const errorEnvelope: ErrorEnvelope = {
      schemaVersion: SCHEMA_VERSION,
      status: 'error',
      command: commandStr,
      error: {
        code: isCliError ? err.code : 'UNEXPECTED_ERROR',
        message: err.message || String(err),
        retryable: isCliError ? err.retryable : false,
        suggestedFix: isCliError ? err.suggestedFix : undefined,
        details: isCliError ? err.details : undefined,
      },
      meta: {
        durationMs,
        timestamp: new Date().toISOString(),
      },
    };

    process.stderr.write(JSON.stringify(errorEnvelope, null, 2) + '\n');
    return exitCode;
  }
}

function emitSuccess(
  command: string,
  rawPayload: any,
  nextActions: any[] | undefined,
  startTime: number,
  config: CliConfig
): void {
  const durationMs = Date.now() - startTime;
  const transformed = transformData(rawPayload, {
    fields: config.fields,
    limit: config.limit,
    tail: config.tail,
    offset: config.offset,
    filter: config.filter,
  });

  const envelope: SuccessEnvelope = {
    schemaVersion: SCHEMA_VERSION,
    status: 'success',
    command,
    data: transformed.data,
    nextActions,
    meta: {
      durationMs,
      timestamp: new Date().toISOString(),
      itemCount: transformed.itemCount,
      totalBeforeSlice: transformed.totalBeforeSlice,
      appliedTransforms: transformed.appliedTransforms,
    },
  };

  process.stdout.write(JSON.stringify(envelope, null, 2) + '\n');
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  runCli(argv).then((code) => {
    if (code !== 0) {
      process.exit(code);
    }
  });
}
