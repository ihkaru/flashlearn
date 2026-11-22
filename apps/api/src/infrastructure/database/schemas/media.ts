import {
  pgTable,
  text,
  timestamp,
  integer,
  uuid,
  index,
  uniqueIndex,
  customType,
} from 'drizzle-orm/pg-core';
import type { MediaStorageDriver } from '@flashlearn/shared';
import { users, workspaces } from './core';

const bytea = customType<{ data: Uint8Array; driverData: Buffer | Uint8Array }>({
  dataType() {
    return 'bytea';
  },
  toDriver(value: Uint8Array): Buffer {
    return Buffer.from(value);
  },
  fromDriver(value: Buffer | Uint8Array): Uint8Array {
    return value instanceof Uint8Array ? new Uint8Array(value) : new Uint8Array(Buffer.from(value));
  },
});

/**
 * Isolated content-addressed binary blob store (default stateless persistence driver).
 * Kept strictly separate from workspace/content/media metadata tables so listing queries never touch BYTEA.
 */
export const mediaAssetBlobs = pgTable('media_asset_blobs', {
  sha256: text('sha256').primaryKey(),
  mimeType: text('mime_type').notNull(),
  byteSize: integer('byte_size').notNull(),
  data: bytea('data').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Persistent media asset metadata registry scoped per workspace with sha256 deduplication.
 */
export const mediaAssets = pgTable(
  'media_assets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .references(() => workspaces.id, { onDelete: 'cascade' })
      .notNull(),
    sha256: text('sha256').notNull(),
    filename: text('filename').notNull(),
    mimeType: text('mime_type').notNull(),
    byteSize: integer('byte_size').notNull(),
    width: integer('width'),
    height: integer('height'),
    storageDriver: text('storage_driver')
      .$type<MediaStorageDriver>()
      .default('postgres')
      .notNull(),
    storageKey: text('storage_key').notNull(),
    sourceRef: text('source_ref'),
    sourcePage: integer('source_page'),
    caption: text('caption'),
    altText: text('alt_text'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_media_assets_workspace_sha256').on(table.workspaceId, table.sha256),
    index('idx_media_assets_workspace_id').on(table.workspaceId),
    index('idx_media_assets_sha256').on(table.sha256),
  ]
);
