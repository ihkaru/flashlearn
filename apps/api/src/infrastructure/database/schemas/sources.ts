import { pgTable, text, timestamp, integer, uuid, index } from 'drizzle-orm/pg-core';
import { workspaces } from './core';
import { domains } from './domains';

export const sources = pgTable(
  'sources',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
    domainId: uuid('domain_id').references(() => domains.id, { onDelete: 'cascade' }),
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
    index('idx_sources_domain_id').on(table.domainId),
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
