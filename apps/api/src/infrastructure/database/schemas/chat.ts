import { pgTable, text, timestamp, boolean, integer, jsonb, uuid, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { users, workspaces } from './core';
import { domains } from './domains';
import { tasks } from './competencies';

export const socraticChatSessions = pgTable(
  'socratic_chat_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'set null' }),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
    domainId: uuid('domain_id').references(() => domains.id, { onDelete: 'set null' }),
    merkleRoot: text('merkle_root'),
    status: text('status', { enum: ['active', 'concluded'] }).default('active').notNull(),
    turnCount: integer('turn_count').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_socratic_sessions_user').on(table.userId),
    index('idx_socratic_sessions_task').on(table.taskId),
    index('idx_socratic_sessions_workspace').on(table.workspaceId),
    index('idx_socratic_sessions_domain').on(table.domainId),
  ]
);

export const socraticChatTurns = pgTable(
  'socratic_chat_turns',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionId: uuid('session_id').references(() => socraticChatSessions.id, { onDelete: 'cascade' }).notNull(),
    turnIndex: integer('turn_index').notNull(),
    sender: text('sender', { enum: ['learner', 'socratic_tutor'] }).notNull(),
    message: text('message').notNull(),
    turnHash: text('turn_hash').notNull(),
    antiSpoilerBlocked: boolean('anti_spoiler_blocked').default(false).notNull(),
    citedChunkIds: jsonb('cited_chunk_ids').$type<string[]>().default([]).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_socratic_turns_session_index').on(table.sessionId, table.turnIndex),
    index('idx_socratic_turns_session').on(table.sessionId),
  ]
);
