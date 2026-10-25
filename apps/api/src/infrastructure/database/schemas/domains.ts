import { pgTable, text, timestamp, integer, uuid, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { workspaces } from './core';

export const domains = pgTable(
  'domains',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    targetRole: text('target_role').notNull(),
    responsibilityScope: text('responsibility_scope').notNull(),
    legalAuthorityLevel: integer('legal_authority_level').default(1).notNull(),
    minPassingScore: integer('min_passing_score').default(80).notNull(),
    icon: text('icon'),
    coverImage: text('cover_image'),
    status: text('status', { enum: ['draft', 'active', 'archived'] }).default('active').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_domains_ws_slug').on(table.workspaceId, table.slug),
    uniqueIndex('idx_domains_ws_code').on(table.workspaceId, table.code),
    index('idx_domains_workspace_id').on(table.workspaceId),
    index('idx_domains_status').on(table.status),
  ]
);
