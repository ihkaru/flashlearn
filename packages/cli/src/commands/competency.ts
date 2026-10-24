import type { ApiClient } from '../core/client';
import { CliError, ExitCode, type NextAction } from '../core/envelope';

export async function handleCompetencyCommand(
  action: string,
  args: string[],
  flags: Record<string, any>,
  client: ApiClient
): Promise<{ data: any; nextActions?: NextAction[] }> {
  switch (action) {
    case 'graph': {
      const workspaceId = flags['workspace-id'] || flags.workspace;
      if (!workspaceId) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: '--workspace-id is required: `flashlearn competency graph --workspace-id <id>`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }
      const data = await client.request('/api/v1/competencies/graph', { query: { workspaceId } });
      return {
        data,
        nextActions: [
          { command: `flashlearn task list --competency-id <COMPETENCY_ID>`, description: 'List tasks for competency node' },
        ],
      };
    }

    case 'get': {
      const id = args[0];
      if (!id) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Competency ID is required: `flashlearn competency get <id>`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }
      const data = await client.request(`/api/v1/competencies/${id}`);
      return { data };
    }

    case 'create': {
      const workspaceId = flags['workspace-id'] || flags.workspace;
      const code = flags.code;
      const title = flags.title;
      const description = flags.description;
      const oracleClass = flags['oracle-class'] || flags.class || 'A';
      const riskLevel = flags['risk-level'] || flags.risk || 'low';

      if (!workspaceId || !code || !title || !description) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Required flags: --workspace-id, --code, --title, and --description.',
          exitCode: ExitCode.VALIDATION_ERROR,
          suggestedFix: 'flashlearn competency create --workspace-id <id> --code HPS-01 --title "Title" --description "Desc" --oracle-class A --risk-level low',
        });
      }

      const body = {
        workspaceId,
        sourceId: flags['source-id'],
        code,
        title,
        description,
        oracleClass,
        riskLevel,
        prerequisiteIds: flags.prerequisites ? String(flags.prerequisites).split(',') : undefined,
      };

      const data = await client.request('/api/v1/competencies', { method: 'POST', body });
      return {
        data,
        nextActions: [
          { command: `flashlearn task create --competency-id ${data.id} --title "<TITLE>" --scenario "<SCENARIO>" --type calculation --oracle-file <FILE> --rubric-file <FILE>`, description: 'Add evaluation task to this node' },
          { command: `flashlearn competency approve ${data.id}`, description: 'Expert sign-off on competency node' },
        ],
      };
    }

    case 'link-prerequisite': {
      const competencyId = flags['competency-id'] || args[0];
      const prerequisiteId = flags['prerequisite-id'] || args[1];

      if (!competencyId || !prerequisiteId) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Required: --competency-id and --prerequisite-id.',
          exitCode: ExitCode.VALIDATION_ERROR,
          suggestedFix: 'flashlearn competency link-prerequisite --competency-id <id> --prerequisite-id <id>',
        });
      }

      const data = await client.request('/api/v1/competencies/link-prerequisite', {
        method: 'POST',
        body: { competencyId, prerequisiteId },
      });
      return { data };
    }

    case 'approve': {
      const id = args[0];
      if (!id) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Competency ID is required: `flashlearn competency approve <id>`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }
      const data = await client.request(`/api/v1/competencies/${id}/approve`, { method: 'POST' });
      return { data };
    }

    case 'mastery': {
      const id = args[0];
      const status = flags.status;
      if (!id || !status) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Competency ID and --status are required: `flashlearn competency mastery <id> --status ready|in_progress|mastered|stale`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }
      const data = await client.request(`/api/v1/competencies/${id}/mastery`, {
        method: 'POST',
        body: { status, verifiedAttemptId: flags['verified-attempt-id'] },
      });
      return { data };
    }

    default:
      throw new CliError({
        code: 'UNKNOWN_ACTION',
        message: `Unknown action '${action}' for noun 'competency'. Available: graph, get, create, link-prerequisite, approve, mastery.`,
        exitCode: ExitCode.USAGE_ERROR,
      });
  }
}
