import { SCHEMA_REGISTRY } from '../core/schema-registry';
import { CliError, ExitCode, type NextAction } from '../core/envelope';

export async function handleSchemaCommand(
  action: string,
  args: string[],
  _flags: Record<string, any>
): Promise<{ data: any; nextActions?: NextAction[] }> {
  const targetNoun = args[0] || (action !== 'introspect' && action !== 'list' ? action : undefined);

  if (targetNoun) {
    const schema = SCHEMA_REGISTRY[targetNoun];
    if (!schema) {
      throw new CliError({
        code: 'UNKNOWN_NOUN',
        message: `No schema definition found for noun '${targetNoun}'. Available nouns: ${Object.keys(SCHEMA_REGISTRY).join(', ')}`,
        exitCode: ExitCode.USAGE_ERROR,
      });
    }
    return { data: schema };
  }

  return {
    data: {
      description: 'FlashLearn Agent-First Dynamic CLI Schema Registry (October 2026 Standard)',
      availableNouns: Object.keys(SCHEMA_REGISTRY),
      schemas: SCHEMA_REGISTRY,
    },
  };
}
