-- 0012_purchasing_core.sql — Purchasing & Payables (PHASE-011)
-- purchase_requests, purchase_orders(+lines), goods_receipts(+lines), supplier_invoices(+lines), debit_notes, landed_costs

-- purchase_requests
CREATE TABLE IF NOT EXISTS purchase_requests (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL, requested_by uuid NOT NULL,
  pr_no text, status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','PENDING_APPROVAL','APPROVED','REJECTED','CANCELLED')),
  requested_at date NOT NULL DEFAULT CURRENT_DATE, notes text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), version integer NOT NULL DEFAULT 1,
  UNIQUE (id, tenant_id), UNIQUE (tenant_id, pr_no)
);
CREATE INDEX IF NOT EXISTS ix_pr_tenant_branch ON purchase_requests (tenant_id, branch_id);
ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY; ALTER TABLE purchase_requests FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON purchase_requests; CREATE POLICY tenant_isolation ON purchase_requests USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON purchase_requests TO erp_app;

CREATE TABLE IF NOT EXISTS purchase_request_lines (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  request_id uuid NOT NULL REFERENCES purchase_requests(id) ON DELETE CASCADE,
  item_id uuid NOT NULL, qty numeric(19,4) NOT NULL CHECK (qty > 0), unit_price numeric(19,4) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id)
);
ALTER TABLE purchase_request_lines ENABLE ROW LEVEL SECURITY; ALTER TABLE purchase_request_lines FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON purchase_request_lines; CREATE POLICY tenant_isolation ON purchase_request_lines USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON purchase_request_lines TO erp_app;

-- purchase_orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL, supplier_id uuid NOT NULL,
  order_no text, order_date date NOT NULL DEFAULT CURRENT_DATE, expected_date date,
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','PENDING_APPROVAL','APPROVED','ISSUED','CLOSED','CANCELLED')),
  subtotal numeric(19,4) NOT NULL DEFAULT 0, tax_amount numeric(19,4) NOT NULL DEFAULT 0, total numeric(19,4) NOT NULL DEFAULT 0,
  tax_summary jsonb, currency_code char(3) NOT NULL DEFAULT 'SAR', exchange_rate numeric(19,8) NOT NULL DEFAULT 1,
  revision_of uuid REFERENCES purchase_orders(id),
  posted_journal_id uuid, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), version integer NOT NULL DEFAULT 1,
  UNIQUE (id, tenant_id), UNIQUE (tenant_id, order_no)
);
CREATE INDEX IF NOT EXISTS ix_po_tenant_supplier ON purchase_orders (tenant_id, supplier_id);
CREATE INDEX IF NOT EXISTS ix_po_tenant_branch ON purchase_orders (tenant_id, branch_id);
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY; ALTER TABLE purchase_orders FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON purchase_orders; CREATE POLICY tenant_isolation ON purchase_orders USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON purchase_orders TO erp_app;

CREATE TABLE IF NOT EXISTS purchase_order_lines (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  item_id uuid NOT NULL, qty numeric(19,4) NOT NULL CHECK (qty > 0), unit_price numeric(19,4) NOT NULL CHECK (unit_price >= 0),
  line_amount numeric(19,4) NOT NULL, tax_code_id uuid, tax_snapshot jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id)
);
ALTER TABLE purchase_order_lines ENABLE ROW LEVEL SECURITY; ALTER TABLE purchase_order_lines FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON purchase_order_lines; CREATE POLICY tenant_isolation ON purchase_order_lines USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON purchase_order_lines TO erp_app;

-- goods_receipts — GRN posts to inventory + GRNI
CREATE TABLE IF NOT EXISTS goods_receipts (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  po_id uuid REFERENCES purchase_orders(id), warehouse_id uuid NOT NULL REFERENCES warehouses(id),
  receipt_no text, status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','POSTED','REVERSED','CANCELLED')),
  receipt_date date NOT NULL DEFAULT CURRENT_DATE, notes text,
  posted_journal_id uuid, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), version integer NOT NULL DEFAULT 1,
  UNIQUE (id, tenant_id), UNIQUE (tenant_id, receipt_no)
);
CREATE INDEX IF NOT EXISTS ix_grn_tenant_warehouse ON goods_receipts (tenant_id, warehouse_id);
ALTER TABLE goods_receipts ENABLE ROW LEVEL SECURITY; ALTER TABLE goods_receipts FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON goods_receipts; CREATE POLICY tenant_isolation ON goods_receipts USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON goods_receipts TO erp_app;

CREATE TABLE IF NOT EXISTS goods_receipt_lines (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  receipt_id uuid NOT NULL REFERENCES goods_receipts(id) ON DELETE CASCADE,
  item_id uuid NOT NULL, qty numeric(19,4) NOT NULL CHECK (qty > 0), unit_cost numeric(19,4) NOT NULL,
  line_amount numeric(19,4) NOT NULL, batch_id uuid, expiry_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id)
);
ALTER TABLE goods_receipt_lines ENABLE ROW LEVEL SECURITY; ALTER TABLE goods_receipt_lines FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON goods_receipt_lines; CREATE POLICY tenant_isolation ON goods_receipt_lines USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON goods_receipt_lines TO erp_app;

-- supplier_invoices — AP invoices clearing GRNI
CREATE TABLE IF NOT EXISTS supplier_invoices (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL, invoice_no text NOT NULL, internal_no text,
  po_id uuid REFERENCES purchase_orders(id), grn_id uuid REFERENCES goods_receipts(id),
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','PENDING_APPROVAL','APPROVED','POSTED','REVERSED','CANCELLED')),
  invoice_date date NOT NULL DEFAULT CURRENT_DATE, due_date date NOT NULL,
  subtotal numeric(19,4) NOT NULL DEFAULT 0, tax_amount numeric(19,4) NOT NULL DEFAULT 0, total numeric(19,4) NOT NULL DEFAULT 0,
  currency_code char(3) NOT NULL DEFAULT 'SAR', exchange_rate numeric(19,8) NOT NULL DEFAULT 1,
  match_result jsonb, tax_summary jsonb, posted_journal_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), version integer NOT NULL DEFAULT 1,
  UNIQUE (id, tenant_id), UNIQUE (tenant_id, internal_no)
);
CREATE INDEX IF NOT EXISTS ix_si_tenant_supplier ON supplier_invoices (tenant_id, supplier_id, invoice_no);
CREATE INDEX IF NOT EXISTS ix_si_tenant_due ON supplier_invoices (tenant_id, supplier_id, due_date);
ALTER TABLE supplier_invoices ENABLE ROW LEVEL SECURITY; ALTER TABLE supplier_invoices FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON supplier_invoices; CREATE POLICY tenant_isolation ON supplier_invoices USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON supplier_invoices TO erp_app;

CREATE TABLE IF NOT EXISTS supplier_invoice_lines (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES supplier_invoices(id) ON DELETE CASCADE,
  item_id uuid NOT NULL, qty numeric(19,4) NOT NULL CHECK (qty > 0), unit_price numeric(19,4) NOT NULL,
  line_amount numeric(19,4) NOT NULL, tax_code_id uuid, tax_snapshot jsonb,
  vat_recoverable numeric(19,4) NOT NULL DEFAULT 0, vat_expensed numeric(19,4) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id)
);
ALTER TABLE supplier_invoice_lines ENABLE ROW LEVEL SECURITY; ALTER TABLE supplier_invoice_lines FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON supplier_invoice_lines; CREATE POLICY tenant_isolation ON supplier_invoice_lines USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON supplier_invoice_lines TO erp_app;

-- debit_notes — AP corrections
CREATE TABLE IF NOT EXISTS debit_notes (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL, ref_invoice_id uuid NOT NULL REFERENCES supplier_invoices(id),
  debit_no text, status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','POSTED','REVERSED','CANCELLED')),
  debit_date date NOT NULL DEFAULT CURRENT_DATE, amount numeric(19,4) NOT NULL CHECK (amount > 0),
  tax_amount numeric(19,4) NOT NULL DEFAULT 0, total numeric(19,4) NOT NULL,
  match_result jsonb, tax_summary jsonb, posted_journal_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), version integer NOT NULL DEFAULT 1,
  UNIQUE (id, tenant_id), UNIQUE (tenant_id, debit_no)
);
ALTER TABLE debit_notes ENABLE ROW LEVEL SECURITY; ALTER TABLE debit_notes FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON debit_notes; CREATE POLICY tenant_isolation ON debit_notes USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON debit_notes TO erp_app;

-- landed_costs baseline (PHASE-011 baseline per INVENTORY_ACCOUNTING §3)
CREATE TABLE IF NOT EXISTS landed_costs (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  grn_id uuid NOT NULL REFERENCES goods_receipts(id),
  cost_type text NOT NULL CHECK (cost_type IN ('freight','customs','insurance','other')),
  amount numeric(19,4) NOT NULL CHECK (amount > 0), allocation_method text NOT NULL DEFAULT 'value' CHECK (allocation_method IN ('value','quantity')),
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','ALLOCATED','POSTED')),
  posted_journal_id uuid, created_at timestamptz NOT NULL DEFAULT now(), version integer NOT NULL DEFAULT 1,
  UNIQUE (id, tenant_id)
);
CREATE INDEX IF NOT EXISTS ix_landed_tenant_grn ON landed_costs (tenant_id, grn_id);
ALTER TABLE landed_costs ENABLE ROW LEVEL SECURITY; ALTER TABLE landed_costs FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON landed_costs; CREATE POLICY tenant_isolation ON landed_costs USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON landed_costs TO erp_app;

-- ap_allocations — explicit extension for AP (mirrors treasury_allocations but typed for purchasing)
CREATE TABLE IF NOT EXISTS ap_allocations (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  payment_id uuid NOT NULL REFERENCES payments(id), invoice_id uuid NOT NULL REFERENCES supplier_invoices(id),
  amount numeric(19,4) NOT NULL CHECK (amount > 0), created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id)
);
CREATE INDEX IF NOT EXISTS ix_ap_alloc_tenant_payment ON ap_allocations (tenant_id, payment_id);
ALTER TABLE ap_allocations ENABLE ROW LEVEL SECURITY; ALTER TABLE ap_allocations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON ap_allocations; CREATE POLICY tenant_isolation ON ap_allocations USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON ap_allocations TO erp_app;
