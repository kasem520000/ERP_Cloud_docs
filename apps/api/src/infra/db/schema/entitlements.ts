import { pgTable, uuid, text, timestamp, index, unique } from 'drizzle-orm/pg-core';
export const entitlements = pgTable('entitlements', {
  id: uuid('id').primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  featureKey: text('feature_key').notNull(),
  source: text('source').notNull().default('PLAN'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  ixTenant: index('ix_entitlements_tenant').on(t.tenantId),
  uqTenantFeature: unique('uq_entitlements_tenant_feature').on(t.tenantId, t.featureKey),
}));
