import { pgTable, uuid, text, integer, boolean, timestamp, index, unique } from 'drizzle-orm/pg-core';
export const creditTerms = pgTable('credit_terms', {
  id: uuid('id').primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  nameAr: text('name_ar'),
  days: integer('days').notNull().default(0),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  version: integer('version').notNull().default(1),
}, (t) => ({
  ixTenant: index('ix_credit_terms_tenant').on(t.tenantId),
  uqTenantCode: unique('uq_credit_terms_tenant_code').on(t.tenantId, t.code),
}));
