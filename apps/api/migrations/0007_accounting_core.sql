-- 0007_accounting_core.sql — Fiscal calendar, FX, cost centers, recurring, approvals, numbering
-- Additive; forward-only. All tenant-owned tables RLS + composite FKs + tenant-first indexes.

-- ── extend accounts for posting readiness (V-rules service guards, INV-015) ──
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS currency_code char(3) REFERENCES currencies(code);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
-- ensure is_postable semantics: leaf ∧ not group (enforced by service, not DB check — type system)
DO $$ BEGIN
  ALTER TABLE accounts ADD CONSTRAINT ck_accounts_type CHECK (type IN ('ASSET','LIABILITY','EQUITY','REVENUE','EXPENSE'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── extend account_purposes for partial-unique active_to IS NULL (V1) ──
ALTER TABLE account_purposes ADD COLUMN IF NOT EXISTS active_to date;
ALTER TABLE account_purposes ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;
ALTER TABLE account_purposes ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE account_purposes ADD COLUMN IF NOT EXISTS created_by uuid;
-- partial unique: at most one active mapping per purpose per tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_account_purposes_tenant_purpose_active
  ON account_purposes (tenant_id, purpose_key) WHERE active_to IS NULL;

-- ── fiscal_years ──
CREATE TABLE IF NOT EXISTS fiscal_years (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL CHECK (start_date <= end_date),
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','CLOSED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1,
  UNIQUE (id, tenant_id),
  UNIQUE (tenant_id, name)
);
CREATE INDEX IF NOT EXISTS ix_fiscal_years_tenant ON fiscal_years (tenant_id);
ALTER TABLE fiscal_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_years FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON fiscal_years;
CREATE POLICY tenant_isolation ON fiscal_years USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON fiscal_years TO erp_app;

-- ── fiscal_periods ──
CREATE TABLE IF NOT EXISTS fiscal_periods (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  fiscal_year_id uuid NOT NULL,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL CHECK (start_date <= end_date),
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','SOFT_CLOSED','LOCKED')),
  closed_at timestamptz,
  closed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1,
  UNIQUE (id, tenant_id),
  UNIQUE (tenant_id, fiscal_year_id, name)
);
-- exclusion constraint: no overlapping periods inside same year (b-tree_gist or plain check via trigger for MVP)
-- MVP uses trigger-based overlap guard + exclusion index on daterange if btree_gist available
CREATE EXTENSION IF NOT EXISTS btree_gist;
DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS btree_gist;
EXCEPTION WHEN others THEN NULL; END $$;
-- daterange exclusion per fiscal_year (requires gist)
DO $$ BEGIN
  ALTER TABLE fiscal_periods ADD CONSTRAINT excl_fiscal_periods_no_overlap
    EXCLUDE USING gist (fiscal_year_id WITH =, daterange(start_date, end_date, '[]') WITH &&);
EXCEPTION WHEN others THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS ix_fiscal_periods_tenant ON fiscal_periods (tenant_id);
CREATE INDEX IF NOT EXISTS ix_fiscal_periods_year ON fiscal_periods (tenant_id, fiscal_year_id);
CREATE INDEX IF NOT EXISTS ix_fiscal_periods_status ON fiscal_periods (tenant_id, status);
DO $$ BEGIN
  ALTER TABLE fiscal_periods ADD CONSTRAINT fk_periods_year FOREIGN KEY (fiscal_year_id, tenant_id) REFERENCES fiscal_years (id, tenant_id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE fiscal_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_periods FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON fiscal_periods;
CREATE POLICY tenant_isolation ON fiscal_periods USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON fiscal_periods TO erp_app;

-- ── exchange_rates ──
CREATE TABLE IF NOT EXISTS exchange_rates (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  currency_code char(3) NOT NULL REFERENCES currencies(code),
  rate_date date NOT NULL,
  rate numeric(19,8) NOT NULL CHECK (rate > 0),
  source text NOT NULL DEFAULT 'MANUAL' CHECK (source IN ('MANUAL','IMPORTED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1,
  UNIQUE (id, tenant_id),
  UNIQUE (tenant_id, currency_code, rate_date)
);
CREATE INDEX IF NOT EXISTS ix_exchange_rates_tenant ON exchange_rates (tenant_id);
CREATE INDEX IF NOT EXISTS ix_exchange_rates_lookup ON exchange_rates (tenant_id, currency_code, rate_date DESC);
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON exchange_rates;
CREATE POLICY tenant_isolation ON exchange_rates USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON exchange_rates TO erp_app;

-- ── cost_centers ──
CREATE TABLE IF NOT EXISTS cost_centers (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  name_ar text,
  parent_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1,
  UNIQUE (id, tenant_id),
  UNIQUE (tenant_id, code)
);
CREATE INDEX IF NOT EXISTS ix_cost_centers_tenant ON cost_centers (tenant_id);
CREATE INDEX IF NOT EXISTS ix_cost_centers_parent ON cost_centers (tenant_id, parent_id);
DO $$ BEGIN
  ALTER TABLE cost_centers ADD CONSTRAINT fk_cc_parent FOREIGN KEY (parent_id, tenant_id) REFERENCES cost_centers (id, tenant_id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_centers FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON cost_centers;
CREATE POLICY tenant_isolation ON cost_centers USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON cost_centers TO erp_app;

-- ── recurring_journals ──
CREATE TABLE IF NOT EXISTS recurring_journals (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  template jsonb NOT NULL,
  schedule text NOT NULL,
  next_run_date date NOT NULL,
  last_run_at timestamptz,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','PAUSED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1,
  UNIQUE (id, tenant_id)
);
CREATE INDEX IF NOT EXISTS ix_recurring_tenant ON recurring_journals (tenant_id);
CREATE INDEX IF NOT EXISTS ix_recurring_next_run ON recurring_journals (tenant_id, next_run_date) WHERE status='ACTIVE';
ALTER TABLE recurring_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_journals FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON recurring_journals;
CREATE POLICY tenant_isolation ON recurring_journals USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON recurring_journals TO erp_app;

-- ── approval_policies ──
CREATE TABLE IF NOT EXISTS approval_policies (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  doc_type text NOT NULL,
  policy jsonb NOT NULL,
  applies_from date NOT NULL DEFAULT CURRENT_DATE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1,
  UNIQUE (id, tenant_id),
  UNIQUE (tenant_id, doc_type, applies_from)
);
CREATE INDEX IF NOT EXISTS ix_approval_policies_tenant ON approval_policies (tenant_id);
ALTER TABLE approval_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_policies FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON approval_policies;
CREATE POLICY tenant_isolation ON approval_policies USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON approval_policies TO erp_app;

-- ── numbering_sequences (per-tenant/branch/type, ADR-0006) ──
CREATE TABLE IF NOT EXISTS numbering_sequences (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id uuid,
  doc_type text NOT NULL,
  prefix text NOT NULL DEFAULT '',
  next_seq integer NOT NULL DEFAULT 1,
  format_template text NOT NULL DEFAULT '{prefix}{yyyy}-{seq:6}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id),
  UNIQUE (tenant_id, branch_id, doc_type)
);
CREATE INDEX IF NOT EXISTS ix_numbering_tenant ON numbering_sequences (tenant_id);
ALTER TABLE numbering_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE numbering_sequences FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON numbering_sequences;
CREATE POLICY tenant_isolation ON numbering_sequences USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON numbering_sequences TO erp_app;

-- ── approval_queue (manual journals, SoD) ──
CREATE TABLE IF NOT EXISTS approval_queue (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  doc_type text NOT NULL,
  doc_id uuid NOT NULL,
  amount numeric(19,4) NOT NULL DEFAULT 0,
  requester_id uuid,
  required_approvers jsonb,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  decided_by uuid,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id),
  UNIQUE (tenant_id, doc_type, doc_id)
);
CREATE INDEX IF NOT EXISTS ix_approval_queue_tenant ON approval_queue (tenant_id);
ALTER TABLE approval_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_queue FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON approval_queue;
CREATE POLICY tenant_isolation ON approval_queue USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON approval_queue TO erp_app;

-- ── opening_balance_docs (partner subledger proof RC-01/02 G-16) ──
CREATE TABLE IF NOT EXISTS opening_balance_docs (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  partner_id uuid, amount numeric(19,4) NOT NULL, batch_id uuid, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id)
);
ALTER TABLE opening_balance_docs ENABLE ROW LEVEL SECURITY; ALTER TABLE opening_balance_docs FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON opening_balance_docs; CREATE POLICY tenant_isolation ON opening_balance_docs USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON opening_balance_docs TO erp_app;

-- ── reconciliation_runs (framework for 013, AR/AP checks now) ──
CREATE TABLE IF NOT EXISTS reconciliation_runs (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  check_key text NOT NULL,
  status text NOT NULL CHECK (status IN ('PASSED','BROKEN')),
  details jsonb,
  run_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id)
);
CREATE INDEX IF NOT EXISTS ix_recon_tenant ON reconciliation_runs (tenant_id);
CREATE INDEX IF NOT EXISTS ix_recon_check ON reconciliation_runs (tenant_id, check_key, run_at DESC);
ALTER TABLE reconciliation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_runs FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON reconciliation_runs;
CREATE POLICY tenant_isolation ON reconciliation_runs USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON reconciliation_runs TO erp_app;
