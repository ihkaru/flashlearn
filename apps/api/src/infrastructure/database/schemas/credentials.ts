import {
  pgTable,
  text,
  timestamp,
  jsonb,
  uuid,
  index,
} from 'drizzle-orm/pg-core';
import type { W3CVerifiableCredential20 } from '@flashlearn/shared';
import { workspaces, users } from './core';
import { gates } from './competencies';

export const workspaceKeypairs = pgTable(
  'workspace_keypairs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull().unique(),
    publicKeyMultibase: text('public_key_multibase').notNull(),
    publicKeyPem: text('public_key_pem').notNull(),
    privateKeyPem: text('private_key_pem').notNull(),
    didIdentifier: text('did_identifier').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_workspace_keypairs_ws').on(table.workspaceId),
  ]
);

export const issuedCredentials = pgTable(
  'issued_credentials',
  {
    id: text('id').primaryKey(),
    gateId: uuid('gate_id').references(() => gates.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
    vcPayload: jsonb('vc_payload').$type<W3CVerifiableCredential20>().notNull(),
    signatureProof: text('signature_proof').notNull(),
    status: text('status', { enum: ['active', 'revoked', 'drift_suspended'] }).default('active').notNull(),
    issuedAt: timestamp('issued_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_issued_credentials_user').on(table.userId),
    index('idx_issued_credentials_gate').on(table.gateId),
    index('idx_issued_credentials_ws').on(table.workspaceId),
  ]
);
