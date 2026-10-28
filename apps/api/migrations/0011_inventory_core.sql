-- 0011_inventory_core.sql — Inventory & Warehousing (PHASE-010)
-- Warehouses, item_warehouse_settings, stock_moves append-only, stock_layers, item_stock, transfers, counts, batches, serials, reservations

-- warehouses
CREATE TABLE IF NOT EXISTS warehouses (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL, code text NOT NULL, name text NOT NULL, name_ar text, is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), version integer NOT NULL DEFAULT 1,
  UNIQUE (id, tenant_id), UNIQUE (tenant_id, code)
);
CREATE INDEX IF NOT EXISTS ix_warehouses_tenant ON warehouses (tenant_id);
CREATE INDEX IF NOT EXISTS ix_warehouses_branch ON warehouses (tenant_id, branch_id);
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY; ALTER TABLE warehouses FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON warehouses; CREATE POLICY tenant_isolation ON warehouses USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON warehouses TO erp_app;

-- item_warehouse_settings
CREATE TABLE IF NOT EXISTS item_warehouse_settings (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  item_id uuid NOT NULL, warehouse_id uuid NOT NULL REFERENCES warehouses(id),
  reorder_level numeric(19,4) NOT NULL DEFAULT 0, min_qty numeric(19,4) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), version integer NOT NULL DEFAULT 1,
  UNIQUE (id, tenant_id), UNIQUE (tenant_id, item_id, warehouse_id)
);
CREATE INDEX IF NOT EXISTS ix_iws_tenant_item ON item_warehouse_settings (tenant_id, item_id);
ALTER TABLE item_warehouse_settings ENABLE ROW LEVEL SECURITY; ALTER TABLE item_warehouse_settings FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON item_warehouse_settings; CREATE POLICY tenant_isolation ON item_warehouse_settings USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON item_warehouse_settings TO erp_app;

-- stock_moves append-only
CREATE TABLE IF NOT EXISTS stock_moves (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  item_id uuid NOT NULL, warehouse_id uuid NOT NULL REFERENCES warehouses(id),
  direction text NOT NULL CHECK (direction IN ('IN','OUT')),
  move_kind text NOT NULL CHECK (move_kind IN ('receipt','issue','transfer_in','transfer_out','adjust','opening')),
  qty numeric(19,4) NOT NULL CHECK (qty != 0),
  unit_cost numeric(19,6) NOT NULL, value_amount numeric(19,4) NOT NULL,
  batch_id uuid, serial_id uuid,
  source_type text NOT NULL, source_id uuid NOT NULL, moved_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id)
);
CREATE INDEX IF NOT EXISTS ix_stock_moves_tenant_item_wh ON stock_moves (tenant_id, item_id, warehouse_id, moved_at);
CREATE INDEX IF NOT EXISTS ix_stock_moves_source ON stock_moves (tenant_id, source_type, source_id);
ALTER TABLE stock_moves ENABLE ROW LEVEL SECURITY; ALTER TABLE stock_moves FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON stock_moves; CREATE POLICY tenant_isolation ON stock_moves USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT ON stock_moves TO erp_app; REVOKE UPDATE, DELETE ON stock_moves FROM erp_app;
CREATE OR REPLACE FUNCTION erp.stock_moves_immutable() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'INV-018: stock_moves immutable'; RETURN NULL; END $$;
DROP TRIGGER IF EXISTS trg_stock_moves_immutable ON stock_moves; CREATE TRIGGER trg_stock_moves_immutable BEFORE UPDATE OR DELETE ON stock_moves FOR EACH ROW EXECUTE FUNCTION erp.stock_moves_immutable();

-- stock_layers (FIFO)
CREATE TABLE IF NOT EXISTS stock_layers (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  item_id uuid NOT NULL, warehouse_id uuid NOT NULL REFERENCES warehouses(id),
  qty numeric(19,4) NOT NULL, unit_cost numeric(19,6) NOT NULL, remaining_qty numeric(19,4) NOT NULL,
  source_move_id uuid NOT NULL REFERENCES stock_moves(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id)
);
CREATE INDEX IF NOT EXISTS ix_stock_layers_tenant_item ON stock_layers (tenant_id, item_id, warehouse_id, created_at);
ALTER TABLE stock_layers ENABLE ROW LEVEL SECURITY; ALTER TABLE stock_layers FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON stock_layers; CREATE POLICY tenant_isolation ON stock_layers USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON stock_layers TO erp_app;

-- item_stock read model
CREATE TABLE IF NOT EXISTS item_stock (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  item_id uuid NOT NULL, warehouse_id uuid NOT NULL REFERENCES warehouses(id),
  qty numeric(19,4) NOT NULL DEFAULT 0, avg_cost numeric(19,6) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id), UNIQUE (tenant_id, item_id, warehouse_id)
);
CREATE INDEX IF NOT EXISTS ix_item_stock_tenant_item ON item_stock (tenant_id, item_id);
ALTER TABLE item_stock ENABLE ROW LEVEL SECURITY; ALTER TABLE item_stock FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON item_stock; CREATE POLICY tenant_isolation ON item_stock USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON item_stock TO erp_app;

-- item_batches
CREATE TABLE IF NOT EXISTS item_batches (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  item_id uuid NOT NULL, batch_no text NOT NULL, expiry_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id), UNIQUE (tenant_id, item_id, batch_no)
);
CREATE INDEX IF NOT EXISTS ix_batches_tenant_item ON item_batches (tenant_id, item_id);
ALTER TABLE item_batches ENABLE ROW LEVEL SECURITY; ALTER TABLE item_batches FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON item_batches; CREATE POLICY tenant_isolation ON item_batches USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON item_batches TO erp_app;

-- item_serials
CREATE TABLE IF NOT EXISTS item_serials (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  item_id uuid NOT NULL, serial_no text NOT NULL, imei text,
  batch_id uuid REFERENCES item_batches(id),
  status text NOT NULL DEFAULT 'in_stock' CHECK (status IN ('in_stock','sold','returned')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id), UNIQUE (tenant_id, item_id, serial_no)
);
CREATE INDEX IF NOT EXISTS ix_serials_tenant_item ON item_serials (tenant_id, item_id);
ALTER TABLE item_serials ENABLE ROW LEVEL SECURITY; ALTER TABLE item_serials FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON item_serials; CREATE POLICY tenant_isolation ON item_serials USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON item_serials TO erp_app;

-- stock_transfers
CREATE TABLE IF NOT EXISTS stock_transfers (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  transfer_no text, from_warehouse_id uuid NOT NULL REFERENCES warehouses(id), to_warehouse_id uuid NOT NULL REFERENCES warehouses(id),
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','IN_TRANSIT','POSTED')),
  posted_journal_id uuid, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), version integer NOT NULL DEFAULT 1,
  UNIQUE (id, tenant_id), UNIQUE (tenant_id, transfer_no)
);
CREATE INDEX IF NOT EXISTS ix_transfers_tenant ON stock_transfers (tenant_id);
ALTER TABLE stock_transfers ENABLE ROW LEVEL SECURITY; ALTER TABLE stock_transfers FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON stock_transfers; CREATE POLICY tenant_isolation ON stock_transfers USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON stock_transfers TO erp_app;

CREATE TABLE IF NOT EXISTS stock_transfer_lines (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  transfer_id uuid NOT NULL REFERENCES stock_transfers(id) ON DELETE CASCADE,
  item_id uuid NOT NULL, qty numeric(19,4) NOT NULL CHECK (qty > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id)
);
ALTER TABLE stock_transfer_lines ENABLE ROW LEVEL SECURITY; ALTER TABLE stock_transfer_lines FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON stock_transfer_lines; CREATE POLICY tenant_isolation ON stock_transfer_lines USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON stock_transfer_lines TO erp_app;

-- stock_counts
CREATE TABLE IF NOT EXISTS stock_counts (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  warehouse_id uuid NOT NULL REFERENCES warehouses(id),
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','COUNTED','VARIANCE_REVIEW','POSTED')),
  is_blind boolean NOT NULL DEFAULT false, snapshot_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), version integer NOT NULL DEFAULT 1,
  UNIQUE (id, tenant_id)
);
CREATE INDEX IF NOT EXISTS ix_counts_tenant ON stock_counts (tenant_id);
ALTER TABLE stock_counts ENABLE ROW LEVEL SECURITY; ALTER TABLE stock_counts FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON stock_counts; CREATE POLICY tenant_isolation ON stock_counts USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON stock_counts TO erp_app;

CREATE TABLE IF NOT EXISTS stock_count_lines (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  count_id uuid NOT NULL REFERENCES stock_counts(id) ON DELETE CASCADE,
  item_id uuid NOT NULL, system_qty numeric(19,4) NOT NULL, counted_qty numeric(19,4),
  variance_qty numeric(19,4), reason text CHECK (reason IN ('COUNT_LOSS','COUNT_GAIN','EXPIRED','DAMAGE')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id)
);
ALTER TABLE stock_count_lines ENABLE ROW LEVEL SECURITY; ALTER TABLE stock_count_lines FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON stock_count_lines; CREATE POLICY tenant_isolation ON stock_count_lines USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON stock_count_lines TO erp_app;

-- stock_reservations (soft)
CREATE TABLE IF NOT EXISTS stock_reservations (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  item_id uuid NOT NULL, warehouse_id uuid NOT NULL REFERENCES warehouses(id),
  qty numeric(19,4) NOT NULL CHECK (qty > 0),
  holder_type text NOT NULL, holder_id uuid NOT NULL, expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','EXPIRED','RELEASED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id)
);
CREATE INDEX IF NOT EXISTS ix_reservations_tenant_item ON stock_reservations (tenant_id, item_id, warehouse_id);
ALTER TABLE stock_reservations ENABLE ROW LEVEL SECURITY; ALTER TABLE stock_reservations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON stock_reservations; CREATE POLICY tenant_isolation ON stock_reservations USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON stock_reservations TO erp_app;
