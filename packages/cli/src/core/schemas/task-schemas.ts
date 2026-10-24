import type { ResourceSchemaDef } from './types';

export const TASK_SCHEMAS: Record<string, ResourceSchemaDef> = {
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
      {
        action: 'assign-reviewers',
        description: 'Assign two double-blind expert raters to a Class C attempt',
        args: [
          { name: '<attempt-id>', type: 'string', required: true, description: 'Attempt UUID' },
          { name: '--primary', type: 'string', required: true, description: 'Primary reviewer UUID' },
          { name: '--secondary', type: 'string', required: true, description: 'Secondary reviewer UUID' },
        ],
        example: 'flashlearn attempt assign-reviewers att_123 --primary usr_456 --secondary usr_789',
        mutating: true,
      },
      {
        action: 'blind-review',
        description: 'Fetch sanitized double-blind assessment dossier by blind token',
        args: [
          { name: '<blind-token>', type: 'string', required: true, description: 'Anonymized blind token' },
        ],
        example: 'flashlearn attempt blind-review bln_abc123',
        mutating: false,
      },
      {
        action: 'score',
        description: 'Submit blind rubric score and trigger Gwet AC1/AC2 consensus evaluation',
        args: [
          { name: '--blind-token', type: 'string', required: true, description: 'Anonymized blind token' },
          { name: '--rubric-scores', type: 'string', required: false, description: 'JSON rubric scores map' },
          { name: '--rubric-file', type: 'string', required: false, description: 'Path to JSON file with scores' },
          { name: '--total-score', type: 'number', required: false, description: 'Override total score' },
          { name: '--notes', type: 'string', required: false, description: 'Evaluator justification' },
        ],
        example: 'flashlearn attempt score --blind-token bln_abc123 --rubric-scores \'{"c1": 90, "c2": 85}\'',
        mutating: true,
      },
      {
        action: 'irr-report',
        description: 'View inter-rater reliability report, Gwet AC1/AC2, Cohen Kappa, and consensus status',
        args: [
          { name: '<attempt-id>', type: 'string', required: true, description: 'Attempt UUID' },
        ],
        example: 'flashlearn attempt irr-report att_123',
        mutating: false,
      },
      {
        action: 'arbitrate',
        description: 'Resolve disputed evaluation via Chief Arbiter scorecard',
        args: [
          { name: '<attempt-id>', type: 'string', required: true, description: 'Attempt UUID' },
          { name: '--total-score', type: 'number', required: true, description: 'Chief Arbiter total score' },
          { name: '--notes', type: 'string', required: false, description: 'Arbitration justification' },
        ],
        example: 'flashlearn attempt arbitrate att_123 --total-score 90 --notes "Final arbitration"',
        mutating: true,
      },
    ],
  },
};
