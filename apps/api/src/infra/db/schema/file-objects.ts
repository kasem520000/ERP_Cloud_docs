import { pgTable, uuid, text, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { tenants } from './tenants.js';

export const fileObjects = pgTable('file_objects', {
  id: uuid('id').primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  ownerType: text('owner_type').notNull(),
  ownerId: uuid('owner_id'),
  storageKey: text('storage_key').notNull(),
  name: text('name').notNull(),
  size: integer('size').notNull(),
  contentType: text('content_type').notNull(),
  checksum: text('checksum'),
  uploadedBy: uuid('uploaded_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ix_tenant_owner: index('ix_file_objects_tenant_owner').on(table.tenantId, table.ownerType, table.ownerId),
}));
