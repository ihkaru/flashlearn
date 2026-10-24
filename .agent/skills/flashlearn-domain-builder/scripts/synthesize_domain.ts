#!/usr/bin/env bun
/**
 * FlashLearn Agent-Agnostic Domain Blueprint Ingestion Script
 * Validates declarative DomainBlueprint JSON against FlashLearn mathematical invariants
 * and imports it into the FlashLearn platform.
 */

import { readFileSync } from 'node:fs';
import { validateDomainBlueprint } from '../../../../packages/cli/src/core/blueprint-validator';

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

  const blueprintPath = (flags['blueprint'] as string) || (flags['file'] as string) || (args[0] && !args[0].startsWith('--') ? args[0] : null);
  const isDryRun = !!flags['dry-run'];
  const apiUrl = (flags['api-url'] as string) || 'http://localhost:3000';

  if (!blueprintPath) {
    console.error(
      JSON.stringify(
        {
          schemaVersion: '1.0.0',
          status: 'error',
          code: 'MISSING_ARGUMENT',
          message: 'Usage: bun synthesize_domain.ts --blueprint <blueprint.json> [--dry-run] [--api-url <url>]',
        },
        null,
        2
      )
    );
    process.exit(64);
  }

  let blueprint: any;
  try {
    const content = readFileSync(blueprintPath, 'utf-8');
    blueprint = JSON.parse(content);
  } catch (err: any) {
    console.error(
      JSON.stringify(
        {
          schemaVersion: '1.0.0',
          status: 'error',
          code: 'FILE_READ_ERROR',
          message: `Failed to read or parse blueprint JSON from "${blueprintPath}": ${err.message}`,
        },
        null,
        2
      )
    );
    process.exit(1);
  }

  try {
    // 1. Mathematically validate DAG, schema invariants, and coverage
    const validation = validateDomainBlueprint(blueprint);

    if (isDryRun) {
      console.log(
        JSON.stringify(
          {
            schemaVersion: '1.0.0',
            status: 'success',
            data: {
              dryRun: true,
              workspaceName: blueprint.workspace.name,
              slug: blueprint.workspace.slug,
              dagIsAcyclic: validation.isValid,
              statistics: validation.statistics,
            },
          },
          null,
          2
        )
      );
      process.exit(0);
    }

    // 2. Production Ingestion via FlashLearn REST API
    const response = await fetch(`${apiUrl}/api/v1/workspaces/import-blueprint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(blueprint),
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
            statistics: validation.statistics,
            dagIsAcyclic: validation.isValid,
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
            : err.message?.startsWith('INVALID_DOMAIN_BLUEPRINT')
              ? 'INVALID_DOMAIN_BLUEPRINT'
              : 'VALIDATION_FAILED',
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
