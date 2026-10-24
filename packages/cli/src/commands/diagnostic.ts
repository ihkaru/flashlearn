import { readFileSync } from 'node:fs';
import type { ApiClient } from '../core/client';
import { CliError, ExitCode, type NextAction } from '../core/envelope';

export async function handleDiagnosticCommand(
  action: string,
  args: string[],
  flags: Record<string, any>,
  client: ApiClient
): Promise<{ data: any; nextActions?: NextAction[] }> {
  switch (action) {
    case 'start': {
      const workspaceId = args[0] || flags['workspace-id'] || flags.workspace;
      if (!workspaceId) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Workspace ID is required: `flashlearn diagnostic start <workspace-id>`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }

      if (flags['dry-run']) {
        return {
          data: { dryRun: true, message: `Would start diagnostic session for workspace '${workspaceId}'` },
        };
      }

      const data = await client.request('/api/v1/diagnostic/start', {
        method: 'POST',
        body: { workspaceId },
      });

      const nextActions: NextAction[] = [
        {
          command: `flashlearn diagnostic next ${data.session.id}`,
          description: 'Get first minimal-entropy diagnostic probe recommendation',
        },
      ];

      return { data, nextActions };
    }

    case 'next': {
      const sessionId = args[0] || flags['session-id'] || flags.session;
      if (!sessionId) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Session ID is required: `flashlearn diagnostic next <session-id>`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }

      const data = await client.request(`/api/v1/diagnostic/${sessionId}/next`, {
        method: 'GET',
      });

      const nextActions: NextAction[] = [];
      if (!data.isComplete && data.task) {
        nextActions.push({
          command: `flashlearn diagnostic submit ${sessionId} --submission '{"answer": "..."}'`,
          description: `Submit answer for probe task '${data.task.id}'`,
        });
      }

      return { data, nextActions };
    }

    case 'submit': {
      const sessionId = args[0] || flags['session-id'] || flags.session;
      if (!sessionId) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Session ID is required: `flashlearn diagnostic submit <session-id> --submission <json>`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }

      let submission: Record<string, any> = {};
      const submissionRaw = flags.submission;
      const submissionFile = flags['submission-file'] || flags.file;
      const rawText = flags.text || flags.answer;

      if (submissionFile) {
        try {
          submission = JSON.parse(readFileSync(submissionFile, 'utf-8'));
        } catch (err: any) {
          throw new CliError({
            code: 'INVALID_FILE',
            message: `Failed to read submission file: ${err.message}`,
            exitCode: ExitCode.VALIDATION_ERROR,
          });
        }
      } else if (submissionRaw) {
        try {
          submission = typeof submissionRaw === 'string' ? JSON.parse(submissionRaw) : submissionRaw;
        } catch (err: any) {
          throw new CliError({
            code: 'INVALID_JSON',
            message: `Failed to parse --submission JSON: ${err.message}`,
            exitCode: ExitCode.VALIDATION_ERROR,
          });
        }
      } else if (rawText) {
        submission = { text: rawText, studentAnswerText: rawText };
      } else {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Provide submission payload via --submission \'<json>\', --submission-file <path>, or --text <answer>',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }

      if (flags['dry-run']) {
        return {
          data: { dryRun: true, message: `Would submit diagnostic probe solution for session '${sessionId}'`, submission },
        };
      }

      const data = await client.request(`/api/v1/diagnostic/${sessionId}/submit`, {
        method: 'POST',
        body: { submission },
      });

      const nextActions: NextAction[] = [];
      if (!data.isComplete) {
        nextActions.push({
          command: `flashlearn diagnostic next ${sessionId}`,
          description: 'Fetch next recommended probe',
        });
      }

      return { data, nextActions };
    }

    default:
      throw new CliError({
        code: 'UNKNOWN_ACTION',
        message: `Unknown diagnostic action '${action}'. Valid actions: start, next, submit`,
        exitCode: ExitCode.UNKNOWN_COMMAND,
      });
  }
}
