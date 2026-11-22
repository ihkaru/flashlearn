import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { CorpusIndexDocument, PlanModuleState } from '@flashlearn/shared';
import type { ApiClient } from '../core/client';
import { CliError, ExitCode, type NextAction } from '../core/envelope';
import { indexMultiFormatCorpus } from '../core/corpus/corpus-indexer';
import {
  buildAgentNextPacket,
  buildResumableCurriculumPlan,
  loadCurriculumPlan,
  saveCurriculumPlan,
  type DeckPolicy,
} from '../core/plan/plan-builder';
import {
  diffPlanWithRemote,
  pruneRemoteFromPlan,
  pullRemoteToPlan,
  pushPlanToRemote,
} from '../core/plan/plan-remote-sync';

const VALID_STATES = new Set<PlanModuleState>([
  'planned',
  'sliced',
  'designed',
  'uila_ready',
  'deck_ready',
  'audited',
  'published',
]);

export async function handlePlanCommand(
  action: string,
  args: string[],
  flags: Record<string, any>,
  client: ApiClient
): Promise<{ data: any; nextActions?: NextAction[] }> {
  const workDir = String(flags.dir || args[0] || '');

  switch (action) {
    case 'init': {
      const targetDir = String(flags.dir || flags.out || '');
      const title = String(flags.title || flags.name || '');
      if (!targetDir || !title) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message:
            'Required: --dir <workDir> and --title "<Workspace Name>". Pass --input <pdf/epub/pptx/dir> to index sources automatically.',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }

      const absDir = resolve(targetDir);
      let corpusIndex: CorpusIndexDocument;
      if (flags.input) {
        const inputs = String(flags.input)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        const res = await indexMultiFormatCorpus({
          inputs,
          outDir: absDir,
          pagesPerPdfSlice: flags['pages-per-slice'] ? Number(flags['pages-per-slice']) : undefined,
          slidesPerPptxSlice: flags['slides-per-slice'] ? Number(flags['slides-per-slice']) : undefined,
          maxTokensPerSlice: flags['max-tokens'] ? Number(flags['max-tokens']) : undefined,
        });
        corpusIndex = res.index;
      } else {
        const idxPath = join(absDir, 'corpus-index.json');
        if (!existsSync(idxPath)) {
          throw new CliError({
            code: 'MISSING_ARGUMENT',
            message: `No corpus-index.json in ${absDir}. Pass --input <pdf/epub/pptx/dir> or run \`flashlearn corpus index\` first.`,
            exitCode: ExitCode.VALIDATION_ERROR,
          });
        }
        corpusIndex = JSON.parse(readFileSync(idxPath, 'utf-8'));
      }

      const deckPolicy = (flags.decks || 'selective') as DeckPolicy;
      const { planPath, handoffPath, plan } = buildResumableCurriculumPlan({
        workDir: absDir,
        corpusIndex,
        workspaceName: title,
        workspaceSlug: flags.slug,
        maxUnitMinutes: flags['max-unit-minutes'] ? Number(flags['max-unit-minutes']) : 90,
        targetModuleMinutes: flags['module-minutes'] ? Number(flags['module-minutes']) : 10,
        deckPolicy,
      });

      return {
        data: {
          planPath,
          handoffPath,
          projectSlug: plan.projectSlug,
          scaleClass: plan.scaleClass,
          maxUnitMinutes: plan.maxUnitMinutes,
          unitsCount: plan.units.length,
          modulesCount: plan.modules.length,
          coverage: plan.coverage,
          units: plan.units,
        },
        nextActions: [
          {
            command: `flashlearn plan next --dir "${absDir}" --count 2`,
            description: 'Fetch focused source slices & checklist for the next 2 modules',
          },
          {
            command: `flashlearn plan status --dir "${absDir}"`,
            description: 'Inspect resumable build ledger across all lecture units',
          },
        ],
      };
    }

    case 'status': {
      if (!workDir) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Usage: `flashlearn plan status --dir <workDir>`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }
      const plan = loadCurriculumPlan(workDir);
      const byState: Record<string, number> = {};
      for (const m of plan.modules) byState[m.state] = (byState[m.state] || 0) + 1;
      return {
        data: {
          projectSlug: plan.projectSlug,
          workspaceName: plan.workspaceName,
          workspaceId: plan.workspaceId ?? null,
          scaleClass: plan.scaleClass,
          maxUnitMinutes: plan.maxUnitMinutes,
          coverage: plan.coverage,
          progressByState: byState,
          units: plan.units.map((u) => ({
            ...u,
            publishedCount: plan.modules.filter((m) => m.unitCode === u.unitCode && m.state === 'published').length,
          })),
        },
        nextActions: [
          {
            command: `flashlearn plan next --dir "${resolve(workDir)}" --count 2`,
            description: 'Get next authoring packet for coding agent',
          },
        ],
      };
    }

    case 'next': {
      if (!workDir) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Usage: `flashlearn plan next --dir <workDir> [--count 2] [--unit U01]`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }
      const data = buildAgentNextPacket(workDir, {
        count: flags.count ? Number(flags.count) : 2,
        unitCode: flags.unit,
      });
      return { data };
    }

    case 'mark': {
      const slug = flags.module || args[0];
      const state = flags.state as PlanModuleState;
      if (!workDir || !slug || !state || !VALID_STATES.has(state)) {
        throw new CliError({
          code: 'VALIDATION_ERROR',
          message:
            'Usage: `flashlearn plan mark --dir <workDir> --module <slug> --state <planned|sliced|designed|uila_ready|deck_ready|audited|published>`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }
      const plan = loadCurriculumPlan(workDir);
      const mod = plan.modules.find((m) => m.slug === slug);
      if (!mod) {
        throw new CliError({
          code: 'NOT_FOUND',
          message: `Module slug '${slug}' not found in curriculum-plan.json`,
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }
      mod.state = state;
      if (flags.notes) mod.notes = String(flags.notes);
      mod.lastUpdatedAt = new Date().toISOString();
      const planPath = saveCurriculumPlan(workDir, plan);
      return {
        data: { planPath, updatedModule: mod },
      };
    }

    case 'diff': {
      if (!workDir) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Usage: `flashlearn plan diff --dir <workDir>`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }
      const data = await diffPlanWithRemote(client, workDir);
      return { data };
    }

    case 'push':
    case 'publish': {
      if (!workDir) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message:
            'Usage: `flashlearn plan push --dir <workDir> [--module <slug> | --unit <U01>] [--upload-media] [--dry-run]`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }
      const data = await pushPlanToRemote(client, workDir, {
        moduleSlug: flags.module,
        unitCode: flags.unit,
        dryRun: Boolean(flags['dry-run']),
        uploadMedia: Boolean(flags['upload-media']),
        vaultUrl: flags['mediavault-url'],
        vaultKey: flags['mediavault-key'],
      });
      return { data };
    }

    case 'prune': {
      if (!workDir) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Usage: `flashlearn plan prune --dir <workDir> --yes [--dry-run]`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }
      if (!flags['dry-run'] && !flags.yes && !flags.y && !flags.force) {
        throw new CliError({
          code: 'CONFIRMATION_REQUIRED',
          message: 'Pruning remote modules is destructive. Pass `--yes` (or inspect first with `--dry-run`).',
          exitCode: ExitCode.USAGE_ERROR,
        });
      }
      const data = await pruneRemoteFromPlan(client, workDir, {
        dryRun: Boolean(flags['dry-run']),
      });
      return { data };
    }

    case 'pull': {
      const wsId = flags['workspace-id'] || flags.workspace || args[0];
      const outDir = String(flags.dir || flags.out || '');
      if (!wsId || !outDir) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message: 'Usage: `flashlearn plan pull --workspace-id <id-or-slug> --dir <workDir>`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }
      const data = await pullRemoteToPlan(client, String(wsId), outDir);
      return { data };
    }

    default:
      throw new CliError({
        code: 'UNKNOWN_ACTION',
        message: `Unknown action '${action}' for noun 'plan'. Available: init, status, next, mark, diff, push, prune, pull.`,
        exitCode: ExitCode.USAGE_ERROR,
      });
  }
}
