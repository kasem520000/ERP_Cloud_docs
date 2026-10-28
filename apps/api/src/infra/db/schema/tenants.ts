import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  nameAr: text('name_ar'),
  status: text('status').notNull().default('ACTIVE'),
  baseCurrency: text('base_currency'),
  countryCode: text('country_code'),
  timezone: text('timezone').notNull().default('UTC'),
  industryTemplateKey: text('industry_template_key'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
