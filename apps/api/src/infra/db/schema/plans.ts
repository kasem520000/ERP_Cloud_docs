import { pgTable, uuid, text, numeric, jsonb, boolean, timestamp } from 'drizzle-orm/pg-core';
export const plans = pgTable('plans', {
  id: uuid('id').primaryKey(),
  key: text('key').notNull().unique(),
  name: text('name').notNull(),
  priceAmount: numeric('price_amount', { precision: 19, scale: 4 }).notNull(),
  currencyCode: text('currency_code').notNull().default('SAR'),
  billingPeriod: text('billing_period').notNull().default('MONTHLY'),
  limits: jsonb('limits').notNull().default({}),
  featureKeys: text('feature_keys').array().notNull().default([]),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
