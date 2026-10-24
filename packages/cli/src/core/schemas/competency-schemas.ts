import type { ResourceSchemaDef } from './types';

export const COMPETENCY_SCHEMAS: Record<string, ResourceSchemaDef> = {
  competency: {
    noun: 'competency',
    description: 'Manage Directed Acyclic Graph (DAG) competency nodes and learner progression',
    actions: [
      {
        action: 'graph',
        description: 'View full competency DAG with topological sort and prerequisite edges',
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
        description: 'Expert reviewer sign-off on competency node',
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
      {
        action: 'drift-audit',
        description: 'Audit competency half-life decay and DSR retrievability radar across workspace',
        args: [
          { name: '<workspace-id>', type: 'string', required: true, description: 'Workspace UUID' },
          { name: '--threshold', type: 'number', required: false, description: 'Retrievability cutoff filter (e.g. 0.85)' },
        ],
        example: 'flashlearn competency drift-audit ws_123 --threshold 0.85',
        mutating: false,
      },
      {
        action: 'revalidate',
        description: 'Record micro-revalidation challenge result and stretch DSR stability',
        args: [
          { name: '<competency-id>', type: 'string', required: true, description: 'Competency UUID' },
          { name: '--user', type: 'string', required: true, description: 'Learner user UUID' },
          { name: '--passed', type: 'boolean', required: true, description: 'True if defended successfully' },
          { name: '--score', type: 'number', required: false, description: 'Score earned' },
        ],
        example: 'flashlearn competency revalidate comp_123 --user usr_456 --passed true --score 90',
        mutating: true,
      },
      {
        action: 'decay-cycle',
        description: 'Execute automated predictive competency decay batch cycle',
        args: [],
        example: 'flashlearn competency decay-cycle',
        mutating: true,
      },
    ],
  },
  gate: {
    noun: 'gate',
    description: 'Manage Progressive Authorization Gates (Levels 0-3) and digital credentials',
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
        description: 'Create gate level barrier with competency requirements',
        args: [
          { name: '--workspace-id', type: 'string', required: true, description: 'Workspace UUID' },
          { name: '--level', type: 'number', required: true, description: 'Gate Level: 0, 1, 2, or 3' },
          { name: '--title', type: 'string', required: true, description: 'Gate designation title' },
          { name: '--description', type: 'string', required: true, description: 'Authorization scope' },
          { name: '--requirements', type: 'string', required: true, description: 'JSON file with competency IDs & scores' },
        ],
        example: 'flashlearn gate create --workspace-id <ws_id> --level 1 --title "PPK Mandiri" --requirements reqs.json',
        mutating: true,
      },
      {
        action: 'evaluate',
        description: 'Evaluate learner eligibility and auto-issue gate passport if qualified',
        args: [
          { name: '<gate-id>', type: 'string', required: true, description: 'Gate UUID' },
        ],
        example: 'flashlearn gate evaluate gate_123',
        mutating: true,
      },
      {
        action: 'passports',
        description: 'List digital authority passports earned by learner',
        args: [],
        example: 'flashlearn gate passports',
        mutating: false,
      },
    ],
  },
  diagnostic: {
    noun: 'diagnostic',
    description: 'Adaptive topological diagnostic placement engine (Knowledge Space Theory on DAG)',
    actions: [
      {
        action: 'start',
        description: 'Start an adaptive diagnostic placement session for a domain/workspace',
        args: [
          { name: '<workspace-id>', type: 'string', required: true, description: 'Workspace UUID' },
        ],
        example: 'flashlearn diagnostic start <workspace-id>',
        mutating: true,
      },
      {
        action: 'next',
        description: 'Get the next optimal minimal-entropy diagnostic probe recommendation',
        args: [
          { name: '<session-id>', type: 'string', required: true, description: 'Diagnostic session UUID' },
        ],
        example: 'flashlearn diagnostic next <session-id>',
        mutating: false,
      },
      {
        action: 'submit',
        description: 'Submit solution for current diagnostic probe and propagate Bayesian ancestral mastery',
        args: [
          { name: '<session-id>', type: 'string', required: true, description: 'Diagnostic session UUID' },
          { name: '--submission', type: 'string', required: false, description: 'JSON string submission data' },
          { name: '--submission-file', type: 'string', required: false, description: 'Path to JSON file containing submission' },
          { name: '--text', type: 'string', required: false, description: 'Raw textual answer' },
        ],
        example: 'flashlearn diagnostic submit <session-id> --submission \'{"nilai_dasar": 100}\'',
        mutating: true,
      },
    ],
  },
};
