import { pgTable, uuid, text, boolean, timestamp, index } from 'drizzle-orm/pg-core';
export const uoms = pgTable('uoms', {
  id: uuid('id').primaryKey(),
  tenantId: uuid('tenant_id'),
  code: text('code').notNull(),
  name: text('name').notNull(),
  nameAr: text('name_ar'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  ixTenant: index('ix_uoms_tenant').on(t.tenantId),
}));
export const uomConversions = pgTable('uom_conversions', {
  id: uuid('id').primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  fromUomId: uuid('from_uom_id').notNull(),
  toUomId: uuid('to_uom_id').notNull(),
  factor: text('factor').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  ixTenant: index('ix_uom_conversions_tenant').on(t.tenantId),
}));
