import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  jsonb,
  uuid,
  index,
  primaryKey,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import type { AdversarialDilemmaSpec } from '@flashlearn/shared';
import { users, workspaces } from './core';
import { domains } from './domains';
import { sources } from './sources';

export const competencies = pgTable(
  'competencies',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
    domainId: uuid('domain_id').references(() => domains.id, { onDelete: 'cascade' }),
    sourceId: uuid('source_id').references(() => sources.id, { onDelete: 'set null' }),
    code: text('code').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    oracleClass: text('oracle_class', { enum: ['A', 'B', 'C'] }).notNull(),
    riskLevel: text('risk_level', { enum: ['low', 'medium', 'high'] }).default('low').notNull(),
    isExpertApproved: boolean('is_expert_approved').default(false).notNull(),
    approvedBy: uuid('approved_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_competencies_ws_code').on(table.workspaceId, table.code),
    index('idx_competencies_workspace_id').on(table.workspaceId),
    index('idx_competencies_domain_id').on(table.domainId),
    index('idx_competencies_source_id').on(table.sourceId),
    index('idx_competencies_code').on(table.code),
    index('idx_competencies_oracle_class').on(table.oracleClass),
  ]
);

export const competencyEdges = pgTable(
  'competency_edges',
  {
    competencyId: uuid('competency_id').references(() => competencies.id, { onDelete: 'cascade' }).notNull(),
    prerequisiteId: uuid('prerequisite_id').references(() => competencies.id, { onDelete: 'cascade' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.competencyId, table.prerequisiteId] }),
    index('idx_competency_edges_comp').on(table.competencyId),
    index('idx_competency_edges_prereq').on(table.prerequisiteId),
  ]
);

export const masteryRecords = pgTable(
  'mastery_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    competencyId: uuid('competency_id').references(() => competencies.id, { onDelete: 'cascade' }).notNull(),
    status: text('status', { enum: ['locked', 'ready', 'in_progress', 'mastered', 'stale'] })
      .default('ready')
      .notNull(),
    verifiedAttemptId: uuid('verified_attempt_id'),
    masteredAt: timestamp('mastered_at', { withTimezone: true }),
    retestDueAt: timestamp('retest_due_at', { withTimezone: true }),
    difficulty: numeric('difficulty', { precision: 4, scale: 2 }).default('5.0').notNull(),
    stability: numeric('stability', { precision: 6, scale: 2 }).default('30.0').notNull(),
    lastDemonstratedAt: timestamp('last_demonstrated_at', { withTimezone: true }).defaultNow().notNull(),
    cachedRetrievability: numeric('cached_retrievability', { precision: 4, scale: 3 }).default('1.0').notNull(),
    driftStatus: text('drift_status', { enum: ['active', 'drift_warning', 'provisionally_expired'] })
      .default('active')
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_mastery_user_comp_unique').on(table.userId, table.competencyId),
    index('idx_mastery_records_user_id').on(table.userId),
    index('idx_mastery_records_comp_id').on(table.competencyId),
    index('idx_mastery_drift_status').on(table.driftStatus),
    index('idx_mastery_cached_r').on(table.cachedRetrievability),
  ]
);

export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    competencyId: uuid('competency_id').references(() => competencies.id, { onDelete: 'cascade' }).notNull(),
    title: text('title').notNull(),
    scenario: text('scenario').notNull(),
    taskType: text('task_type', {
      enum: ['calculation', 'case_study', 'document_draft', 'checklist', 'adversarial_dilemma'],
    }).notNull(),
    oracleData: jsonb('oracle_data').$type<Record<string, any>>().notNull(),
    adversarialSpec: jsonb('adversarial_spec').$type<AdversarialDilemmaSpec>(),
    rubricCriteria: jsonb('rubric_criteria').$type<any[]>().notNull(),
    passingScore: integer('passing_score').default(85).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_tasks_comp_title').on(table.competencyId, table.title),
    index('idx_tasks_competency_id').on(table.competencyId),
    index('idx_tasks_task_type').on(table.taskType),
  ]
);

export const attempts = pgTable(
  'attempts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    submission: jsonb('submission').notNull(),
    score: integer('score').notNull(),
    feedback: text('feedback').notNull(),
    assessedBy: text('assessed_by').notNull(),
    oracleClassUsed: text('oracle_class_used', { enum: ['A', 'B', 'C'] }).notNull(),
    passed: boolean('passed').notNull(),
    details: jsonb('details'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_attempts_task_id').on(table.taskId),
    index('idx_attempts_user_id').on(table.userId),
    index('idx_attempts_passed').on(table.passed),
  ]
);

export const gates = pgTable(
  'gates',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
    domainId: uuid('domain_id').references(() => domains.id, { onDelete: 'cascade' }),
    level: integer('level').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_gates_ws_level').on(table.workspaceId, table.level),
    index('idx_gates_workspace_id').on(table.workspaceId),
    index('idx_gates_domain_id').on(table.domainId),
    index('idx_gates_level').on(table.level),
  ]
);

export const gateRequirements = pgTable(
  'gate_requirements',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    gateId: uuid('gate_id').references(() => gates.id, { onDelete: 'cascade' }).notNull(),
    competencyId: uuid('competency_id').references(() => competencies.id, { onDelete: 'cascade' }).notNull(),
    minimumScore: integer('minimum_score').default(80).notNull(),
    requiresHumanApproval: boolean('requires_human_approval').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_gate_req_unique').on(table.gateId, table.competencyId),
    index('idx_gate_req_gate').on(table.gateId),
    index('idx_gate_req_comp').on(table.competencyId),
  ]
);

export const userGateGrants = pgTable(
  'user_gate_grants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    gateId: uuid('gate_id').references(() => gates.id, { onDelete: 'cascade' }).notNull(),
    status: text('status', { enum: ['active', 'provisional', 'revoked'] }).default('active').notNull(),
    grantedAt: timestamp('granted_at', { withTimezone: true }).defaultNow().notNull(),
    grantedBy: text('granted_by').notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    revocationReason: text('revocation_reason'),
    evidenceSnapshot: jsonb('evidence_snapshot').$type<Record<string, any>>().notNull(),
  },
  (table) => [
    index('idx_user_gate_grants_user').on(table.userId),
    index('idx_user_gate_grants_gate').on(table.gateId),
    index('idx_user_gate_grants_status').on(table.status),
  ]
);

export const diagnosticSessions = pgTable(
  'diagnostic_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
    domainId: uuid('domain_id').references(() => domains.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    status: text('status', { enum: ['in_progress', 'completed'] }).default('in_progress').notNull(),
    probedItems: jsonb('probed_items').$type<any[]>().notNull(),
    inferredMasteries: jsonb('inferred_masteries').$type<string[]>().notNull(),
    stateDistribution: jsonb('state_distribution').$type<Record<string, number>>(),
    currentFringe: jsonb('current_fringe').$type<string[]>(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_diagnostic_sessions_workspace').on(table.workspaceId),
    index('idx_diagnostic_sessions_domain').on(table.domainId),
    index('idx_diagnostic_sessions_user').on(table.userId),
  ]
);
