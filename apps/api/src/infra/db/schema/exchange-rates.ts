import { pgTable, uuid, text, numeric, date, timestamp, integer, index, unique } from 'drizzle-orm/pg-core';
export const exchangeRates = pgTable('exchange_rates', {
  id: uuid('id').primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  currencyCode: text('currency_code').notNull(),
  rateDate: date('rate_date').notNull(),
  rate: numeric('rate', { precision: 19, scale: 8 }).notNull(),
  source: text('source').notNull().default('MANUAL'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  version: integer('version').notNull().default(1),
}, (t) => ({ ixTenant: index('ix_exchange_rates_tenant').on(t.tenantId), uqTenantCurrencyDate: unique('uq_exchange_rates_tenant_currency_date').on(t.tenantId, t.currencyCode, t.rateDate) }));
