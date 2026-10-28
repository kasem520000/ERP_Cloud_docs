import { pgTable, uuid, text, boolean, timestamp, index, unique } from 'drizzle-orm/pg-core';
export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  nameAr: text('name_ar'),
  type: text('type').notNull(),
  parentId: uuid('parent_id'),
  isPostable: boolean('is_postable').notNull().default(true),
  isSystem: boolean('is_system').notNull().default(false),
  status: text('status').notNull().default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  ixTenant: index('ix_accounts_tenant').on(t.tenantId),
  uqTenantCode: unique('uq_accounts_tenant_code').on(t.tenantId, t.code),
}));
export const accountPurposes = pgTable('account_purposes', {
  id: uuid('id').primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  purposeKey: text('purpose_key').notNull(),
  accountId: uuid('account_id').notNull(),
  activeFrom: timestamp('active_from').notNull().defaultNow(),
}, (t) => ({
  ixTenant: index('ix_account_purposes_tenant').on(t.tenantId),
  uqTenantPurpose: unique('uq_account_purposes_tenant_purpose').on(t.tenantId, t.purposeKey),
}));
