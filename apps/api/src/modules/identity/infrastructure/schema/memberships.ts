import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
export const memberships = pgTable('memberships', {
  id: uuid('id').primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  userId: uuid('user_id').notNull(),
  roleId: uuid('role_id').notNull(),
  status: text('status').notNull().default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  ixTenantUser: index('ix_memberships_tenant_user').on(t.tenantId, t.userId),
}));
