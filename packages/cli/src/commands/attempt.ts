import { readFileSync } from 'node:fs';
import type { ApiClient } from '../core/client';
import { CliError, ExitCode, type NextAction } from '../core/envelope';

export async function handleAttemptCommand(
  action: string,
  args: string[],
  flags: Record<string, any>,
  client: ApiClient
): Promise<{ data: any; nextActions?: NextAction[] }> {
  switch (action) {
    case 'submit': {
      const taskId = args[0] || flags['task-id'];
      const submissionFilePath = flags['submission-file'] || flags.file;
      const rawText = flags.text || flags.answer;

      if (!taskId) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Task ID is required: `flashlearn attempt submit <task-id> --submission-file <file.json>`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }

      let submission: any = {};
      if (submissionFilePath) {
        try {
          submission = JSON.parse(readFileSync(submissionFilePath, 'utf-8'));
        } catch (err: any) {
          throw new CliError({
            code: 'INVALID_FILE',
            message: `Failed to read submission file: ${err.message}`,
            exitCode: ExitCode.VALIDATION_ERROR,
          });
        }
      } else if (rawText) {
        submission = { text: rawText, studentAnswerText: rawText };
      } else {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Provide either --submission-file or --text/--answer.',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }

      const data = await client.request(`/api/v1/tasks/${taskId}/submit`, {
        method: 'POST',
        body: { submission },
      });

      return {
        data,
        nextActions: [
          { command: `flashlearn gate passports`, description: 'Check updated gate passports' },
          { command: `flashlearn flashcard due`, description: 'Check 3D flashcards generated from mistakes' },
        ],
      };
    }

    case 'list': {
      const taskId = args[0] || flags['task-id'];
      if (!taskId) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Task ID is required: `flashlearn attempt list <task-id>`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }
      const data = await client.request(`/api/v1/tasks/${taskId}/attempts`);
      return { data };
    }

    case 'pending-reviews': {
      const data = await client.request('/api/v1/reviewer/pending');
      return {
        data,
        nextActions: [
          { command: 'flashlearn attempt review --attempt-id <id> --passed true --notes "<NOTES>" --rubric-file <FILE>', description: 'Sign off Class C review' },
        ],
      };
    }

    case 'review': {
      const attemptId = flags['attempt-id'] || args[0];
      const passed = flags.passed === 'true' || flags.passed === true;
      const notes = flags.notes || flags.justification;
      const rubricFilePath = flags['rubric-file'];

      if (!attemptId || !notes || !rubricFilePath) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Required: --attempt-id, --passed (true|false), --notes, and --rubric-file.',
          exitCode: ExitCode.VALIDATION_ERROR,
          suggestedFix: 'flashlearn attempt review --attempt-id <id> --passed true --notes "Approved" --rubric-file ./scores.json',
        });
      }

      let rubricScores: any[];
      try {
        rubricScores = JSON.parse(readFileSync(rubricFilePath, 'utf-8'));
      } catch (err: any) {
        throw new CliError({
          code: 'INVALID_FILE',
          message: `Failed to read rubric scores file: ${err.message}`,
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }

      const body = {
        attemptId,
        passed,
        expertNotes: notes,
        rubricScores: Array.isArray(rubricScores) ? rubricScores : rubricScores.rubricScores,
      };

      const data = await client.request('/api/v1/reviewer/evaluate', { method: 'POST', body });
      return {
        data,
        nextActions: [
          { command: 'flashlearn audit list --action CLASS_C_EXPERT_REVIEWED', description: 'Inspect audit trail' },
        ],
      };
    }

    default:
      throw new CliError({
        code: 'UNKNOWN_ACTION',
        message: `Unknown action '${action}' for noun 'attempt'. Available: submit, list, pending-reviews, review.`,
        exitCode: ExitCode.USAGE_ERROR,
      });
  }
}
