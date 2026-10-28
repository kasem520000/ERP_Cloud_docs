import { pgTable, uuid, text, boolean, jsonb, timestamp, integer, date, index, unique } from 'drizzle-orm/pg-core';
export const costCenters = pgTable('cost_centers', {
  id: uuid('id').primaryKey(), tenantId: uuid('tenant_id').notNull(),
  code: text('code').notNull(), name: text('name').notNull(), nameAr: text('name_ar'),
  parentId: uuid('parent_id'), isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  version: integer('version').notNull().default(1),
}, (t) => ({ ixTenant: index('ix_cost_centers_tenant').on(t.tenantId), uqCode: unique('uq_cost_centers_tenant_code').on(t.tenantId, t.code) }));
export const recurringJournals = pgTable('recurring_journals', {
  id: uuid('id').primaryKey(), tenantId: uuid('tenant_id').notNull(),
  name: text('name').notNull(), template: jsonb('template').notNull(), schedule: text('schedule').notNull(),
  nextRunDate: date('next_run_date').notNull(), lastRunAt: timestamp('last_run_at', { withTimezone: true }),
  status: text('status').notNull().default('ACTIVE'), createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(), version: integer('version').notNull().default(1),
}, (t) => ({ ixTenant: index('ix_recurring_tenant').on(t.tenantId) }));
export const approvalPolicies = pgTable('approval_policies', {
  id: uuid('id').primaryKey(), tenantId: uuid('tenant_id').notNull(),
  docType: text('doc_type').notNull(), policy: jsonb('policy').notNull(), appliesFrom: date('applies_from').notNull().defaultNow(),
  isActive: boolean('is_active').notNull().default(true), createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(), version: integer('version').notNull().default(1),
}, (t) => ({ ixTenant: index('ix_approval_policies_tenant').on(t.tenantId) }));
export const numberingSequences = pgTable('numbering_sequences', {
  id: uuid('id').primaryKey(), tenantId: uuid('tenant_id').notNull(), branchId: uuid('branch_id'),
  docType: text('doc_type').notNull(), prefix: text('prefix').notNull().default(''), nextSeq: integer('next_seq').notNull().default(1),
  formatTemplate: text('format_template').notNull().default('{prefix}{yyyy}-{seq:6}'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ ixTenant: index('ix_numbering_tenant').on(t.tenantId) }));
export const reconciliationRuns = pgTable('reconciliation_runs', {
  id: uuid('id').primaryKey(), tenantId: uuid('tenant_id').notNull(), checkKey: text('check_key').notNull(),
  status: text('status').notNull(), details: jsonb('details'), runAt: timestamp('run_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ ixTenant: index('ix_recon_tenant').on(t.tenantId) }));
