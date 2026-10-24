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

    case 'assign-reviewers': {
      const attemptId = args[0] || flags['attempt-id'];
      const primaryReviewerId = flags.primary || flags['primary-reviewer-id'];
      const secondaryReviewerId = flags.secondary || flags['secondary-reviewer-id'];

      if (!attemptId || !primaryReviewerId || !secondaryReviewerId) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Required: attempt ID, --primary <reviewer-id>, and --secondary <reviewer-id>.',
          exitCode: ExitCode.VALIDATION_ERROR,
          suggestedFix: 'flashlearn attempt assign-reviewers <attempt-id> --primary <user1> --secondary <user2>',
        });
      }

      if (flags['dry-run']) {
        return {
          data: {
            dryRun: true,
            message: `Would assign blind reviewers to attempt '${attemptId}'`,
            primaryReviewerId,
            secondaryReviewerId,
          },
        };
      }

      const data = await client.request('/api/v1/consensus/assign', {
        method: 'POST',
        body: { attemptId, primaryReviewerId, secondaryReviewerId },
      });

      return {
        data,
        nextActions: [
          { command: `flashlearn attempt blind-review ${data.primaryReview?.blindToken}`, description: 'Inspect primary sanitized review artifact' },
        ],
      };
    }

    case 'blind-review': {
      const blindToken = args[0] || flags['blind-token'] || flags.token;
      if (!blindToken) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Blind token is required: `flashlearn attempt blind-review <blind-token>`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }

      const data = await client.request(`/api/v1/consensus/review/${blindToken}`);
      return {
        data,
        nextActions: [
          { command: `flashlearn attempt score --blind-token ${blindToken} --rubric-scores '{"crit1": 90}'`, description: 'Submit blind scorecard' },
        ],
      };
    }

    case 'score': {
      const blindToken = flags['blind-token'] || flags.token || args[0];
      const rubricScoresRaw = flags['rubric-scores'] || flags.scores;
      const rubricFilePath = flags['rubric-file'];
      const totalScore = flags['total-score'] !== undefined ? Number(flags['total-score']) : undefined;
      const notes = flags.notes || flags.justification;

      if (!blindToken) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Blind token is required: `flashlearn attempt score --blind-token <token> --rubric-scores \'<json>\'`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }

      let rubricScores: Record<string, number> = {};
      if (rubricFilePath) {
        try {
          rubricScores = JSON.parse(readFileSync(rubricFilePath, 'utf-8'));
        } catch (err: any) {
          throw new CliError({
            code: 'INVALID_FILE',
            message: `Failed to read rubric scores file: ${err.message}`,
            exitCode: ExitCode.VALIDATION_ERROR,
          });
        }
      } else if (rubricScoresRaw) {
        try {
          rubricScores = typeof rubricScoresRaw === 'string' ? JSON.parse(rubricScoresRaw) : rubricScoresRaw;
        } catch (err: any) {
          throw new CliError({
            code: 'INVALID_JSON',
            message: `Failed to parse --rubric-scores JSON: ${err.message}`,
            exitCode: ExitCode.VALIDATION_ERROR,
          });
        }
      } else {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Provide scores via --rubric-scores \'<json>\' or --rubric-file <path>',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }

      if (flags['dry-run']) {
        return {
          data: {
            dryRun: true,
            message: `Would submit blind review scores for token '${blindToken}'`,
            rubricScores,
            totalScore,
          },
        };
      }

      const data = await client.request(`/api/v1/consensus/review/${blindToken}/submit`, {
        method: 'POST',
        body: { rubricScores, totalScore, notes },
      });

      return {
        data,
        nextActions: [
          { command: `flashlearn attempt irr-report ${data.attemptId}`, description: 'View consensus and IRR report' },
        ],
      };
    }

    case 'irr-report': {
      const attemptId = args[0] || flags['attempt-id'];
      if (!attemptId) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Attempt ID is required: `flashlearn attempt irr-report <attempt-id>`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }

      const data = await client.request(`/api/v1/consensus/attempt/${attemptId}/irr-report`);
      return { data };
    }

    case 'arbitrate': {
      const attemptId = args[0] || flags['attempt-id'];
      const totalScore = flags['total-score'] !== undefined ? Number(flags['total-score']) : flags.score ? Number(flags.score) : undefined;
      const rubricScoresRaw = flags['rubric-scores'] || flags.scores;
      const notes = flags.notes || flags.justification;

      if (!attemptId || totalScore === undefined) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Required: attempt ID and --total-score / --score <number>.',
          exitCode: ExitCode.VALIDATION_ERROR,
          suggestedFix: 'flashlearn attempt arbitrate <attempt-id> --score 90 --notes "Final arbitration"',
        });
      }

      let rubricScores: Record<string, number> = {};
      if (rubricScoresRaw) {
        try {
          rubricScores = typeof rubricScoresRaw === 'string' ? JSON.parse(rubricScoresRaw) : rubricScoresRaw;
        } catch {
          rubricScores = {};
        }
      }

      if (flags['dry-run']) {
        return {
          data: {
            dryRun: true,
            message: `Would arbitrate disputed attempt '${attemptId}' with score ${totalScore}`,
          },
        };
      }

      const data = await client.request('/api/v1/consensus/arbitrate', {
        method: 'POST',
        body: { attemptId, totalScore, rubricScores, notes },
      });

      return { data };
    }

    default:
      throw new CliError({
        code: 'UNKNOWN_ACTION',
        message: `Unknown action '${action}' for noun 'attempt'. Available: submit, list, pending-reviews, review, assign-reviewers, blind-review, score, irr-report, arbitrate.`,
        exitCode: ExitCode.USAGE_ERROR,
      });
  }
}
