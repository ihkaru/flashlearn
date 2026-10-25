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
import type { QuizQuestion } from '@flashlearn/shared';
import { users, workspaces } from './core';
import { domains } from './domains';
import { sources, sourceChunks } from './sources';
import { competencies } from './competencies';

export const contents = pgTable(
  'contents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
    domainId: uuid('domain_id').references(() => domains.id, { onDelete: 'set null' }),
    competencyId: uuid('competency_id').references(() => competencies.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    type: text('type', { enum: ['materi', 'quiz', 'combined'] }).notNull(),
    summary: text('summary'),
    readingTimeMinutes: integer('reading_time_minutes').default(5),
    body: text('body'),
    questions: jsonb('questions').$type<QuizQuestion[]>(),
    isPublished: boolean('is_published').default(true).notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_contents_workspace_id').on(table.workspaceId),
    index('idx_contents_domain_id').on(table.domainId),
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
    action: text('action').notNull(),
    snapshot: jsonb('snapshot').notNull(),
    changedBy: uuid('changed_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('idx_content_versions_content_id').on(table.contentId)]
);

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
    easeFactor: integer('ease_factor').default(250).notNull(),
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

export const contentSourceCitations = pgTable(
  'content_source_citations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    contentId: uuid('content_id').references(() => contents.id, { onDelete: 'cascade' }).notNull(),
    sourceChunkId: uuid('source_chunk_id').references(() => sourceChunks.id, { onDelete: 'cascade' }).notNull(),
    relevanceScore: numeric('relevance_score', { precision: 4, scale: 2 }).default('1.0').notNull(),
    annotation: text('annotation'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_content_chunk_unique').on(table.contentId, table.sourceChunkId),
    index('idx_content_citations_content').on(table.contentId),
    index('idx_content_citations_chunk').on(table.sourceChunkId),
  ]
);
