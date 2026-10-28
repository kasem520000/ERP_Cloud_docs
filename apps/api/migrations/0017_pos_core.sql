-- 0017_pos_core.sql — PHASE-016 Point of Sale core (scoped offline queue first consumer)
CREATE TABLE IF NOT EXISTS pos_terminals (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES branches(id),
  device_id uuid,
  code text NOT NULL,
  name text NOT NULL,
  cash_account_id uuid REFERENCES cash_accounts(id),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id),
  UNIQUE (tenant_id, code)
);
CREATE INDEX IF NOT EXISTS ix_pos_terminals_tenant ON pos_terminals (tenant_id, branch_id);
ALTER TABLE pos_terminals ENABLE ROW LEVEL SECURITY; ALTER TABLE pos_terminals FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON pos_terminals; CREATE POLICY tenant_isolation ON pos_terminals USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON pos_terminals TO erp_app;

CREATE TABLE IF NOT EXISTS pos_shifts (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  terminal_id uuid NOT NULL REFERENCES pos_terminals(id),
  cashier_user_id uuid NOT NULL,
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  opening_cash numeric(19,4) NOT NULL DEFAULT 0,
  closing_cash numeric(19,4),
  variance numeric(19,4),
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','CLOSED')),
  UNIQUE (id, tenant_id)
);
ALTER TABLE pos_shifts ENABLE ROW LEVEL SECURITY; ALTER TABLE pos_shifts FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON pos_shifts; CREATE POLICY tenant_isolation ON pos_shifts USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE ON pos_shifts TO erp_app;

CREATE TABLE IF NOT EXISTS pos_sales (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  terminal_id uuid NOT NULL REFERENCES pos_terminals(id),
  shift_id uuid REFERENCES pos_shifts(id),
  invoice_id uuid,
  total numeric(19,4) NOT NULL,
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','POSTED','VOIDED')),
  offline_id text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id)
);
ALTER TABLE pos_sales ENABLE ROW LEVEL SECURITY; ALTER TABLE pos_sales FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON pos_sales; CREATE POLICY tenant_isolation ON pos_sales USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE ON pos_sales TO erp_app;

-- Offline queue (scoped — POS sales only, first consumer)
CREATE TABLE IF NOT EXISTS pos_offline_queue (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  device_id uuid NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SYNCED','REJECTED')),
  attempts integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE pos_offline_queue ENABLE ROW LEVEL SECURITY; ALTER TABLE pos_offline_queue FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON pos_offline_queue; CREATE POLICY tenant_isolation ON pos_offline_queue USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE ON pos_offline_queue TO erp_app;
