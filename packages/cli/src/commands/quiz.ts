import { readFileSync } from 'node:fs';
import type { ApiClient } from '../core/client';
import { CliError, ExitCode, type NextAction } from '../core/envelope';

export async function handleQuizCommand(
  action: string,
  args: string[],
  flags: Record<string, any>,
  client: ApiClient
): Promise<{ data: any; nextActions?: NextAction[] }> {
  switch (action) {
    case 'submit': {
      const contentId = args[0] || flags['content-id'];
      const guestName = flags['guest-name'] || flags.name;
      const answersFilePath = flags['answers-file'] || flags.file;

      if (!contentId || !guestName || !answersFilePath) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Required: Content ID, --guest-name, and --answers-file.',
          exitCode: ExitCode.VALIDATION_ERROR,
          suggestedFix: 'flashlearn quiz submit <content-id> --guest-name "Participant" --answers-file ./answers.json',
        });
      }

      let answers: any[];
      try {
        const fileContent = JSON.parse(readFileSync(answersFilePath, 'utf-8'));
        answers = Array.isArray(fileContent) ? fileContent : fileContent.answers;
      } catch (err: any) {
        throw new CliError({
          code: 'INVALID_FILE',
          message: `Failed to read answers JSON: ${err.message}`,
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }

      const body = { guestName, answers };
      const data = await client.request(`/api/v1/contents/${contentId}/submit-quiz`, {
        method: 'POST',
        body,
      });

      return {
        data,
        nextActions: [
          { command: 'flashlearn flashcard due', description: 'Review generated flashcards for incorrect answers' },
        ],
      };
    }

    default:
      throw new CliError({
        code: 'UNKNOWN_ACTION',
        message: `Unknown action '${action}' for noun 'quiz'. Available: submit.`,
        exitCode: ExitCode.USAGE_ERROR,
      });
  }
}
