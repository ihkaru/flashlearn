import { pgTable, text, timestamp, boolean, integer, jsonb, uuid, index } from 'drizzle-orm/pg-core';

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
    action: text('action').notNull(),
    snapshot: jsonb('snapshot').notNull(),
    changedBy: uuid('changed_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('idx_workspace_versions_workspace_id').on(table.workspaceId)]
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

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
    actorId: text('actor_id').notNull(),
    action: text('action').notNull(),
    targetType: text('target_type').notNull(),
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
