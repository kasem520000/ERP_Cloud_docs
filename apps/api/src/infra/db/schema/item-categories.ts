import { pgTable, uuid, text, boolean, timestamp, integer, index, unique } from 'drizzle-orm/pg-core';
export const itemCategories = pgTable('item_categories', {
  id: uuid('id').primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  nameAr: text('name_ar'),
  parentId: uuid('parent_id'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  version: integer('version').notNull().default(1),
}, (t) => ({
  ixTenant: index('ix_item_categories_tenant').on(t.tenantId),
  ixTenantParent: index('ix_item_categories_tenant_parent').on(t.tenantId, t.parentId),
  uqTenantCode: unique('uq_item_categories_tenant_code').on(t.tenantId, t.code),
}));
