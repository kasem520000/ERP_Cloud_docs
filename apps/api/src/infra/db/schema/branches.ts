import { pgTable, uuid, text, boolean, jsonb, timestamp, index, unique } from 'drizzle-orm/pg-core';
export const branches = pgTable('branches', {
  id: uuid('id').primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  nameAr: text('name_ar'),
  address: jsonb('address'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  ixTenant: index('ix_branches_tenant').on(t.tenantId),
  uqTenantCode: unique('uq_branches_tenant_code').on(t.tenantId, t.code),
}));
