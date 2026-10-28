import { pgTable, uuid, text, numeric, timestamp, integer, index, unique } from 'drizzle-orm/pg-core';
export const partners = pgTable('partners', {
  id: uuid('id').primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  kind: text('kind').notNull(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  nameAr: text('name_ar'),
  taxNumber: text('tax_number'),
  creditLimit: numeric('credit_limit', { precision: 19, scale: 4 }).default('0'),
  creditTermsId: uuid('credit_terms_id'),
  priceListId: uuid('price_list_id'),
  branchId: uuid('branch_id'),
  status: text('status').notNull().default('ACTIVE'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  version: integer('version').notNull().default(1),
}, (t) => ({
  ixTenant: index('ix_partners_tenant').on(t.tenantId),
  uqTenantCode: unique('uq_partners_tenant_code').on(t.tenantId, t.code),
}));
export const partnerContacts = pgTable('partner_contacts', {
  id: uuid('id').primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  partnerId: uuid('partner_id').notNull(),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  role: text('role'),
  isPrimary: text('is_primary'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  ixTenant: index('ix_partner_contacts_tenant').on(t.tenantId),
}));
export const partnerAddresses = pgTable('partner_addresses', {
  id: uuid('id').primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  partnerId: uuid('partner_id').notNull(),
  type: text('type').notNull(),
  line1: text('line1').notNull(),
  line2: text('line2'),
  city: text('city'),
  region: text('region'),
  countryCode: text('country_code'),
  postalCode: text('postal_code'),
  isPrimary: text('is_primary'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  ixTenant: index('ix_partner_addresses_tenant').on(t.tenantId),
}));
export const openingBalanceDocs = pgTable('opening_balance_docs', {
  id: uuid('id').primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  kind: text('kind').notNull(),
  partnerId: uuid('partner_id'),
  accountId: uuid('account_id'),
  itemId: uuid('item_id'),
  amount: numeric('amount', { precision: 19, scale: 4 }).notNull(),
  currency: text('currency').notNull().default('SAR'),
  status: text('status').notNull().default('DRAFT'),
  docDate: timestamp('doc_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  version: integer('version').notNull().default(1),
}, (t) => ({
  ixTenant: index('ix_opening_docs_tenant').on(t.tenantId),
}));
export const partnerBalances = pgTable('partner_balances', {
  id: uuid('id').primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  partnerId: uuid('partner_id').notNull(),
  openBalance: numeric('open_balance', { precision: 19, scale: 4 }).notNull().default('0'),
  overdueAmount: numeric('overdue_amount', { precision: 19, scale: 4 }).notNull().default('0'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  ixTenant: index('ix_partner_balances_tenant').on(t.tenantId),
}));
