import type { ResourceSchemaDef } from './types';

export const SUPPORT_SCHEMAS: Record<string, ResourceSchemaDef> = {
  gate: {
    noun: 'gate',
    description: 'Manage Progressive Authorization Gates (Levels 0-3) and Digital Authority Passports',
    actions: [
      {
        action: 'list',
        description: 'List authorization gates in workspace',
        args: [
          { name: '--workspace-id', type: 'string', required: true, description: 'Workspace UUID' },
        ],
        example: 'flashlearn gate list --workspace-id <ws_id>',
        mutating: false,
      },
      {
        action: 'create',
        description: 'Create authorization gate level',
        args: [
          { name: '--workspace-id', type: 'string', required: true, description: 'Workspace UUID' },
          { name: '--level', type: 'number', required: true, description: 'Gate level: 0, 1, 2, or 3' },
          { name: '--title', type: 'string', required: true, description: 'Gate title' },
          { name: '--description', type: 'string', required: true, description: 'Authority scope' },
          { name: '--requirements-file', type: 'string', required: false, description: 'JSON requirements file' },
        ],
        example: 'flashlearn gate create --workspace-id <ws_id> --level 3 --title "Tanda Tangan Mandiri" --description "Otorisasi Penuh"',
        mutating: true,
      },
      {
        action: 'passports',
        description: 'List active digital authority passports for current learner',
        args: [],
        example: 'flashlearn gate passports',
        mutating: false,
      },
      {
        action: 'verify',
        description: 'Publicly verify authenticity of a digital passport without login',
        args: [
          { name: '<grant-id>', type: 'string', required: true, description: 'Passport / Grant UUID' },
        ],
        example: 'flashlearn gate verify grant_123',
        mutating: false,
      },
      {
        action: 'grant',
        description: 'Evaluate learner eligibility and issue gate passport',
        args: [
          { name: '<gate-id>', type: 'string', required: true, description: 'Gate UUID' },
        ],
        example: 'flashlearn gate grant gate_123',
        mutating: true,
      },
    ],
  },
  content: {
    noun: 'content',
    description: 'Manage educational learning modules (materi, quiz, combined)',
    actions: [
      {
        action: 'list',
        description: 'List content modules in workspace',
        args: [
          { name: '--workspace-id', type: 'string', required: true, description: 'Workspace UUID' },
        ],
        example: 'flashlearn content list --workspace-id <ws_id>',
        mutating: false,
      },
      {
        action: 'get',
        description: 'Get content module by ID',
        args: [{ name: '<id>', type: 'string', required: true, description: 'Content UUID' }],
        example: 'flashlearn content get cnt_123',
        mutating: false,
      },
      {
        action: 'create',
        description: 'Create educational module',
        args: [
          { name: '--workspace-id', type: 'string', required: true, description: 'Workspace UUID' },
          { name: '--title', type: 'string', required: true, description: 'Content title' },
          { name: '--type', type: 'string', required: true, description: 'materi | quiz | combined' },
          { name: '--body-file', type: 'string', required: false, description: 'Path to markdown body' },
          { name: '--body', type: 'string', required: false, description: 'Inline markdown body string' },
          { name: '--questions-file', type: 'string', required: false, description: 'Path to questions JSON file' },
          { name: '--summary', type: 'string', required: false, description: 'Short summary' },
        ],
        example: 'flashlearn content create --workspace-id <ws_id> --title "Tata Kelola" --type materi --body-file ./materi.md',
        mutating: true,
      },
      {
        action: 'update',
        description: 'Update existing educational module',
        args: [
          { name: '<id>', type: 'string', required: true, description: 'Content UUID' },
          { name: '--title', type: 'string', required: false, description: 'Updated title' },
          { name: '--body-file', type: 'string', required: false, description: 'Updated markdown body file' },
          { name: '--body', type: 'string', required: false, description: 'Updated inline body string' },
          { name: '--questions-file', type: 'string', required: false, description: 'Updated questions JSON file' },
          { name: '--summary', type: 'string', required: false, description: 'Updated short summary' },
        ],
        example: 'flashlearn content update cnt_123 --title "Tata Kelola Revisi"',
        mutating: true,
      },
      {
        action: 'delete',
        description: 'Delete content module',
        args: [
          { name: '<id>', type: 'string', required: true, description: 'Content UUID' },
          { name: '--yes', type: 'boolean', required: true, description: 'Confirm deletion' },
        ],
        example: 'flashlearn content delete cnt_123 --yes',
        mutating: true,
      },
      {
        action: 'rollback',
        description: 'Rollback content to previous version snapshot',
        args: [
          { name: '<id>', type: 'string', required: true, description: 'Content UUID' },
          { name: '--version', type: 'number', required: true, description: 'Target version number' },
        ],
        example: 'flashlearn content rollback cnt_123 --version 1',
        mutating: true,
      },
    ],
  },
  quiz: {
    noun: 'quiz',
    description: 'Submit quiz answers and evaluate multiple-choice knowledge',
    actions: [
      {
        action: 'submit',
        description: 'Submit quiz answers as participant',
        args: [
          { name: '<content-id>', type: 'string', required: true, description: 'Content UUID with quiz' },
          { name: '--guest-name', type: 'string', required: true, description: 'Participant name' },
          { name: '--answers-file', type: 'string', required: true, description: 'Path to answers JSON file' },
        ],
        example: 'flashlearn quiz submit cnt_123 --guest-name "Ihza" --answers-file ./answers.json',
        mutating: true,
      },
    ],
  },
  flashcard: {
    noun: 'flashcard',
    description: 'Review and practice SuperMemo SM-2 spaced repetition cards',
    actions: [
      {
        action: 'due',
        description: 'List due flashcards for current learner',
        args: [],
        example: 'flashlearn flashcard due',
        mutating: false,
      },
      {
        action: 'practice',
        description: 'Submit flashcard review with recall quality rating (0-5)',
        args: [
          { name: '<card-id>', type: 'string', required: true, description: 'Flashcard UUID' },
          { name: '--quality', type: 'number', required: true, description: 'Recall quality: 0 (blackout) to 5 (perfect)' },
        ],
        example: 'flashlearn flashcard practice card_123 --quality 4',
        mutating: true,
      },
    ],
  },
  audit: {
    noun: 'audit',
    description: 'Inspect immutable regulatory audit logs and export tamper-evident bundles',
    actions: [
      {
        action: 'list',
        description: 'List audit trail entries',
        args: [
          { name: '--workspace-id', type: 'string', required: true, description: 'Workspace UUID' },
          { name: '--action', type: 'string', required: false, description: 'Filter by action name' },
        ],
        example: 'flashlearn audit list --workspace-id <ws_id>',
        mutating: false,
      },
      {
        action: 'bundle',
        description: 'Export tamper-evident compliance bundle with SHA-256 signature',
        args: [
          { name: '--workspace-id', type: 'string', required: true, description: 'Workspace UUID' },
        ],
        example: 'flashlearn audit bundle --workspace-id <ws_id>',
        mutating: false,
      },
    ],
  },
  apikey: {
    noun: 'apikey',
    description: 'Manage programmatic API keys (fl_live_...) with SHA-256 storage',
    actions: [
      {
        action: 'list',
        description: 'List active API keys',
        args: [],
        example: 'flashlearn apikey list',
        mutating: false,
      },
      {
        action: 'create',
        description: 'Generate a new scoped API key',
        args: [
          { name: '--name', type: 'string', required: true, description: 'Key name / description' },
          { name: '--expires-days', type: 'number', required: false, description: 'Expiry duration in days (0 for never)' },
        ],
        example: 'flashlearn apikey create --name "CI Runner"',
        mutating: true,
      },
      {
        action: 'revoke',
        description: 'Revoke an active API key',
        args: [
          { name: '<id>', type: 'string', required: true, description: 'API Key UUID' },
        ],
        example: 'flashlearn apikey revoke key_123',
        mutating: true,
      },
    ],
  },
  auth: {
    noun: 'auth',
    description: 'Inspect identity, configure tokens, and verify session status',
    actions: [
      {
        action: 'whoami',
        description: 'Display currently authenticated user profile and active role',
        args: [],
        example: 'flashlearn auth whoami',
        mutating: false,
      },
      {
        action: 'config',
        description: 'Save local CLI configuration (API URL, workspace, token)',
        args: [
          { name: '--api-url', type: 'string', required: false, description: 'Default API URL' },
          { name: '--token', type: 'string', required: false, description: 'Active JWT token' },
          { name: '--api-key', type: 'string', required: false, description: 'Active API key' },
          { name: '--workspace', type: 'string', required: false, description: 'Default workspace ID' },
        ],
        example: 'flashlearn auth config --api-url http://localhost:3000 --workspace ws_123',
        mutating: false,
      },
    ],
  },
  schema: {
    noun: 'schema',
    description: 'Runtime schema introspection for AI agents and automation harnesses',
    actions: [
      {
        action: 'introspect',
        description: 'Inspect full CLI command schemas, arguments, and types',
        args: [
          { name: '[noun]', type: 'string', required: false, description: 'Specific resource noun to inspect' },
        ],
        example: 'flashlearn schema workspace',
        mutating: false,
      },
    ],
  },
};
