import { pgTable, uuid, text, boolean, numeric, timestamp, integer, index, unique } from 'drizzle-orm/pg-core';
export const items = pgTable('items', {
  id: uuid('id').primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  sku: text('sku').notNull(),
  name: text('name').notNull(),
  nameAr: text('name_ar'),
  kind: text('kind').notNull(),
  uomId: uuid('uom_id').notNull(),
  categoryId: uuid('category_id'),
  taxCodeId: uuid('tax_code_id'),
  costingMethod: text('costing_method').notNull().default('WAC'),
  trackBatch: boolean('track_batch').notNull().default(false),
  trackSerial: boolean('track_serial').notNull().default(false),
  trackImei: boolean('track_imei').notNull().default(false),
  hasExpiry: boolean('has_expiry').notNull().default(false),
  reorderLevel: numeric('reorder_level', { precision: 19, scale: 6 }),
  reorderQty: numeric('reorder_qty', { precision: 19, scale: 6 }),
  status: text('status').notNull().default('ACTIVE'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  version: integer('version').notNull().default(1),
}, (t) => ({
  ixTenant: index('ix_items_tenant').on(t.tenantId),
  uqTenantSku: unique('uq_items_tenant_sku').on(t.tenantId, t.sku),
}));
export const barcodes = pgTable('barcodes', {
  id: uuid('id').primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  itemId: uuid('item_id').notNull(),
  code: text('code').notNull(),
  uomId: uuid('uom_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  ixTenant: index('ix_barcodes_tenant').on(t.tenantId),
  uqTenantCode: unique('uq_barcodes_tenant_code').on(t.tenantId, t.code),
}));
export const priceLists = pgTable('price_lists', {
  id: uuid('id').primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  nameAr: text('name_ar'),
  currency: text('currency').notNull().default('SAR'),
  kind: text('kind').notNull(),
  validFrom: timestamp('valid_from'),
  validTo: timestamp('valid_to'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  version: integer('version').notNull().default(1),
}, (t) => ({
  ixTenant: index('ix_price_lists_tenant').on(t.tenantId),
  uqTenantCode: unique('uq_price_lists_tenant_code').on(t.tenantId, t.code),
}));
export const priceListItems = pgTable('price_list_items', {
  id: uuid('id').primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  priceListId: uuid('price_list_id').notNull(),
  itemId: uuid('item_id').notNull(),
  uomId: uuid('uom_id').notNull(),
  unitPrice: numeric('unit_price', { precision: 19, scale: 6 }).notNull(),
  minQty: numeric('min_qty', { precision: 19, scale: 6 }).notNull().default('1'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  ixTenant: index('ix_price_list_items_tenant').on(t.tenantId),
}));
