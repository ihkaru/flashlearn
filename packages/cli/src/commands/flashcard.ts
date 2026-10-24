import type { ApiClient } from '../core/client';
import { CliError, ExitCode, type NextAction } from '../core/envelope';

export async function handleFlashcardCommand(
  action: string,
  args: string[],
  flags: Record<string, any>,
  client: ApiClient
): Promise<{ data: any; nextActions?: NextAction[] }> {
  switch (action) {
    case 'due': {
      const data = await client.request('/api/v1/spaced/due');
      return {
        data,
        nextActions: [
          { command: 'flashlearn flashcard practice <card-id> --quality <0-5>', description: 'Review flashcard with SM-2 quality rating' },
        ],
      };
    }

    case 'practice': {
      const cardId = args[0] || flags['card-id'];
      const quality = flags.quality !== undefined ? Number(flags.quality) : undefined;

      if (!cardId || quality === undefined || isNaN(quality) || quality < 0 || quality > 5) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Flashcard ID and --quality (0 to 5) are required: `flashlearn flashcard practice <id> --quality 4`',
          exitCode: ExitCode.VALIDATION_ERROR,
          suggestedFix: '0: Complete blackout, 3: Correct with difficulty, 5: Perfect instant recall.',
        });
      }

      const data = await client.request(`/api/v1/spaced/${cardId}/practice`, {
        method: 'POST',
        body: { quality },
      });

      return { data };
    }

    default:
      throw new CliError({
        code: 'UNKNOWN_ACTION',
        message: `Unknown action '${action}' for noun 'flashcard'. Available: due, practice.`,
        exitCode: ExitCode.USAGE_ERROR,
      });
  }
}
