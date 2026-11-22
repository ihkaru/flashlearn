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
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import type { ContentArtifactMetadata, LossVector } from '@flashlearn/shared';
import { users } from './core';
import { contents } from './contents';

export const contentArtifacts = pgTable(
  'content_artifacts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    contentId: uuid('content_id')
      .references(() => contents.id, { onDelete: 'cascade' })
      .notNull(),
    kind: text('kind', { enum: ['slide_deck_html', 'anchoring_sim_html'] }).notNull(),
    mimeType: text('mime_type').default('text/html').notNull(),
    htmlContent: text('html_content').notNull(),
    sha256Hash: text('sha256_hash').notNull(),
    byteSize: integer('byte_size').notNull(),
    metadata: jsonb('metadata').$type<ContentArtifactMetadata>(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_content_artifacts_content_kind').on(table.contentId, table.kind),
    index('idx_content_artifacts_content_id').on(table.contentId),
  ]
);

export const learnerContentProgress = pgTable(
  'learner_content_progress',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    contentId: uuid('content_id')
      .references(() => contents.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    sessionKey: text('session_key'),
    currentStepIndex: integer('current_step_index').default(0).notNull(),
    totalSteps: integer('total_steps').default(1).notNull(),
    currentSlideIndex: integer('current_slide_index').default(0).notNull(),
    completedStepIds: jsonb('completed_step_ids').$type<string[]>().default([]).notNull(),
    anchoringCompleted: boolean('anchoring_completed').default(false).notNull(),
    diagnosticAttempts: integer('diagnostic_attempts').default(0).notNull(),
    lastLossScore: numeric('last_loss_score', { precision: 4, scale: 3 }),
    lossVector: jsonb('loss_vector').$type<LossVector>(),
    thetaMastery: numeric('theta_mastery', { precision: 4, scale: 3 }).default('0.000').notNull(),
    isCompleted: boolean('is_completed').default(false).notNull(),
    dailyActivityLog: jsonb('daily_activity_log')
      .$type<Record<string, { stepsCompleted: number; probesSolved: number }>>()
      .default({})
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_lcp_content_id').on(table.contentId),
    index('idx_lcp_user_updated').on(table.userId, table.updatedAt),
    index('idx_lcp_session_updated').on(table.sessionKey, table.updatedAt),
  ]
);
