import { pgTable, uuid, text, boolean, timestamp, index } from 'drizzle-orm/pg-core';
export const supportSessions = pgTable('support_sessions', {
  id: uuid('id').primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  platformUserId: uuid('platform_user_id').notNull(),
  reason: text('reason').notNull(),
  ticketId: text('ticket_id'),
  optIn: boolean('opt_in').notNull().default(false),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  ixTenant: index('ix_support_sessions_tenant').on(t.tenantId),
}));
