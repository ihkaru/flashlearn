import { readFileSync } from 'node:fs';
import type { ApiClient } from '../core/client';
import { CliError, ExitCode, type NextAction } from '../core/envelope';

export async function handleTaskCommand(
  action: string,
  args: string[],
  flags: Record<string, any>,
  client: ApiClient
): Promise<{ data: any; nextActions?: NextAction[] }> {
  switch (action) {
    case 'list': {
      const competencyId = flags['competency-id'] || args[0];
      if (!competencyId) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: '--competency-id is required: `flashlearn task list --competency-id <id>`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }
      const data = await client.request('/api/v1/tasks', { query: { competencyId } });
      return {
        data,
        nextActions: [
          { command: 'flashlearn task get <task-id>', description: 'View full scenario and rubric' },
        ],
      };
    }

    case 'get': {
      const id = args[0];
      if (!id) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Task ID is required: `flashlearn task get <id>`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }
      const data = await client.request(`/api/v1/tasks/${id}`);
      return {
        data,
        nextActions: [
          { command: `flashlearn attempt submit ${id} --submission-file <answer.json>`, description: 'Submit attempt to Oracle evaluator' },
          { command: `flashlearn task socratic-hint ${id} --question "<QUESTION>"`, description: 'Consult Socratic AI Tutor' },
        ],
      };
    }

    case 'create': {
      const competencyId = flags['competency-id'];
      const title = flags.title;
      const scenario = flags.scenario;
      const taskType = flags.type || flags['task-type'] || 'calculation';
      const oracleFilePath = flags['oracle-file'];
      const inlineOracle = flags.oracle;
      const rubricFilePath = flags['rubric-file'];
      const inlineRubric = flags.rubric;
      const adversarialFilePath = flags['adversarial-file'];
      const inlineAdversarial = flags['adversarial-spec'];

      const isAdv = taskType === 'adversarial_dilemma';
      const hasOracle = !!(oracleFilePath || inlineOracle || isAdv);
      const hasRubric = !!(rubricFilePath || inlineRubric || isAdv);

      if (!competencyId || !title || !scenario || !hasOracle || !hasRubric) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Required: --competency-id, --title, --scenario, and oracle/rubric (or --adversarial-spec for adversarial tasks).',
          exitCode: ExitCode.VALIDATION_ERROR,
          suggestedFix: 'flashlearn task create --competency-id <id> --title "Task" --scenario "Problem..." --type adversarial_dilemma --adversarial-spec \'<json>\'',
        });
      }

      let oracleData: any = {};
      let rubricCriteria: any = [];
      let adversarialSpec: any = undefined;

      if (adversarialFilePath) {
        try {
          adversarialSpec = JSON.parse(readFileSync(adversarialFilePath, 'utf-8'));
        } catch (err: any) {
          throw new CliError({
            code: 'INVALID_FILE',
            message: `Failed to read adversarial spec file: ${err.message}`,
            exitCode: ExitCode.VALIDATION_ERROR,
          });
        }
      } else if (inlineAdversarial) {
        try {
          adversarialSpec = JSON.parse(inlineAdversarial);
        } catch (err: any) {
          throw new CliError({
            code: 'INVALID_JSON',
            message: `Failed to parse inline adversarial spec: ${err.message}`,
            exitCode: ExitCode.VALIDATION_ERROR,
          });
        }
      }

      if (oracleFilePath) {
        try {
          oracleData = JSON.parse(readFileSync(oracleFilePath, 'utf-8'));
        } catch (err: any) {
          throw new CliError({
            code: 'INVALID_FILE',
            message: `Failed to read oracle file ${oracleFilePath}: ${err.message}`,
            exitCode: ExitCode.VALIDATION_ERROR,
          });
        }
      } else if (inlineOracle) {
        try {
          oracleData = JSON.parse(inlineOracle);
        } catch (err: any) {
          throw new CliError({
            code: 'INVALID_JSON',
            message: `Failed to parse inline oracle JSON: ${err.message}`,
            exitCode: ExitCode.VALIDATION_ERROR,
          });
        }
      }

      if (rubricFilePath) {
        try {
          rubricCriteria = JSON.parse(readFileSync(rubricFilePath, 'utf-8'));
        } catch (err: any) {
          throw new CliError({
            code: 'INVALID_FILE',
            message: `Failed to read rubric file ${rubricFilePath}: ${err.message}`,
            exitCode: ExitCode.VALIDATION_ERROR,
          });
        }
      } else if (inlineRubric) {
        try {
          rubricCriteria = JSON.parse(inlineRubric);
        } catch (err: any) {
          throw new CliError({
            code: 'INVALID_JSON',
            message: `Failed to parse inline rubric JSON: ${err.message}`,
            exitCode: ExitCode.VALIDATION_ERROR,
          });
        }
      }

      const body = {
        competencyId,
        title,
        scenario,
        taskType,
        oracleData,
        adversarialSpec,
        rubricCriteria: Array.isArray(rubricCriteria) ? rubricCriteria : (rubricCriteria?.rubricCriteria || []),
        passingScore: flags['passing-score'] ? Number(flags['passing-score']) : 80,
      };

      const data = await client.request('/api/v1/tasks', { method: 'POST', body });
      return {
        data,
        nextActions: [
          { command: `flashlearn attempt submit ${data.id} --submission-file <answer.json>`, description: 'Test Oracle evaluation' },
        ],
      };
    }

    case 'socratic-hint': {
      const id = args[0];
      const question = flags.question || args.slice(1).join(' ');
      if (!id || !question) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Task ID and --question are required: `flashlearn task socratic-hint <id> --question "<QUESTION>"`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }
      const data = await client.request(`/api/v1/tasks/${id}/socratic-hint`, {
        method: 'POST',
        body: { question },
      });
      return { data };
    }

    default:
      throw new CliError({
        code: 'UNKNOWN_ACTION',
        message: `Unknown action '${action}' for noun 'task'. Available: list, get, create, socratic-hint.`,
        exitCode: ExitCode.USAGE_ERROR,
      });
  }
}
