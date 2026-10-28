import { pgTable, uuid, text, jsonb, timestamp, index, unique } from 'drizzle-orm/pg-core';
export const tenantSettings = pgTable('tenant_settings', {
  id: uuid('id').primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  key: text('key').notNull(),
  value: jsonb('value').notNull(),
  updatedBy: uuid('updated_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  ixTenant: index('ix_tenant_settings_tenant').on(t.tenantId),
  uqTenantKey: unique('uq_tenant_settings_tenant_key').on(t.tenantId, t.key),
}));
