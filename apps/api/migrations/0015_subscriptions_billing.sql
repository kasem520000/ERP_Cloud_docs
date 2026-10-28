-- 0015_subscriptions_billing.sql — PHASE-014 MVP billing: subscriptions lifecycle, usage counters, notifications
-- Additive only, forward-only. PLACEHOLDER prices per OQ-002.

-- Extend subscriptions status for lifecycle trial→active→grace→suspended
DO $$ BEGIN ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check; EXCEPTION WHEN undefined_object THEN NULL; END $$;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check CHECK (status IN ('TRIAL','ACTIVE','PAST_DUE','GRACE','SUSPENDED','CANCELLED'));
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS grace_ends_at timestamptz;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS suspended_at timestamptz;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS suspended_reason text;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS provider text;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS provider_checkout_id text;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS current_period_start date;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS current_period_end date;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS downgrade_blockers jsonb;

-- Usage counters: documents/month, users, branches, warehouses, terminals, devices
CREATE TABLE IF NOT EXISTS usage_counters (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  counter_key text NOT NULL CHECK (counter_key IN ('documents_month','users','branches','warehouses','terminals','devices')),
  period text NOT NULL,
  value integer NOT NULL DEFAULT 0 CHECK (value >= 0),
  limit_value integer,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id),
  UNIQUE (tenant_id, counter_key, period)
);
CREATE INDEX IF NOT EXISTS ix_usage_counters_tenant ON usage_counters (tenant_id, counter_key);
ALTER TABLE usage_counters ENABLE ROW LEVEL SECURITY; ALTER TABLE usage_counters FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON usage_counters; CREATE POLICY tenant_isolation ON usage_counters USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON usage_counters TO erp_app;

-- Notifications inbox (billing-critical subset)
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  recipient_user_id uuid,
  kind text NOT NULL CHECK (kind IN ('limit_warning','subscription_state','reconciliation_broken','invoice_overdue','stock_below_reorder','billing')),
  title text NOT NULL,
  body text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id)
);
CREATE INDEX IF NOT EXISTS ix_notifications_tenant ON notifications (tenant_id, recipient_user_id, is_read, created_at DESC);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY; ALTER TABLE notifications FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON notifications; CREATE POLICY tenant_isolation ON notifications USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO erp_app;

-- Seed plans: Starter / Business / Enterprise with feature_keys per SUBSCRIPTION_AND_ENTITLEMENTS §2 (prices PLACEHOLDER)
INSERT INTO plans (id, key, name, price_amount, currency_code, billing_period, limits, feature_keys) VALUES
  ('00000000-0000-0000-0000-000000000101','starter','Starter',0,'SAR','MONTHLY',
   '{"users":3,"branches":1,"warehouses":2,"documents_month":500,"terminals":0,"devices":0}'::jsonb,
   ARRAY['platform.registration','platform.onboarding','platform.branches','platform.users_roles','platform.audit_trail','platform.data_export',
         'accounting.chart_of_accounts','accounting.fiscal_calendar','accounting.journal_entries','accounting.approvals','accounting.general_ledger','accounting.opening_balances','accounting.period_close','accounting.year_end_close','accounting.reconciliation',
         'partners.directory','partners.credit_terms','partners.statements','items.core','inventory.stock_ledger','inventory.valuation','inventory.multi_warehouse',
         'sales.quotations','sales.orders','sales.delivery_notes','sales.invoices','sales.credit_notes','sales.receipts','sales.receivables_aging',
         'purchasing.requests','purchasing.orders','purchasing.goods_receipts','purchasing.supplier_invoices','purchasing.three_way_matching',
         'treasury.accounts','treasury.receipts_disbursements','treasury.expenses','treasury.expense_categories','tax.engine','tax.codes','tax.registrations','tax.jurisdiction_packs','tax.vat_return',
         'reporting.engine','reporting.financial_statements','reporting.operational_reports','reporting.print_templates','reporting.exports']
  ) ON CONFLICT (key) DO UPDATE SET limits=EXCLUDED.limits, feature_keys=EXCLUDED.feature_keys, updated_at=now(),
  ('00000000-0000-0000-0000-000000000102','business','Business',0,'SAR','MONTHLY',
   '{"users":10,"branches":3,"warehouses":6,"documents_month":5000,"terminals":3,"devices":5}'::jsonb,
   ARRAY['platform.registration','platform.onboarding','platform.branches','platform.users_roles','platform.audit_trail','platform.data_export','platform.notifications',
         'accounting.chart_of_accounts','accounting.fiscal_calendar','accounting.journal_entries','accounting.approvals','accounting.general_ledger','accounting.opening_balances','accounting.period_close','accounting.year_end_close','accounting.reconciliation','accounting.multi_currency','accounting.cost_centers',
         'partners.directory','partners.credit_terms','partners.statements','items.core','inventory.stock_ledger','inventory.valuation','inventory.multi_warehouse','inventory.batch_tracking','inventory.serial_tracking','inventory.stock_counts','inventory.stock_transfers','sales.credit_limits','partners.credit_management','purchasing.landed_costs',
         'treasury.accounts','treasury.receipts_disbursements','treasury.expenses','treasury.expense_categories','treasury.petty_cash','treasury.cash_transfers','treasury.bank_reconciliation','treasury.cashier_shifts','treasury.cheques','tax.engine','tax.codes','tax.registrations','tax.jurisdiction_packs','tax.vat_return',
         'reporting.engine','reporting.financial_statements','reporting.operational_reports','reporting.print_templates','reporting.exports','reporting.dashboards',
         'pos.terminals','pos.sales','pos.shifts','pos.receipts','pos.barcode_scanning','pos.offline_queue','industry.template_engine','industry.terminology']
  ) ON CONFLICT (key) DO UPDATE SET limits=EXCLUDED.limits, feature_keys=EXCLUDED.feature_keys, updated_at=now(),
  ('00000000-0000-0000-0000-000000000103','enterprise','Enterprise',0,'SAR','MONTHLY',
   '{"users":50,"branches":999,"warehouses":999,"documents_month":250000,"terminals":999,"devices":100}'::jsonb,
   ARRAY['platform.registration','platform.onboarding','platform.branches','platform.users_roles','platform.audit_trail','platform.data_export','platform.notifications',
         'accounting.chart_of_accounts','accounting.fiscal_calendar','accounting.journal_entries','accounting.approvals','accounting.general_ledger','accounting.opening_balances','accounting.period_close','accounting.year_end_close','accounting.reconciliation','accounting.multi_currency','accounting.cost_centers','accounting.projects',
         'partners.directory','partners.credit_terms','partners.statements','items.core','inventory.stock_ledger','inventory.valuation','inventory.multi_warehouse','inventory.batch_tracking','inventory.serial_tracking','inventory.stock_counts','inventory.stock_transfers','inventory.reservations','inventory.reorder_levels','sales.credit_limits','partners.credit_management','purchasing.landed_costs','sales.commissions',
         'treasury.accounts','treasury.receipts_disbursements','treasury.expenses','treasury.expense_categories','treasury.petty_cash','treasury.cash_transfers','treasury.bank_reconciliation','treasury.cashier_shifts','treasury.cheques','tax.engine','tax.codes','tax.registrations','tax.jurisdiction_packs','tax.vat_return','tax.einvoicing_framework',
         'reporting.engine','reporting.financial_statements','reporting.operational_reports','reporting.print_templates','reporting.exports','reporting.dashboards','reporting.scheduled_reports',
         'pos.terminals','pos.sales','pos.shifts','pos.receipts','pos.barcode_scanning','pos.offline_queue','industry.template_engine','industry.terminology',
         'crm.leads','crm.service_orders','crm.service_contracts','crm.recurring_billing','manufacturing.boms','manufacturing.work_orders','distribution.settlements','offline.desktop_app','offline.android_app','offline.mobile_accounts','offline.device_management']
  ) ON CONFLICT (key) DO UPDATE SET limits=EXCLUDED.limits, feature_keys=EXCLUDED.feature_keys, updated_at=now();
