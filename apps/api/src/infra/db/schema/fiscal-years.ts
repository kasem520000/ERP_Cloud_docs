import { pgTable, uuid, text, date, timestamp, integer, index, unique } from 'drizzle-orm/pg-core';
export const fiscalYears = pgTable('fiscal_years', {
  id: uuid('id').primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  name: text('name').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  status: text('status').notNull().default('OPEN'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  version: integer('version').notNull().default(1),
}, (t) => ({ ixTenant: index('ix_fiscal_years_tenant').on(t.tenantId), uqTenantName: unique('uq_fiscal_years_tenant_name').on(t.tenantId, t.name) }));
export const fiscalPeriods = pgTable('fiscal_periods', {
  id: uuid('id').primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  fiscalYearId: uuid('fiscal_year_id').notNull(),
  name: text('name').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  status: text('status').notNull().default('OPEN'),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  closedBy: uuid('closed_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  version: integer('version').notNull().default(1),
}, (t) => ({ ixTenant: index('ix_fiscal_periods_tenant').on(t.tenantId), ixYear: index('ix_fiscal_periods_year').on(t.tenantId, t.fiscalYearId) }));
