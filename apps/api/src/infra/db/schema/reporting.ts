import { pgTable, uuid, text, integer } from 'drizzle-orm/pg-core';
export const reportRuns = pgTable('report_runs', { id: uuid('id').primaryKey(), tenantId: uuid('tenant_id').notNull(), reportKey: text('report_key').notNull(), contractVersion: integer('contract_version').notNull(), paramsHash: text('params_hash').notNull(), status: text('status').notNull().default('QUEUED'), stage: text('stage') });
export const printTemplates = pgTable('print_templates', { id: uuid('id').primaryKey(), key: text('key').notNull(), locale: text('locale').notNull(), version: integer('version').notNull() });
