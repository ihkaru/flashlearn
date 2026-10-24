import { readFileSync, writeFileSync } from 'node:fs';
import type { ApiClient } from '../core/client';
import { CliError, ExitCode, type NextAction } from '../core/envelope';

export async function handleGateCommand(
  action: string,
  args: string[],
  flags: Record<string, any>,
  client: ApiClient
): Promise<{ data: any; nextActions?: NextAction[] }> {
  switch (action) {
    case 'list': {
      const workspaceId = flags['workspace-id'] || flags.workspace;
      if (!workspaceId) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: '--workspace-id is required: `flashlearn gate list --workspace-id <id>`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }
      const data = await client.request(`/api/v1/gates/workspace/${workspaceId}`);
      return { data };
    }

    case 'create': {
      const workspaceId = flags['workspace-id'] || flags.workspace;
      const level = flags.level !== undefined ? Number(flags.level) : undefined;
      const title = flags.title;
      const description = flags.description;

      if (!workspaceId || level === undefined || !title || !description) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Required flags: --workspace-id, --level (0-3), --title, and --description.',
          exitCode: ExitCode.VALIDATION_ERROR,
          suggestedFix: 'flashlearn gate create --workspace-id <id> --level 3 --title "Title" --description "Desc"',
        });
      }

      let requirements: any[] | undefined;
      if (flags['requirements-file']) {
        try {
          const content = JSON.parse(readFileSync(flags['requirements-file'], 'utf-8'));
          requirements = Array.isArray(content) ? content : content.requirements;
        } catch (err: any) {
          throw new CliError({
            code: 'INVALID_FILE',
            message: `Failed to read requirements file: ${err.message}`,
            exitCode: ExitCode.VALIDATION_ERROR,
          });
        }
      } else if (flags.requirements) {
        try {
          const content = JSON.parse(flags.requirements);
          requirements = Array.isArray(content) ? content : content.requirements;
        } catch (err: any) {
          throw new CliError({
            code: 'INVALID_JSON',
            message: `Failed to parse inline requirements JSON: ${err.message}`,
            exitCode: ExitCode.VALIDATION_ERROR,
          });
        }
      }

      const body = {
        workspaceId,
        level,
        title,
        description,
        requirements,
      };

      const data = await client.request('/api/v1/gates', { method: 'POST', body });
      return { data };
    }

    case 'passports': {
      const data = await client.request('/api/v1/gates/passports');
      return {
        data,
        nextActions: [
          { command: 'flashlearn gate verify <grant-id>', description: 'Verify public status of passport' },
        ],
      };
    }

    case 'verify': {
      const grantId = args[0] || flags['grant-id'];
      if (!grantId) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Grant / Passport ID is required: `flashlearn gate verify <grant-id>`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }
      const data = await client.request(`/api/v1/gates/verify/${grantId}`);
      return { data };
    }

    case 'grant': {
      const gateId = args[0] || flags['gate-id'];
      if (!gateId) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Gate ID is required: `flashlearn gate grant <gate-id>`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }
      const data = await client.request(`/api/v1/gates/${gateId}/grant`, { method: 'POST' });
      return {
        data,
        nextActions: [
          { command: 'flashlearn gate passports', description: 'View active authority passports' },
        ],
      };
    }

    case 'issue-vc': {
      const gateId = args[0] || flags['gate-id'];
      const userId = flags['user-id'] || flags.user;
      if (!gateId || !userId) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Required flags: --gate-id <gateId> and --user-id <userId>',
          exitCode: ExitCode.VALIDATION_ERROR,
          suggestedFix: 'flashlearn gate issue-vc --gate-id <id> --user-id <userId> [--output <file.json>]',
        });
      }

      if (flags['dry-run']) {
        return {
          data: {
            dryRun: true,
            gateId,
            userId,
            message: `Would issue cryptographic W3C VC 2.0 for gate '${gateId}' and user '${userId}'`,
          },
        };
      }

      const res = await client.request('/api/v1/credentials/issue', {
        method: 'POST',
        body: { gateId, userId },
      });

      const credential = res.credential || res;
      if (flags.output) {
        try {
          writeFileSync(flags.output, JSON.stringify(credential, null, 2), 'utf-8');
        } catch (err: any) {
          throw new CliError({
            code: 'FILE_WRITE_ERROR',
            message: `Failed to write credential to file: ${err.message}`,
            exitCode: ExitCode.VALIDATION_ERROR,
          });
        }
      }

      return {
        data: credential,
        nextActions: [
          {
            command: flags.output
              ? `flashlearn gate verify-vc --file ${flags.output}`
              : 'flashlearn gate verify-vc --file <path>',
            description: 'Mathematically verify Ed25519 signature of issued credential',
          },
        ],
      };
    }

    case 'verify-vc': {
      const filePath = flags.file || args[0];
      if (!filePath) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Path to credential file is required: `flashlearn gate verify-vc --file <path>`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }

      if (flags['dry-run']) {
        return {
          data: {
            dryRun: true,
            filePath,
            message: `Would verify cryptographic Ed25519 signature for '${filePath}'`,
          },
        };
      }

      let credential: any;
      try {
        credential = JSON.parse(readFileSync(filePath, 'utf-8'));
      } catch (err: any) {
        throw new CliError({
          code: 'INVALID_FILE',
          message: `Failed to read or parse credential JSON: ${err.message}`,
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }

      const publicKeyPem = flags['public-key'];
      const result = await client.request('/api/v1/credentials/verify', {
        method: 'POST',
        body: { credential, publicKeyPem },
      });

      return { data: result };
    }

    default:
      throw new CliError({
        code: 'UNKNOWN_ACTION',
        message: `Unknown action '${action}' for noun 'gate'. Available: list, create, passports, verify, grant, issue-vc, verify-vc.`,
        exitCode: ExitCode.USAGE_ERROR,
      });
  }
}
