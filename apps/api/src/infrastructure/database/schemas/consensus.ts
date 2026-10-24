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
} from 'drizzle-orm/pg-core';
import type { InterRaterReliabilityResult } from '@flashlearn/shared';
import { users } from './core';
import { attempts } from './competencies';

export const taskAttemptReviews = pgTable(
  'task_attempt_reviews',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    attemptId: uuid('attempt_id').references(() => attempts.id, { onDelete: 'cascade' }).notNull(),
    reviewerId: uuid('reviewer_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    blindToken: text('blind_token').notNull().unique(),
    role: text('role', { enum: ['primary', 'secondary', 'arbiter'] }).default('primary').notNull(),
    status: text('status', { enum: ['assigned', 'submitted', 'disputed', 'arbitrated'] })
      .default('assigned')
      .notNull(),
    rubricScores: jsonb('rubric_scores').$type<Record<string, number>>(),
    totalScore: integer('total_score'),
    notes: text('notes'),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_task_attempt_reviews_attempt').on(table.attemptId),
    index('idx_task_attempt_reviews_reviewer').on(table.reviewerId),
    index('idx_task_attempt_reviews_token').on(table.blindToken),
    index('idx_task_attempt_reviews_status').on(table.status),
  ]
);

export const attemptConsensusRecords = pgTable(
  'attempt_consensus_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    attemptId: uuid('attempt_id').references(() => attempts.id, { onDelete: 'cascade' }).notNull().unique(),
    status: text('status', {
      enum: ['in_review', 'consensus_approved', 'arbitration_required', 'arbitration_resolved'],
    })
      .default('in_review')
      .notNull(),
    observedAgreement: numeric('observed_agreement', { precision: 5, scale: 4 }),
    gwetAc1: numeric('gwet_ac1', { precision: 5, scale: 4 }),
    gwetAc2: numeric('gwet_ac2', { precision: 5, scale: 4 }),
    cohenKappa: numeric('cohen_kappa', { precision: 5, scale: 4 }),
    scoreDelta: numeric('score_delta', { precision: 6, scale: 2 }),
    finalScore: integer('final_score'),
    passed: boolean('passed'),
    arbiterReviewId: uuid('arbiter_review_id').references(() => taskAttemptReviews.id, {
      onDelete: 'set null',
    }),
    metrics: jsonb('metrics').$type<InterRaterReliabilityResult>().default({} as any).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_attempt_consensus_attempt').on(table.attemptId),
    index('idx_attempt_consensus_status').on(table.status),
  ]
);
