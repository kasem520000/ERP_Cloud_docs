-- 0009_treasury.sql — Treasury accounts, movements, receipts/payments, expenses, transfers, shifts, bank statements
-- Additive; RLS + composite FKs + tenant-first indexes + append-only grants

-- cash_accounts
CREATE TABLE IF NOT EXISTS cash_accounts (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code text NOT NULL, name text NOT NULL, name_ar text,
  type text NOT NULL CHECK (type IN ('CASH','BANK','PETTY')),
  account_id uuid NOT NULL, -- FK to accounts(id,tenant_id) — logical, enforced via service (composite FK via UNIQUE(id,tenant_id) in accounts)
  branch_id uuid, currency_code char(3) NOT NULL DEFAULT 'SAR',
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','CLOSED')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), version integer NOT NULL DEFAULT 1,
  UNIQUE (id, tenant_id), UNIQUE (tenant_id, code)
);
CREATE INDEX IF NOT EXISTS ix_cash_accounts_tenant ON cash_accounts (tenant_id);
ALTER TABLE cash_accounts ENABLE ROW LEVEL SECURITY; ALTER TABLE cash_accounts FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON cash_accounts; CREATE POLICY tenant_isolation ON cash_accounts USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON cash_accounts TO erp_app;

-- cash_movements append-only
CREATE TABLE IF NOT EXISTS cash_movements (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  cash_account_id uuid NOT NULL, direction text NOT NULL CHECK (direction IN ('IN','OUT')),
  amount numeric(19,4) NOT NULL CHECK (amount > 0), currency_code char(3) NOT NULL,
  source_type text NOT NULL, source_id uuid NOT NULL, value_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id)
);
CREATE INDEX IF NOT EXISTS ix_cash_movements_tenant_account ON cash_movements (tenant_id, cash_account_id, value_date);
CREATE INDEX IF NOT EXISTS ix_cash_movements_source ON cash_movements (tenant_id, source_type, source_id);
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY; ALTER TABLE cash_movements FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON cash_movements; CREATE POLICY tenant_isolation ON cash_movements USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT ON cash_movements TO erp_app; REVOKE UPDATE, DELETE ON cash_movements FROM erp_app;
-- immutability trigger
CREATE OR REPLACE FUNCTION erp.treasury_cm_immutable() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'INV-019: cash_movements immutable'; RETURN NULL; END $$;
DROP TRIGGER IF EXISTS trg_cm_immutable ON cash_movements; CREATE TRIGGER trg_cm_immutable BEFORE UPDATE OR DELETE ON cash_movements FOR EACH ROW EXECUTE FUNCTION erp.treasury_cm_immutable();

-- receipts
CREATE TABLE IF NOT EXISTS receipts (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  receipt_no text, cash_account_id uuid NOT NULL REFERENCES cash_accounts(id),
  partner_id uuid, amount numeric(19,4) NOT NULL CHECK (amount > 0), currency_code char(3) NOT NULL DEFAULT 'SAR',
  exchange_rate numeric(19,8) NOT NULL DEFAULT 1 CHECK (exchange_rate > 0),
  method text NOT NULL DEFAULT 'CASH' CHECK (method IN ('CASH','BANK','CHEQUE')),
  value_date date NOT NULL, description text, status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','POSTED','REVERSED')),
  posted_journal_id uuid, posted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), version integer NOT NULL DEFAULT 1,
  UNIQUE (id, tenant_id), UNIQUE (tenant_id, receipt_no)
);
CREATE INDEX IF NOT EXISTS ix_receipts_tenant ON receipts (tenant_id);
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY; ALTER TABLE receipts FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON receipts; CREATE POLICY tenant_isolation ON receipts USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON receipts TO erp_app;

-- payments
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  payment_no text, cash_account_id uuid NOT NULL REFERENCES cash_accounts(id),
  partner_id uuid, amount numeric(19,4) NOT NULL CHECK (amount > 0), currency_code char(3) NOT NULL DEFAULT 'SAR',
  exchange_rate numeric(19,8) NOT NULL DEFAULT 1 CHECK (exchange_rate > 0),
  method text NOT NULL DEFAULT 'CASH', value_date date NOT NULL, description text,
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','POSTED','REVERSED')),
  posted_journal_id uuid, posted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), version integer NOT NULL DEFAULT 1,
  UNIQUE (id, tenant_id), UNIQUE (tenant_id, payment_no)
);
CREATE INDEX IF NOT EXISTS ix_payments_tenant ON payments (tenant_id);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY; ALTER TABLE payments FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON payments; CREATE POLICY tenant_isolation ON payments USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON payments TO erp_app;

-- allocations (receipt/payment -> open items)
CREATE TABLE IF NOT EXISTS treasury_allocations (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  source_type text NOT NULL CHECK (source_type IN ('receipt','payment')),
  source_id uuid NOT NULL, open_item_id uuid NOT NULL, amount numeric(19,4) NOT NULL CHECK (amount > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id)
);
CREATE INDEX IF NOT EXISTS ix_alloc_tenant_source ON treasury_allocations (tenant_id, source_type, source_id);
ALTER TABLE treasury_allocations ENABLE ROW LEVEL SECURITY; ALTER TABLE treasury_allocations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON treasury_allocations; CREATE POLICY tenant_isolation ON treasury_allocations USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON treasury_allocations TO erp_app;

-- expense_categories
CREATE TABLE IF NOT EXISTS expense_categories (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code text NOT NULL, name text NOT NULL, name_ar text,
  account_id uuid NOT NULL, approval_policy text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), version integer NOT NULL DEFAULT 1,
  UNIQUE (id, tenant_id), UNIQUE (tenant_id, code)
);
CREATE INDEX IF NOT EXISTS ix_exp_cat_tenant ON expense_categories (tenant_id);
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY; ALTER TABLE expense_categories FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON expense_categories; CREATE POLICY tenant_isolation ON expense_categories USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON expense_categories TO erp_app;

-- expenses
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  expense_no text, category_id uuid NOT NULL REFERENCES expense_categories(id),
  cash_account_id uuid NOT NULL REFERENCES cash_accounts(id),
  amount numeric(19,4) NOT NULL CHECK (amount > 0), tax_code_id uuid, description text,
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','PENDING_APPROVAL','APPROVED','POSTED','REVERSED')),
  receipt_file_id uuid, posted_journal_id uuid, posted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), version integer NOT NULL DEFAULT 1,
  UNIQUE (id, tenant_id)
);
CREATE INDEX IF NOT EXISTS ix_expenses_tenant ON expenses (tenant_id);
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY; ALTER TABLE expenses FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON expenses; CREATE POLICY tenant_isolation ON expenses USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON expenses TO erp_app;

-- cash_transfers
CREATE TABLE IF NOT EXISTS cash_transfers (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  transfer_no text, from_account_id uuid NOT NULL REFERENCES cash_accounts(id), to_account_id uuid NOT NULL REFERENCES cash_accounts(id),
  amount numeric(19,4) NOT NULL CHECK (amount > 0), fee_amount numeric(19,4) NOT NULL DEFAULT 0 CHECK (fee_amount >= 0),
  value_date date NOT NULL, description text,
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','POSTED','REVERSED')),
  posted_journal_id uuid, posted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), version integer NOT NULL DEFAULT 1,
  UNIQUE (id, tenant_id)
);
CREATE INDEX IF NOT EXISTS ix_transfers_tenant ON cash_transfers (tenant_id);
ALTER TABLE cash_transfers ENABLE ROW LEVEL SECURITY; ALTER TABLE cash_transfers FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON cash_transfers; CREATE POLICY tenant_isolation ON cash_transfers USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON cash_transfers TO erp_app;

-- cashier_shifts
CREATE TABLE IF NOT EXISTS cashier_shifts (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  cash_account_id uuid NOT NULL REFERENCES cash_accounts(id),
  user_id uuid, opening_float numeric(19,4) NOT NULL DEFAULT 0,
  expected_amount numeric(19,4), counted_amount numeric(19,4), variance numeric(19,4),
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','CLOSED')),
  opened_at timestamptz NOT NULL DEFAULT now(), closed_at timestamptz,
  variance_posted_journal_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(), version integer NOT NULL DEFAULT 1,
  UNIQUE (id, tenant_id)
);
CREATE INDEX IF NOT EXISTS ix_shifts_tenant ON cashier_shifts (tenant_id);
ALTER TABLE cashier_shifts ENABLE ROW LEVEL SECURITY; ALTER TABLE cashier_shifts FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON cashier_shifts; CREATE POLICY tenant_isolation ON cashier_shifts USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON cashier_shifts TO erp_app;

-- bank_statements
CREATE TABLE IF NOT EXISTS bank_statements (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  cash_account_id uuid NOT NULL REFERENCES cash_accounts(id),
  period_start date NOT NULL, period_end date NOT NULL,
  file_hash text NOT NULL, file_name text, status text NOT NULL DEFAULT 'IMPORTED' CHECK (status IN ('IMPORTED','MATCHED','RECONCILED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, file_hash), UNIQUE (id, tenant_id)
);
CREATE INDEX IF NOT EXISTS ix_bank_stmt_tenant ON bank_statements (tenant_id);
ALTER TABLE bank_statements ENABLE ROW LEVEL SECURITY; ALTER TABLE bank_statements FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON bank_statements; CREATE POLICY tenant_isolation ON bank_statements USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON bank_statements TO erp_app;

-- bank_statement_lines
CREATE TABLE IF NOT EXISTS bank_statement_lines (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  statement_id uuid NOT NULL REFERENCES bank_statements(id) ON DELETE CASCADE,
  value_date date NOT NULL, amount numeric(19,4) NOT NULL, reference text, description text,
  matched_movement_id uuid, matched_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id)
);
CREATE INDEX IF NOT EXISTS ix_stmt_lines_tenant ON bank_statement_lines (tenant_id, statement_id);
ALTER TABLE bank_statement_lines ENABLE ROW LEVEL SECURITY; ALTER TABLE bank_statement_lines FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON bank_statement_lines; CREATE POLICY tenant_isolation ON bank_statement_lines USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON bank_statement_lines TO erp_app;
