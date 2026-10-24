import { readFileSync, writeFileSync } from 'node:fs';
import type { ApiClient } from '../core/client';
import { CliError, ExitCode, type NextAction } from '../core/envelope';
import { synthesizeDomainBlueprint } from '../core/domain-synthesizer';

export async function handleWorkspaceCommand(
  action: string,
  args: string[],
  flags: Record<string, any>,
  client: ApiClient
): Promise<{ data: any; nextActions?: NextAction[] }> {
  switch (action) {
    case 'list': {
      const isPublic = flags.public ? true : undefined;
      const data = await client.request('/api/v1/workspaces', { query: { isPublic } });
      return {
        data,
        nextActions: [
          { command: 'flashlearn workspace create --name "<name>"', description: 'Create a new workspace' },
          { command: 'flashlearn workspace get <id-or-slug>', description: 'Inspect workspace details' },
        ],
      };
    }

    case 'get': {
      const idOrSlug = args[0];
      if (!idOrSlug) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Workspace ID or slug is required: `flashlearn workspace get <id-or-slug>`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }
      const data = await client.request(`/api/v1/workspaces/${idOrSlug}`);
      return {
        data,
        nextActions: [
          { command: `flashlearn competency graph --workspace-id ${data.id}`, description: 'Inspect competency graph' },
          { command: `flashlearn source list --workspace-id ${data.id}`, description: 'List legal/SOP sources' },
        ],
      };
    }

    case 'create': {
      const name = flags.name || args[0];
      if (!name) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: '--name is required: `flashlearn workspace create --name "Nama"`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }
      const body = {
        name,
        slug: flags.slug,
        description: flags.description,
        isPublic: Boolean(flags.public),
      };
      const data = await client.request('/api/v1/workspaces', { method: 'POST', body });
      return {
        data,
        nextActions: [
          { command: `flashlearn source ingest --workspace-id ${data.id} --code <CODE> --title "<TITLE>" --file <FILE>`, description: 'Ingest legal/SOP corpus' },
          { command: `flashlearn competency create --workspace-id ${data.id} --code <CODE> --title "<TITLE>" --oracle-class A --risk-level low`, description: 'Create first competency node' },
        ],
      };
    }

    case 'import-blueprint': {
      const filePath = flags.file || args[0];
      if (!filePath) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: '--file path is required: `flashlearn workspace import-blueprint --file <path.json>`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }
      let blueprint: any;
      try {
        blueprint = JSON.parse(readFileSync(filePath, 'utf-8'));
      } catch (err: any) {
        throw new CliError({
          code: 'INVALID_FILE',
          message: `Failed to read blueprint JSON from ${filePath}: ${err.message}`,
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }
      const data = await client.request('/api/v1/workspaces/import-blueprint', { method: 'POST', body: blueprint });
      return {
        data,
        nextActions: [
          { command: `flashlearn competency graph --workspace-id ${data.workspaceId}`, description: 'Verify imported competency graph' },
          { command: `flashlearn gate list --workspace-id ${data.workspaceId}`, description: 'Inspect imported authorization gates' },
        ],
      };
    }

    case 'delete': {
      const id = args[0];
      if (!id) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Workspace ID is required: `flashlearn workspace delete <id> --yes`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }
      if (!flags.yes && !flags.y && !flags.force) {
        throw new CliError({
          code: 'CONFIRMATION_REQUIRED',
          message: 'Destructive action requires --yes or --force flag in non-interactive environment.',
          exitCode: ExitCode.USAGE_ERROR,
          suggestedFix: `Run with \`--yes\`: flashlearn workspace delete ${id} --yes`,
        });
      }
      const data = await client.request(`/api/v1/workspaces/${id}`, { method: 'DELETE' });
      return { data };
    }

    case 'describe':
    case 'diagnose': {
      const idOrSlug = args[0] || flags['workspace-id'] || flags.workspace;
      if (!idOrSlug) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Workspace ID or slug is required: `flashlearn workspace describe <id-or-slug>`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }
      const data = await client.request(`/api/v1/workspaces/${idOrSlug}/describe`);
      const nextActions: NextAction[] = [];
      if (data.recommendations && data.recommendations.length > 0) {
        for (const rec of data.recommendations.slice(0, 3)) {
          nextActions.push({
            command: rec.suggestedCliCommand,
            description: rec.issue,
          });
        }
      }
      return { data, nextActions: nextActions.length > 0 ? nextActions : undefined };
    }

    case 'synthesize':
    case 'bootstrap': {
      const workspaceName = flags['workspace-name'] || flags.name || args[0];
      const sourceFilesStr = flags['source-files'] || flags.files || flags.file;
      const isDryRun = !!flags['dry-run'];
      const outputFile = flags.output;

      if (!workspaceName || !sourceFilesStr) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Workspace name and source files are required: `flashlearn workspace synthesize --workspace-name "<name>" --source-files "<file1.md,file2.md>"`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }

      const sourceFiles = String(sourceFilesStr).split(',').map((f) => f.trim()).filter((f) => f.length > 0);
      const synthResult = synthesizeDomainBlueprint({
        workspaceName,
        sourceFiles,
        slug: flags.slug,
        outputFile,
      });

      if (outputFile) {
        writeFileSync(outputFile, JSON.stringify(synthResult.blueprint, null, 2), 'utf-8');
      }

      if (isDryRun) {
        return {
          data: {
            dryRun: true,
            workspaceName,
            ...synthResult.statistics,
            dagIsAcyclic: synthResult.dagIsAcyclic,
            outputFile: outputFile || null,
          },
          nextActions: [
            {
              command: `flashlearn workspace synthesize --workspace-name "${workspaceName}" --source-files "${sourceFilesStr}"`,
              description: 'Persist domain blueprint into production FlashLearn engine',
            },
          ],
        };
      }

      const res = await client.request('/api/v1/workspaces/import-blueprint', {
        method: 'POST',
        body: synthResult.blueprint,
      });

      const desc = await client.request(`/api/v1/workspaces/${res.workspaceId}/describe`);

      return {
        data: {
          workspaceId: res.workspaceId,
          slug: res.slug || flags.slug,
          readinessScore: desc.readinessScore,
          cycleDetected: desc.cycleDetected,
          gaps: desc.gaps,
          topology: desc.topology,
          statistics: desc.statistics,
        },
        nextActions: [
          {
            command: `flashlearn workspace describe ${res.workspaceId}`,
            description: 'Inspect live domain topology and readiness ledger',
          },
        ],
      };
    }

    default:
      throw new CliError({
        code: 'UNKNOWN_ACTION',
        message: `Unknown action '${action}' for noun 'workspace'. Available actions: list, get, create, describe, diagnose, import-blueprint, delete.`,
        exitCode: ExitCode.USAGE_ERROR,
      });
  }
}
