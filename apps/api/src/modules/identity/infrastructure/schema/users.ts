import { pgTable, uuid, text, timestamp, integer, index } from 'drizzle-orm/pg-core';
export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull(),
  phone: text('phone'),
  fullName: text('full_name').notNull(),
  passwordHash: text('password_hash').notNull(),
  status: text('status').notNull().default('PENDING'),
  locale: text('locale').notNull().default('ar'),
  failedLoginCount: integer('failed_login_count').notNull().default(0),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  ixEmail: index('uq_users_email').on(t.email),
}));
