import type { ResourceSchemaDef } from './types';

export const DOMAIN_SCHEMAS: Record<string, ResourceSchemaDef> = {
  workspace: {
    noun: 'workspace',
    description: 'Manage educational workspaces and domain authority boundaries',
    actions: [
      {
        action: 'list',
        description: 'List accessible workspaces',
        args: [
          { name: '--public', type: 'boolean', required: false, description: 'Filter public workspaces only' },
        ],
        example: 'flashlearn workspace list --public',
        mutating: false,
      },
      {
        action: 'get',
        description: 'Get workspace details by ID or slug',
        args: [
          { name: '<id-or-slug>', type: 'string', required: true, description: 'Workspace UUID or slug' },
        ],
        example: 'flashlearn workspace get avionics-737',
        mutating: false,
      },
      {
        action: 'create',
        description: 'Create a new learning workspace',
        args: [
          { name: '--name', type: 'string', required: true, description: 'Workspace display name' },
          { name: '--slug', type: 'string', required: false, description: 'Unique URL slug' },
          { name: '--description', type: 'string', required: false, description: 'Purpose description' },
          { name: '--public', type: 'boolean', required: false, description: 'Make publicly accessible' },
        ],
        example: 'flashlearn workspace create --name "Pemeliharaan Avionik FAA" --slug "faa-145"',
        mutating: true,
      },
      {
        action: 'import-blueprint',
        description: 'Import universal declarative domain blueprint JSON',
        args: [
          { name: '--file', type: 'string', required: true, description: 'Path to domain blueprint JSON file' },
        ],
        example: 'flashlearn workspace import-blueprint --file ./blueprints/ata-104.json',
        mutating: true,
      },
      {
        action: 'delete',
        description: 'Delete a workspace',
        args: [
          { name: '<id>', type: 'string', required: true, description: 'Workspace UUID' },
          { name: '--yes', type: 'boolean', required: true, description: 'Confirm deletion' },
        ],
        example: 'flashlearn workspace delete ws_123 --yes',
        mutating: true,
      },
      {
        action: 'describe',
        description: 'Describe and diagnose domain readiness, statistics, DAG integrity, gaps, and actionable recommendations',
        args: [
          { name: '<id-or-slug>', type: 'string', required: true, description: 'Workspace UUID or slug' },
        ],
        example: 'flashlearn workspace describe pbj-2026',
        mutating: false,
      },
      {
        action: 'synthesize',
        description: 'Autonomously synthesize complete domain blueprint from Markdown regulations/SOPs with Tarjan SCC DAG validation',
        args: [
          { name: '--workspace-name', type: 'string', required: true, description: 'Target workspace name' },
          { name: '--source-files', type: 'string', required: true, description: 'Comma-separated Markdown file paths' },
          { name: '--output', type: 'string', required: false, description: 'Optional path to save generated blueprint JSON' },
          { name: '--dry-run', type: 'boolean', required: false, description: 'Simulate synthesis without writing to server' },
        ],
        example: 'flashlearn workspace synthesize --workspace-name "Risiko Vendor" --source-files "./docs/sop.md"',
        mutating: true,
      },
    ],
  },
  source: {
    noun: 'source',
    description: 'Manage Corpus of Record (laws, SOPs, standards) with addressable chunks',
    actions: [
      {
        action: 'list',
        description: 'List registered legal/SOP sources in workspace',
        args: [
          { name: '--workspace-id', type: 'string', required: true, description: 'Workspace UUID' },
        ],
        example: 'flashlearn source list --workspace-id <ws_id>',
        mutating: false,
      },
      {
        action: 'get',
        description: 'Get source details by ID',
        args: [{ name: '<id>', type: 'string', required: true, description: 'Source UUID' }],
        example: 'flashlearn source get src_123',
        mutating: false,
      },
      {
        action: 'chunks',
        description: 'List addressable chunks (Pasal/Ayat) of a source',
        args: [{ name: '<id>', type: 'string', required: true, description: 'Source UUID' }],
        example: 'flashlearn source chunks src_123',
        mutating: false,
      },
      {
        action: 'ingest',
        description: 'Ingest and chunk official source document',
        args: [
          { name: '--workspace-id', type: 'string', required: true, description: 'Workspace UUID' },
          { name: '--title', type: 'string', required: true, description: 'Official document title' },
          { name: '--code', type: 'string', required: true, description: 'Unique code e.g. PERPRES-12-2021' },
          { name: '--file', type: 'string', required: true, description: 'Path to raw text/markdown file' },
          { name: '--version', type: 'string', required: false, description: 'Version string (default 1.0.0)' },
          { name: '--owner', type: 'string', required: false, description: 'Regulatory owner / institution' },
        ],
        example: 'flashlearn source ingest --workspace-id <ws_id> --code ATA-104 --title "SOP Avionik" --file ./sop_avionik.md',
        mutating: true,
      },
      {
        action: 'supersede',
        description: 'Mark source superseded and cascade staleness to competencies and gates',
        args: [
          { name: '<id>', type: 'string', required: true, description: 'Source UUID to supersede' },
          { name: '--reason', type: 'string', required: false, description: 'Audit rationale for supersession' },
        ],
        example: 'flashlearn source supersede src_123 --reason "Diperbarui Perpres 2026"',
        mutating: true,
      },
      {
        action: 'validate-citations',
        description: 'Verify claims deterministically against stored chunks',
        args: [
          { name: '--file', type: 'string', required: true, description: 'Path to claims JSON file' },
        ],
        example: 'flashlearn source validate-citations --file ./claims.json',
        mutating: false,
      },
    ],
  },
};
