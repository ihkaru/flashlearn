import type { ResourceSchemaDef } from './types';

export const PLAN_SCHEMAS: Record<string, ResourceSchemaDef> = {
  corpus: {
    noun: 'corpus',
    description: 'Cross-platform pure-TS multi-format corpus slicer (PDF, EPUB, PPTX, Markdown) for 600+ page books',
    actions: [
      {
        action: 'index',
        description: 'Extract and slice one or more PDF/EPUB/PPTX/MD sources losslessly into corpus-index.json + slices/*.md',
        args: [
          { name: '--input', type: 'string', required: true, description: 'Comma-separated files or directory path' },
          { name: '--out', type: 'string', required: true, description: 'Output work directory' },
          { name: '--pages-per-slice', type: 'number', required: false, description: 'PDF pages per slice (default 15)' },
          { name: '--max-tokens', type: 'number', required: false, description: 'Max tokens per slice (default 3200)' },
        ],
        example: 'flashlearn corpus index --input ./books/ --out ./work/ebook-plan',
        mutating: true,
      },
    ],
  },
  plan: {
    noun: 'plan',
    description: 'Resumable multi-session curriculum build planner & cross-PC remote sync (push/diff/prune/pull)',
    actions: [
      {
        action: 'init',
        description: 'Build lossless lecture-paced curriculum-plan.json (<= 2h/unit) from raw books or corpus-index.json',
        args: [
          { name: '--dir', type: 'string', required: true, description: 'Work directory' },
          { name: '--title', type: 'string', required: true, description: 'Workspace title' },
          { name: '--input', type: 'string', required: false, description: 'Optional source files/dir to index automatically' },
          { name: '--max-unit-minutes', type: 'number', required: false, description: 'Max lecture unit minutes <= 120 (default 90)' },
          { name: '--decks', type: 'string', required: false, description: 'Slide deck policy: selective | all | none' },
        ],
        example: 'flashlearn plan init --input ./books/ --dir ./work/crypto-course --title "Kriptografi Terapan"',
        mutating: true,
      },
      {
        action: 'status',
        description: 'Show lossless slice coverage and per-unit build progress across sessions',
        args: [{ name: '--dir', type: 'string', required: true, description: 'Work directory' }],
        example: 'flashlearn plan status --dir ./work/crypto-course',
        mutating: false,
      },
      {
        action: 'next',
        description: 'Emit focused <15k-token Agent Handoff Packet for the next N pending modules',
        args: [
          { name: '--dir', type: 'string', required: true, description: 'Work directory' },
          { name: '--count', type: 'number', required: false, description: 'Number of modules (default 2)' },
          { name: '--unit', type: 'string', required: false, description: 'Filter specific unit code (e.g. U02)' },
        ],
        example: 'flashlearn plan next --dir ./work/crypto-course --count 2',
        mutating: false,
      },
      {
        action: 'mark',
        description: 'Checkpoint module build state and refresh HANDOFF.md',
        args: [
          { name: '--dir', type: 'string', required: true, description: 'Work directory' },
          { name: '--module', type: 'string', required: true, description: 'Module slug' },
          { name: '--state', type: 'string', required: true, description: 'planned|sliced|designed|uila_ready|deck_ready|audited|published' },
        ],
        example: 'flashlearn plan mark --dir ./work/crypto-course --module u01-01-intro --state audited',
        mutating: true,
      },
      {
        action: 'diff',
        description: 'Compare local curriculum plan against live server configured via CLI baseUrl & apiKey',
        args: [{ name: '--dir', type: 'string', required: true, description: 'Work directory' }],
        example: 'flashlearn plan diff --dir ./work/crypto-course',
        mutating: false,
      },
      {
        action: 'push',
        description: 'Idempotently create/update workspace, lecture units, interactive modules, and artifacts on remote server',
        args: [
          { name: '--dir', type: 'string', required: true, description: 'Work directory' },
          { name: '--module', type: 'string', required: false, description: 'Push only one module slug' },
          { name: '--unit', type: 'string', required: false, description: 'Push only one lecture unit (e.g. U01)' },
          { name: '--upload-media', type: 'boolean', required: false, description: 'Upload local slide & figure images to FlashLearn native asset API (or opt-in --mediavault-url)' },
        ],
        example: 'flashlearn plan push --dir ./work/crypto-course --unit U01 --upload-media',
        mutating: true,
      },
      {
        action: 'prune',
        description: 'Delete remote modules no longer present in local curriculum-plan.json (requires --yes)',
        args: [{ name: '--dir', type: 'string', required: true, description: 'Work directory' }],
        example: 'flashlearn plan prune --dir ./work/crypto-course --dry-run',
        mutating: true,
      },
      {
        action: 'pull',
        description: 'Pull live workspace and modules from remote server into a local workDir on another PC',
        args: [
          { name: '--workspace-id', type: 'string', required: true, description: 'Remote workspace UUID or slug' },
          { name: '--dir', type: 'string', required: true, description: 'Destination work directory' },
        ],
        example: 'flashlearn plan pull --workspace-id akselerasi-pemahaman-bridging --dir ./work/bridging',
        mutating: true,
      },
    ],
  },
  asset: {
    noun: 'asset',
    description: 'Manage persistent content-addressed visual assets (diagrams, figures, WebP images) scoped per workspace',
    actions: [
      {
        action: 'upload',
        description: 'Upload a local image/figure to FlashLearn native asset API (sha256 deduplicated, zero external vault required)',
        args: [
          { name: '--workspace-id', type: 'string', required: true, description: 'Target workspace UUID' },
          { name: '--file', type: 'string', required: true, description: 'Local image file path (webp/png/jpg/svg)' },
          { name: '--caption', type: 'string', required: false, description: 'Localized figure caption' },
          { name: '--alt', type: 'string', required: false, description: 'Accessible alt text' },
          { name: '--source-ref', type: 'string', required: false, description: 'Source book or PDF label' },
          { name: '--source-page', type: 'number', required: false, description: 'Source page number' },
        ],
        example: 'flashlearn asset upload --workspace-id <id> --file ./assets/fig-04.webp --caption "Tabel 6 Tangga TAPs" --source-page 71',
        mutating: true,
      },
      {
        action: 'list',
        description: 'List persistent media assets uploaded to a workspace',
        args: [{ name: '--workspace-id', type: 'string', required: true, description: 'Workspace UUID' }],
        example: 'flashlearn asset list --workspace-id <id>',
        mutating: false,
      },
      {
        action: 'delete',
        description: 'Delete a workspace media asset (reference-counted blob garbage collection; requires --yes)',
        args: [{ name: 'assetId', type: 'string', required: true, description: 'Asset UUID' }],
        example: 'flashlearn asset delete <asset-id> --yes',
        mutating: true,
      },
    ],
  },
};
