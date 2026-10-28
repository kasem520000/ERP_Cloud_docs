-- 0013_sales_core.sql — Sales & Receivables (PHASE-012)
-- quotations, sales_orders (+reservation), delivery_notes, sales_invoices(+lines), credit_notes, sales_reps (+ AR allocation extension)

-- quotations
CREATE TABLE IF NOT EXISTS quotations (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL, customer_id uuid NOT NULL,
  quote_no text, status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','SENT','ACCEPTED','REJECTED','EXPIRED')),
  quote_date date NOT NULL DEFAULT CURRENT_DATE, valid_until date NOT NULL,
  subtotal numeric(19,4) NOT NULL DEFAULT 0, tax_amount numeric(19,4) NOT NULL DEFAULT 0, total numeric(19,4) NOT NULL DEFAULT 0,
  tax_summary jsonb, currency_code char(3) NOT NULL DEFAULT 'SAR',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), version integer NOT NULL DEFAULT 1,
  UNIQUE (id, tenant_id), UNIQUE (tenant_id, quote_no)
);
CREATE INDEX IF NOT EXISTS ix_quote_tenant_customer ON quotations (tenant_id, customer_id);
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY; ALTER TABLE quotations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON quotations; CREATE POLICY tenant_isolation ON quotations USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON quotations TO erp_app;

CREATE TABLE IF NOT EXISTS quotation_lines (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  quote_id uuid NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  item_id uuid NOT NULL, qty numeric(19,4) NOT NULL CHECK (qty > 0), unit_price numeric(19,4) NOT NULL,
  discount_rate numeric(5,4) NOT NULL DEFAULT 0, tax_code_id uuid, tax_snapshot jsonb, line_amount numeric(19,4) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id)
);
ALTER TABLE quotation_lines ENABLE ROW LEVEL SECURITY; ALTER TABLE quotation_lines FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON quotation_lines; CREATE POLICY tenant_isolation ON quotation_lines USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON quotation_lines TO erp_app;

-- sales_orders with soft reservation reference
CREATE TABLE IF NOT EXISTS sales_orders (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL, customer_id uuid NOT NULL, warehouse_id uuid NOT NULL,
  order_no text, status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','APPROVED','DELIVERED','INVOICED','CANCELLED')),
  order_date date NOT NULL DEFAULT CURRENT_DATE, subtotal numeric(19,4) NOT NULL DEFAULT 0, tax_amount numeric(19,4) NOT NULL DEFAULT 0, total numeric(19,4) NOT NULL DEFAULT 0,
  tax_summary jsonb, rep_id uuid,
  reservation_expires_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), version integer NOT NULL DEFAULT 1,
  UNIQUE (id, tenant_id), UNIQUE (tenant_id, order_no)
);
CREATE INDEX IF NOT EXISTS ix_so_tenant_customer ON sales_orders (tenant_id, customer_id);
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY; ALTER TABLE sales_orders FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON sales_orders; CREATE POLICY tenant_isolation ON sales_orders USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON sales_orders TO erp_app;

CREATE TABLE IF NOT EXISTS sales_order_lines (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  item_id uuid NOT NULL, qty numeric(19,4) NOT NULL CHECK (qty > 0), unit_price numeric(19,4) NOT NULL, discount_rate numeric(5,4) NOT NULL DEFAULT 0,
  line_amount numeric(19,4) NOT NULL, tax_code_id uuid, tax_snapshot jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id)
);
ALTER TABLE sales_order_lines ENABLE ROW LEVEL SECURITY; ALTER TABLE sales_order_lines FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON sales_order_lines; CREATE POLICY tenant_isolation ON sales_order_lines USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON sales_order_lines TO erp_app;

-- delivery_notes — issue stock + COGS
CREATE TABLE IF NOT EXISTS delivery_notes (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id uuid REFERENCES sales_orders(id), customer_id uuid NOT NULL, warehouse_id uuid NOT NULL REFERENCES warehouses(id),
  delivery_no text, status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','POSTED','CANCELLED')),
  delivery_date date NOT NULL DEFAULT CURRENT_DATE, posted_journal_id uuid, cogs_journal_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), version integer NOT NULL DEFAULT 1,
  UNIQUE (id, tenant_id), UNIQUE (tenant_id, delivery_no)
);
CREATE INDEX IF NOT EXISTS ix_dn_tenant_warehouse ON delivery_notes (tenant_id, warehouse_id);
ALTER TABLE delivery_notes ENABLE ROW LEVEL SECURITY; ALTER TABLE delivery_notes FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON delivery_notes; CREATE POLICY tenant_isolation ON delivery_notes USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON delivery_notes TO erp_app;

CREATE TABLE IF NOT EXISTS delivery_note_lines (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  delivery_id uuid NOT NULL REFERENCES delivery_notes(id) ON DELETE CASCADE,
  item_id uuid NOT NULL, qty numeric(19,4) NOT NULL CHECK (qty > 0), unit_cost numeric(19,6) NOT NULL, cogs_amount numeric(19,4) NOT NULL,
  batch_id uuid, serial_id uuid, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id)
);
ALTER TABLE delivery_note_lines ENABLE ROW LEVEL SECURITY; ALTER TABLE delivery_note_lines FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON delivery_note_lines; CREATE POLICY tenant_isolation ON delivery_note_lines USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON delivery_note_lines TO erp_app;

-- sales_invoices — AR invoices
CREATE TABLE IF NOT EXISTS sales_invoices (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL, customer_id uuid NOT NULL, order_id uuid REFERENCES sales_orders(id), delivery_id uuid REFERENCES delivery_notes(id),
  invoice_no text, offline_receipt_no text, -- POS yes reserved for PHASE-016
  invoice_date date NOT NULL DEFAULT CURRENT_DATE, due_date date NOT NULL,
  kind text NOT NULL DEFAULT 'CREDIT' CHECK (kind IN ('CREDIT','CASH')),
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','APPROVED','POSTED','REVERSED','CANCELLED')),
  currency_code char(3) NOT NULL DEFAULT 'SAR', exchange_rate numeric(19,8) NOT NULL DEFAULT 1,
  subtotal numeric(19,4) NOT NULL DEFAULT 0, tax_amount numeric(19,4) NOT NULL DEFAULT 0, total numeric(19,4) NOT NULL DEFAULT 0,
  tax_summary jsonb, rep_id uuid, einvoice_status text DEFAULT 'PENDING',
  posted_journal_id uuid, cogs_posted_journal_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), version integer NOT NULL DEFAULT 1,
  UNIQUE (id, tenant_id), UNIQUE (tenant_id, invoice_no), UNIQUE (tenant_id, branch_id, invoice_no)
);
CREATE INDEX IF NOT EXISTS ix_si_tenant_customer ON sales_invoices (tenant_id, customer_id, due_date);
CREATE INDEX IF NOT EXISTS ix_si_tenant_branch_no ON sales_invoices (tenant_id, branch_id, invoice_no);
ALTER TABLE sales_invoices ENABLE ROW LEVEL SECURITY; ALTER TABLE sales_invoices FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON sales_invoices; CREATE POLICY tenant_isolation ON sales_invoices USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON sales_invoices TO erp_app;

CREATE TABLE IF NOT EXISTS sales_invoice_lines (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
  item_id uuid NOT NULL, qty numeric(19,4) NOT NULL CHECK (qty > 0), uom_id uuid, unit_price numeric(19,4) NOT NULL,
  discount_rate numeric(5,4) NOT NULL DEFAULT 0, line_amount numeric(19,4) NOT NULL,
  tax_code_id uuid, tax_snapshot jsonb, original_cost numeric(19,6),
  batch_id uuid, serial_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id)
);
ALTER TABLE sales_invoice_lines ENABLE ROW LEVEL SECURITY; ALTER TABLE sales_invoice_lines FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON sales_invoice_lines; CREATE POLICY tenant_isolation ON sales_invoice_lines USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON sales_invoice_lines TO erp_app;

-- credit_notes — returns at original cost
CREATE TABLE IF NOT EXISTS credit_notes (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL, ref_invoice_id uuid NOT NULL REFERENCES sales_invoices(id),
  credit_no text, status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','POSTED','REVERSED','CANCELLED')),
  credit_date date NOT NULL DEFAULT CURRENT_DATE, return_window_days integer NOT NULL DEFAULT 14,
  amount numeric(19,4) NOT NULL CHECK (amount > 0), tax_amount numeric(19,4) NOT NULL DEFAULT 0, total numeric(19,4) NOT NULL,
  return_stock boolean NOT NULL DEFAULT false, posted_journal_id uuid, cogs_journal_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), version integer NOT NULL DEFAULT 1,
  UNIQUE (id, tenant_id), UNIQUE (tenant_id, credit_no)
);
ALTER TABLE credit_notes ENABLE ROW LEVEL SECURITY; ALTER TABLE credit_notes FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON credit_notes; CREATE POLICY tenant_isolation ON credit_notes USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON credit_notes TO erp_app;

CREATE TABLE IF NOT EXISTS credit_note_lines (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  credit_id uuid NOT NULL REFERENCES credit_notes(id) ON DELETE CASCADE,
  item_id uuid NOT NULL, qty numeric(19,4) NOT NULL CHECK (qty > 0), unit_price numeric(19,4) NOT NULL,
  original_cost numeric(19,6), batch_id uuid, serial_id uuid, line_amount numeric(19,4) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id)
);
ALTER TABLE credit_note_lines ENABLE ROW LEVEL SECURITY; ALTER TABLE credit_note_lines FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON credit_note_lines; CREATE POLICY tenant_isolation ON credit_note_lines USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON credit_note_lines TO erp_app;

-- sales_reps attribution
CREATE TABLE IF NOT EXISTS sales_reps (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL, code text NOT NULL, name text NOT NULL, commission_rate numeric(5,4) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), version integer NOT NULL DEFAULT 1,
  UNIQUE (id, tenant_id), UNIQUE (tenant_id, code)
);
ALTER TABLE sales_reps ENABLE ROW LEVEL SECURITY; ALTER TABLE sales_reps FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON sales_reps; CREATE POLICY tenant_isolation ON sales_reps USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON sales_reps TO erp_app;

-- ar_allocations — explicit receipt↔invoice allocations (mirrors ap_allocations)
CREATE TABLE IF NOT EXISTS ar_allocations (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  receipt_id uuid NOT NULL REFERENCES receipts(id), invoice_id uuid NOT NULL REFERENCES sales_invoices(id),
  amount numeric(19,4) NOT NULL CHECK (amount > 0), created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id)
);
CREATE INDEX IF NOT EXISTS ix_ar_alloc_tenant_receipt ON ar_allocations (tenant_id, receipt_id);
ALTER TABLE ar_allocations ENABLE ROW LEVEL SECURITY; ALTER TABLE ar_allocations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON ar_allocations; CREATE POLICY tenant_isolation ON ar_allocations USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON ar_allocations TO erp_app;
