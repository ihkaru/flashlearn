#!/usr/bin/env bun
/**
 * Deterministic SRP & File Length Guardrail for FlashLearn Monorepo
 * 
 * Enforces Single Responsibility Principle (SRP) by auditing lines of code
 * across all TypeScript and Svelte files.
 */

import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

const MAX_FILE_LINES = 400;
const WARN_COMPONENT_LINES = 200;

const ROOT_DIR = process.cwd();
const EXCLUDE_DIRS = new Set([
  'node_modules',
  'dist',
  '.git',
  '.svelte-kit',
  'drizzle',
  'brain',
]);

const SCANNED_EXTENSIONS = new Set(['.ts', '.svelte', '.js']);

interface FileAudit {
  relPath: string;
  lines: number;
  isComponent: boolean;
  status: 'OK' | 'WARN' | 'ERROR';
  message?: string;
}

function scanDirectory(dir: string, results: FileAudit[] = []): FileAudit[] {
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.env') continue;
    if (EXCLUDE_DIRS.has(entry.name)) continue;

    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      scanDirectory(fullPath, results);
    } else if (entry.isFile()) {
      const ext = extname(entry.name);
      if (!SCANNED_EXTENSIONS.has(ext)) continue;

      try {
        const content = readFileSync(fullPath, 'utf-8');
        const lineCount = content.split('\n').length;
        const relPath = relative(ROOT_DIR, fullPath);
        const isComponent = ext === '.svelte';

        let status: 'OK' | 'WARN' | 'ERROR' = 'OK';
        let message = '';

        if (lineCount > MAX_FILE_LINES) {
          status = 'ERROR';
          message = `Exceeds max file budget (${lineCount}/${MAX_FILE_LINES} lines)`;
        } else if (isComponent && lineCount > WARN_COMPONENT_LINES) {
          status = 'WARN';
          message = `Component exceeds SRP guidance (${lineCount}/${WARN_COMPONENT_LINES} lines)`;
        }

        results.push({
          relPath,
          lines: lineCount,
          isComponent,
          status,
          message,
        });
      } catch {
        // Ignore unreadable files
      }
    }
  }

  return results;
}

console.log('='.repeat(70));
console.log('🔍 FLASHLERN MONOREPO SRP & FILE LENGTH AUDIT');
console.log('='.repeat(70));

const audits = scanDirectory(ROOT_DIR);
audits.sort((a, b) => b.lines - a.lines);

const errors = audits.filter((a) => a.status === 'ERROR');
const warnings = audits.filter((a) => a.status === 'WARN');

console.log(`Audited : ${audits.length} files`);
console.log(`Budget  : Max ${MAX_FILE_LINES} lines/file, Target < ${WARN_COMPONENT_LINES} lines/component`);
console.log(`Status  : ${errors.length} Errors, ${warnings.length} Warnings\n`);

if (errors.length > 0 || warnings.length > 0) {
  console.log('⚠️  Flagged Files (SRP / Length Budget):');
  console.log('-'.repeat(70));
  for (const a of [...errors, ...warnings]) {
    const icon = a.status === 'ERROR' ? '❌' : '⚠️ ';
    console.log(`${icon} [${a.status.padEnd(5)}] ${a.lines.toString().padStart(4)} lines  ${a.relPath}`);
    if (a.message) {
      console.log(`          ↳ ${a.message}`);
    }
  }
  console.log('-'.repeat(70));
}

if (errors.length > 0) {
  console.error(`\n❌ FAILED: ${errors.length} file(s) exceed the hard SRP limit of ${MAX_FILE_LINES} lines.`);
  console.error('Action: Deconstruct bloated files into cohesive subcomponents or separate services.\n');
  process.exit(1);
} else {
  console.log('\n✅ ALL CHECKS PASSED: No file exceeds the hard SRP limit.');
  process.exit(0);
}
