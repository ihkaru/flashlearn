#!/usr/bin/env bun
/**
 * FlashLearn Autonomous Domain Synthesizer Script
 * Agent-Agnostic Engine that ingests Markdown regulations/SOPs,
 * validates DAG acyclicity via Tarjan's SCC, and generates a complete DomainBlueprint.
 */

import { writeFileSync } from 'node:fs';
import { synthesizeDomainBlueprint } from '../../../../packages/cli/src/core/domain-synthesizer';

async function main() {
  const args = process.argv.slice(2);
  const flags: Record<string, string | boolean> = {};

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      if (v !== undefined) {
        flags[k] = v;
      } else if (args[i + 1] && !args[i + 1].startsWith('--')) {
        flags[k] = args[i + 1];
        i++;
      } else {
        flags[k] = true;
      }
    }
  }

  const wsName = (flags['workspace-name'] as string) || (flags['name'] as string);
  const srcFilesStr = (flags['source-files'] as string) || (flags['sources'] as string) || (flags['file'] as string);
  const isDryRun = !!flags['dry-run'];
  const outputFile = flags['output'] as string;
  const apiUrl = (flags['api-url'] as string) || 'http://localhost:3000';

  if (!wsName || !srcFilesStr) {
    console.error(
      JSON.stringify(
        {
          schemaVersion: '1.0.0',
          status: 'error',
          code: 'MISSING_ARGUMENT',
          message:
            'Usage: bun synthesize_domain.ts --workspace-name "<NAME>" --source-files "<file1.md,file2.md>" [--dry-run] [--output <path>]',
        },
        null,
        2
      )
    );
    process.exit(64);
  }

  const filePaths = srcFilesStr
    .split(',')
    .map((f) => f.trim())
    .filter((f) => f.length > 0);

  try {
    const result = synthesizeDomainBlueprint({
      workspaceName: wsName,
      sourceFiles: filePaths,
      slug: flags['slug'] as string,
      outputFile,
    });

    if (outputFile) {
      writeFileSync(outputFile, JSON.stringify(result.blueprint, null, 2), 'utf-8');
    }

    if (isDryRun) {
      console.log(
        JSON.stringify(
          {
            schemaVersion: '1.0.0',
            status: 'success',
            data: {
              dryRun: true,
              workspaceName: wsName,
              ...result.statistics,
              dagIsAcyclic: result.dagIsAcyclic,
              blueprintPreview: {
                workspace: result.blueprint.workspace,
                sources: result.blueprint.sources.map((s: any) => ({ code: s.code, title: s.title, chunks: s.chunks.length })),
                competencies: result.blueprint.competencies.map((c: any) => ({ code: c.code, title: c.title, tier: c.cognitiveTier })),
                gates: result.blueprint.gates.map((g: any) => ({ name: g.name, level: g.level })),
                tasks: result.blueprint.tasks.map((t: any) => ({ title: t.title, type: t.taskType })),
              },
            },
          },
          null,
          2
        )
      );
      process.exit(0);
    }

    // Production Ingestion via FlashLearn REST API
    const response = await fetch(`${apiUrl}/api/v1/workspaces/import-blueprint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result.blueprint),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error(
        JSON.stringify(
          {
            schemaVersion: '1.0.0',
            status: 'error',
            code: 'API_IMPORT_FAILED',
            message: `Backend API import failed with status ${response.status}: ${errBody}`,
          },
          null,
          2
        )
      );
      process.exit(1);
    }

    const resJson = await response.json();
    console.log(
      JSON.stringify(
        {
          schemaVersion: '1.0.0',
          status: 'success',
          data: {
            workspaceId: resJson.workspaceId || resJson.id,
            statistics: result.statistics,
            dagIsAcyclic: result.dagIsAcyclic,
          },
        },
        null,
        2
      )
    );
    process.exit(0);
  } catch (err: any) {
    console.error(
      JSON.stringify(
        {
          schemaVersion: '1.0.0',
          status: 'error',
          code: err.message?.startsWith('INSUFFICIENT_DOMAIN_SPECIFICATION')
            ? 'INSUFFICIENT_DOMAIN_SPECIFICATION'
            : 'SYNTHESIS_FAILED',
          message: err.message,
        },
        null,
        2
      )
    );
    process.exit(1);
  }
}

main();
