import type { ResourceSchemaDef } from './types';

export const COMPETENCY_SCHEMAS: Record<string, ResourceSchemaDef> = {
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
        example: 'flashlearn workspace create --name "Pengadaan Publik" --slug "pbj-2026"',
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
        example: 'flashlearn source ingest --workspace-id <ws_id> --code PERPRES-12 --title "Pengadaan" --file ./perpres.md',
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
  competency: {
    noun: 'competency',
    description: 'Manage Directed Acyclic Graph (DAG) competency nodes and learner progression',
    actions: [
      {
        action: 'graph',
        description: 'Get workspace competency DAG with learner progression status',
        args: [
          { name: '--workspace-id', type: 'string', required: true, description: 'Workspace UUID' },
        ],
        example: 'flashlearn competency graph --workspace-id <ws_id>',
        mutating: false,
      },
      {
        action: 'get',
        description: 'Get competency node by ID',
        args: [{ name: '<id>', type: 'string', required: true, description: 'Competency UUID' }],
        example: 'flashlearn competency get comp_123',
        mutating: false,
      },
      {
        action: 'create',
        description: 'Create new competency node in DAG',
        args: [
          { name: '--workspace-id', type: 'string', required: true, description: 'Workspace UUID' },
          { name: '--code', type: 'string', required: true, description: 'Unique code e.g. HPS-001' },
          { name: '--title', type: 'string', required: true, description: 'Competency title' },
          { name: '--description', type: 'string', required: true, description: 'Competency scope' },
          { name: '--oracle-class', type: 'string', required: true, description: 'Oracle Class: A, B, or C' },
          { name: '--risk-level', type: 'string', required: true, description: 'Risk tier: low, medium, or high' },
          { name: '--source-id', type: 'string', required: false, description: 'Referenced Source UUID' },
        ],
        example: 'flashlearn competency create --workspace-id <ws_id> --code HPS-001 --title "Kalkulasi" --oracle-class A --risk-level low',
        mutating: true,
      },
      {
        action: 'link-prerequisite',
        description: 'Link prerequisite edge in DAG with cycle detection',
        args: [
          { name: '--competency-id', type: 'string', required: true, description: 'Target competency UUID' },
          { name: '--prerequisite-id', type: 'string', required: true, description: 'Prerequisite competency UUID' },
        ],
        example: 'flashlearn competency link-prerequisite --competency-id comp_2 --prerequisite-id comp_1',
        mutating: true,
      },
      {
        action: 'approve',
        description: 'Expert reviewer sign-off to activate competency node',
        args: [{ name: '<id>', type: 'string', required: true, description: 'Competency UUID' }],
        example: 'flashlearn competency approve comp_123',
        mutating: true,
      },
      {
        action: 'mastery',
        description: 'Record or update learner mastery status',
        args: [
          { name: '<id>', type: 'string', required: true, description: 'Competency UUID' },
          { name: '--status', type: 'string', required: true, description: 'ready | in_progress | mastered | stale' },
        ],
        example: 'flashlearn competency mastery comp_123 --status mastered',
        mutating: true,
      },
    ],
  },
  task: {
    noun: 'task',
    description: 'Manage Oracle task bank (Class A, B, C) and Socratic AI guidance',
    actions: [
      {
        action: 'list',
        description: 'List tasks under competency',
        args: [
          { name: '--competency-id', type: 'string', required: true, description: 'Competency UUID' },
        ],
        example: 'flashlearn task list --competency-id comp_123',
        mutating: false,
      },
      {
        action: 'get',
        description: 'Get task by ID',
        args: [{ name: '<id>', type: 'string', required: true, description: 'Task UUID' }],
        example: 'flashlearn task get task_123',
        mutating: false,
      },
      {
        action: 'create',
        description: 'Create task with multi-tier Oracle rubric or adversarial dilemma stress test',
        args: [
          { name: '--competency-id', type: 'string', required: true, description: 'Competency UUID' },
          { name: '--title', type: 'string', required: true, description: 'Task title' },
          { name: '--scenario', type: 'string', required: true, description: 'Problem scenario' },
          { name: '--type', type: 'string', required: true, description: 'calculation | case_study | checklist | adversarial_dilemma' },
          { name: '--oracle-file', type: 'string', required: false, description: 'JSON file with Oracle definitions' },
          { name: '--rubric-file', type: 'string', required: false, description: 'JSON file with rubric criteria' },
          { name: '--adversarial-spec', type: 'string', required: false, description: 'Inline JSON string for adversarial stress test' },
          { name: '--adversarial-file', type: 'string', required: false, description: 'JSON file with adversarial stress test specification' },
          { name: '--passing-score', type: 'number', required: false, description: 'Passing threshold (1-100)' },
        ],
        example: 'flashlearn task create --competency-id comp_1 --title "Audit HPS" --type adversarial_dilemma --adversarial-spec \'{"trapType":"OMISSION_DATA","correctDisposition":"REJECT_AND_DEMAND_DATA","trapCues":[{"cue":"Sertifikat belum terlampir","weight":1}]}\'',
        mutating: true,
      },
      {
        action: 'socratic-hint',
        description: 'Ask Grounded Socratic AI Tutor without spoiling gold solutions',
        args: [
          { name: '<id>', type: 'string', required: true, description: 'Task UUID' },
          { name: '--question', type: 'string', required: true, description: 'Learner inquiry or confusion' },
        ],
        example: 'flashlearn task socratic-hint task_123 --question "Bagaimana batas overhead dihitung?"',
        mutating: false,
      },
    ],
  },
  attempt: {
    noun: 'attempt',
    description: 'Submit candidate attempts to Oracle and manage human expert reviews',
    actions: [
      {
        action: 'submit',
        description: 'Submit solution for Oracle evaluation (Class A/B/C)',
        args: [
          { name: '<task-id>', type: 'string', required: true, description: 'Task UUID' },
          { name: '--submission-file', type: 'string', required: true, description: 'JSON file containing candidate answer' },
        ],
        example: 'flashlearn attempt submit task_123 --submission-file ./answer.json',
        mutating: true,
      },
      {
        action: 'list',
        description: 'List attempts for a task',
        args: [{ name: '<task-id>', type: 'string', required: true, description: 'Task UUID' }],
        example: 'flashlearn attempt list task_123',
        mutating: false,
      },
      {
        action: 'pending-reviews',
        description: 'List Class C attempts awaiting expert reviewer evaluation',
        args: [],
        example: 'flashlearn attempt pending-reviews',
        mutating: false,
      },
      {
        action: 'review',
        description: 'Expert reviewer sign-off on Class C attempt',
        args: [
          { name: '--attempt-id', type: 'string', required: true, description: 'Attempt UUID' },
          { name: '--passed', type: 'boolean', required: true, description: 'Pass or fail verdict' },
          { name: '--notes', type: 'string', required: true, description: 'Expert review rationale' },
          { name: '--rubric-file', type: 'string', required: true, description: 'JSON file with scores' },
        ],
        example: 'flashlearn attempt review --attempt-id att_123 --passed true --notes "Layak" --rubric-file scores.json',
        mutating: true,
      },
    ],
  },
};
