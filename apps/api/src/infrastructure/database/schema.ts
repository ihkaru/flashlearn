import { pgTable, text, timestamp, boolean, integer, jsonb, uuid, index, primaryKey, uniqueIndex } from 'drizzle-orm/pg-core';
import type { QuizQuestion } from '@flashlearn/shared';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  avatar: text('avatar'),
  role: text('role', { enum: ['superadmin', 'creator', 'guest'] }).default('creator').notNull(),
  googleId: text('google_id').unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const workspaces = pgTable(
  'workspaces',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    coverImage: text('cover_image'),
    icon: text('icon'),
    isPublic: boolean('is_public').default(true).notNull(),
    creatorId: uuid('creator_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_workspaces_creator_id').on(table.creatorId),
    index('idx_workspaces_is_public').on(table.isPublic),
    index('idx_workspaces_deleted_at').on(table.deletedAt),
  ]
);

export const workspaceVersions = pgTable(
  'workspace_versions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
    versionNumber: integer('version_number').notNull(),
    action: text('action').notNull(), // 'create', 'update', 'rollback'
    snapshot: jsonb('snapshot').notNull(),
    changedBy: uuid('changed_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('idx_workspace_versions_workspace_id').on(table.workspaceId)]
);

export const contents = pgTable(
  'contents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
    competencyId: uuid('competency_id').references(() => competencies.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    type: text('type', { enum: ['materi', 'quiz', 'combined'] }).notNull(),
    summary: text('summary'),
    readingTimeMinutes: integer('reading_time_minutes').default(5),
    body: text('body'), // Markdown body for 'materi' & 'combined'
    questions: jsonb('questions').$type<QuizQuestion[]>(), // Array of QuizQuestion
    isPublished: boolean('is_published').default(true).notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_contents_workspace_id').on(table.workspaceId),
    index('idx_contents_competency_id').on(table.competencyId),
    index('idx_contents_is_published').on(table.isPublished),
    index('idx_contents_deleted_at').on(table.deletedAt),
  ]
);

export const contentVersions = pgTable(
  'content_versions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    contentId: uuid('content_id').references(() => contents.id, { onDelete: 'cascade' }).notNull(),
    versionNumber: integer('version_number').notNull(),
    action: text('action').notNull(), // 'create', 'update', 'rollback'
    snapshot: jsonb('snapshot').notNull(),
    changedBy: uuid('changed_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('idx_content_versions_content_id').on(table.contentId)]
);

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('userId').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  keyPrefix: text('key_prefix').notNull(),
  hashedKey: text('hashed_key').notNull().unique(),
  permissions: jsonb('permissions').$type<string[]>().default(['*']).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const quizSubmissions = pgTable(
  'quiz_submissions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    contentId: uuid('content_id').references(() => contents.id, { onDelete: 'cascade' }).notNull(),
    guestName: text('guest_name'),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    score: integer('score').notNull(),
    totalQuestions: integer('total_questions').notNull(),
    percentage: integer('percentage').notNull(),
    answers: jsonb('answers'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('idx_quiz_submissions_content_id').on(table.contentId)]
);

// ==========================================
// Phase 01: Sources & Addressable Chunks
// ==========================================

export const sources = pgTable(
  'sources',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
    title: text('title').notNull(),
    code: text('code').notNull(),
    version: text('version').notNull(),
    status: text('status', { enum: ['active', 'superseded', 'draft'] }).default('active').notNull(),
    owner: text('owner').notNull(),
    effectiveDate: timestamp('effective_date', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_sources_workspace_id').on(table.workspaceId),
    index('idx_sources_code').on(table.code),
    index('idx_sources_status').on(table.status),
  ]
);

export const sourceChunks = pgTable(
  'source_chunks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sourceId: uuid('source_id').references(() => sources.id, { onDelete: 'cascade' }).notNull(),
    locationTag: text('location_tag').notNull(),
    content: text('content').notNull(),
    tokenCount: integer('token_count').default(0).notNull(),
    sha256Hash: text('sha256_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_source_chunks_source_id').on(table.sourceId),
    index('idx_source_chunks_location_tag').on(table.locationTag),
    index('idx_source_chunks_source_loc').on(table.sourceId, table.locationTag),
  ]
);

// ==========================================
// Phase 02: Directed Competency Graph & Mastery
// ==========================================

export const competencies = pgTable(
  'competencies',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
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
    index('idx_competencies_workspace_id').on(table.workspaceId),
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
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_mastery_user_comp_unique').on(table.userId, table.competencyId),
    index('idx_mastery_records_user_id').on(table.userId),
    index('idx_mastery_records_comp_id').on(table.competencyId),
  ]
);

// ==========================================
// Phase 03: Task Bank & Multi-Tier Oracle
// ==========================================

export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    competencyId: uuid('competency_id').references(() => competencies.id, { onDelete: 'cascade' }).notNull(),
    title: text('title').notNull(),
    scenario: text('scenario').notNull(),
    taskType: text('task_type', { enum: ['calculation', 'case_study', 'document_draft', 'checklist'] }).notNull(),
    oracleData: jsonb('oracle_data').$type<Record<string, any>>().notNull(),
    rubricCriteria: jsonb('rubric_criteria').$type<any[]>().notNull(),
    passingScore: integer('passing_score').default(85).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
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

// ==========================================
// Phase 04: Progressive Authorization Gates & Audit Logs
// ==========================================

export const gates = pgTable(
  'gates',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
    level: integer('level').notNull(), // 0, 1, 2, 3
    title: text('title').notNull(),
    description: text('description').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_gates_workspace_id').on(table.workspaceId),
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
    grantedBy: text('granted_by').notNull(), // 'system' or expert user ID
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

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
    actorId: text('actor_id').notNull(),
    action: text('action').notNull(),
    targetType: text('target_type').notNull(), // 'gate', 'competency', 'attempt', 'source'
    targetId: text('target_id').notNull(),
    payload: jsonb('payload').$type<Record<string, any>>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_audit_logs_workspace').on(table.workspaceId),
    index('idx_audit_logs_action').on(table.action),
    index('idx_audit_logs_target').on(table.targetType, table.targetId),
  ]
);

// ==========================================
// Phase 05: Staleness Engine & Spaced Flashcards
// ==========================================

export const spacedFlashcards = pgTable(
  'spaced_flashcards',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    competencyId: uuid('competency_id').references(() => competencies.id, { onDelete: 'cascade' }).notNull(),
    sourceChunkId: uuid('source_chunk_id').references(() => sourceChunks.id, { onDelete: 'set null' }),
    front: text('front').notNull(),
    back: text('back').notNull(),
    category: text('category').default('general').notNull(),
    repetitionIntervalDays: integer('repetition_interval_days').default(1).notNull(),
    easeFactor: integer('ease_factor').default(250).notNull(), // SM-2 ease factor * 100
    repetitionCount: integer('repetition_count').default(0).notNull(),
    nextReviewDue: timestamp('next_review_due', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_spaced_fc_user').on(table.userId),
    index('idx_spaced_fc_due').on(table.nextReviewDue),
    index('idx_spaced_fc_comp').on(table.competencyId),
  ]
);





