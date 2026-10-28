-- 0006_partners_items.sql — Master data: partners, items, pricing, opening drafts
-- Forward-only additive. All tenant-owned tables RLS + composite tenant FKs + tenant-first indexes.
-- uoms: global+tenant (tenant_id nullable) for seeds; all others tenant_id NOT NULL.

-- pg_trgm for bilingual search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ── credit_terms ──
CREATE TABLE IF NOT EXISTS credit_terms (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  name_ar text,
  days integer NOT NULL DEFAULT 0 CHECK (days >= 0),
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1,
  UNIQUE (id, tenant_id),
  UNIQUE (tenant_id, code)
);
CREATE INDEX IF NOT EXISTS ix_credit_terms_tenant ON credit_terms (tenant_id);
ALTER TABLE credit_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_terms FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON credit_terms;
CREATE POLICY tenant_isolation ON credit_terms USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON credit_terms TO erp_app;

-- ── item_categories (bilingual tree) ──
CREATE TABLE IF NOT EXISTS item_categories (
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
CREATE INDEX IF NOT EXISTS ix_item_categories_tenant ON item_categories (tenant_id);
CREATE INDEX IF NOT EXISTS ix_item_categories_tenant_parent ON item_categories (tenant_id, parent_id);
DO $$ BEGIN
  ALTER TABLE item_categories ADD CONSTRAINT fk_item_categories_parent FOREIGN KEY (parent_id, tenant_id) REFERENCES item_categories (id, tenant_id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE item_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_categories FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON item_categories;
CREATE POLICY tenant_isolation ON item_categories USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON item_categories TO erp_app;

-- ── uoms (global seed + tenant extensible: tenant_id nullable) ──
CREATE TABLE IF NOT EXISTS uoms (
  id uuid PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  name_ar text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id),
  UNIQUE (code, tenant_id)
);
CREATE INDEX IF NOT EXISTS ix_uoms_tenant ON uoms (tenant_id);
-- RLS: readable global (NULL) + own, writable own only
ALTER TABLE uoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE uoms FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON uoms;
CREATE POLICY tenant_isolation ON uoms
  USING (tenant_id IS NULL OR tenant_id = erp.current_tenant_id())
  WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON uoms TO erp_app;

-- ── uom_conversions ──
CREATE TABLE IF NOT EXISTS uom_conversions (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  from_uom_id uuid NOT NULL,
  to_uom_id uuid NOT NULL,
  factor numeric(19,6) NOT NULL CHECK (factor > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id),
  UNIQUE (tenant_id, from_uom_id, to_uom_id)
);
CREATE INDEX IF NOT EXISTS ix_uom_conversions_tenant ON uom_conversions (tenant_id);
DO $$ BEGIN
  ALTER TABLE uom_conversions ADD CONSTRAINT fk_conv_from FOREIGN KEY (from_uom_id, tenant_id) REFERENCES uoms (id, tenant_id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE uom_conversions ADD CONSTRAINT fk_conv_to FOREIGN KEY (to_uom_id, tenant_id) REFERENCES uoms (id, tenant_id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE uom_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE uom_conversions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON uom_conversions;
CREATE POLICY tenant_isolation ON uom_conversions USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON uom_conversions TO erp_app;

-- ── price_lists ──
CREATE TABLE IF NOT EXISTS price_lists (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  name_ar text,
  currency char(3) NOT NULL DEFAULT 'SAR',
  kind text NOT NULL CHECK (kind IN ('SALE','PURCHASE')),
  valid_from date,
  valid_to date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1,
  UNIQUE (id, tenant_id),
  UNIQUE (tenant_id, code),
  CHECK (valid_from IS NULL OR valid_to IS NULL OR valid_from <= valid_to)
);
CREATE INDEX IF NOT EXISTS ix_price_lists_tenant ON price_lists (tenant_id);
CREATE INDEX IF NOT EXISTS ix_price_lists_tenant_kind ON price_lists (tenant_id, kind);
ALTER TABLE price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_lists FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON price_lists;
CREATE POLICY tenant_isolation ON price_lists USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON price_lists TO erp_app;

-- ── items ──
CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sku text NOT NULL,
  name text NOT NULL,
  name_ar text,
  kind text NOT NULL CHECK (kind IN ('STOCK','SERVICE','COMPOSITE')),
  uom_id uuid NOT NULL,
  category_id uuid,
  tax_code_id uuid, -- nullable, NO FK — deferred to PHASE-009 per MIGRATION_STRATEGY §3 (expand-migrate-contract)
  costing_method text NOT NULL DEFAULT 'WAC' CHECK (costing_method IN ('WAC','FIFO')),
  track_batch boolean NOT NULL DEFAULT false,
  track_serial boolean NOT NULL DEFAULT false,
  track_imei boolean NOT NULL DEFAULT false,
  has_expiry boolean NOT NULL DEFAULT false,
  reorder_level numeric(19,6),
  reorder_qty numeric(19,6),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','ARCHIVED')),
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1,
  UNIQUE (id, tenant_id),
  UNIQUE (tenant_id, sku)
);
CREATE INDEX IF NOT EXISTS ix_items_tenant ON items (tenant_id);
CREATE INDEX IF NOT EXISTS ix_items_tenant_category ON items (tenant_id, category_id);
CREATE INDEX IF NOT EXISTS ix_items_tenant_uom ON items (tenant_id, uom_id);
-- trigram for bilingual search
CREATE INDEX IF NOT EXISTS ix_items_name_trgm ON items USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS ix_items_name_ar_trgm ON items USING gin (name_ar gin_trgm_ops);
CREATE INDEX IF NOT EXISTS ix_items_sku_trgm ON items USING gin (sku gin_trgm_ops);
DO $$ BEGIN
  ALTER TABLE items ADD CONSTRAINT fk_items_uom FOREIGN KEY (uom_id, tenant_id) REFERENCES uoms (id, tenant_id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE items ADD CONSTRAINT fk_items_category FOREIGN KEY (category_id, tenant_id) REFERENCES item_categories (id, tenant_id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE items FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON items;
CREATE POLICY tenant_isolation ON items USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON items TO erp_app;
COMMENT ON COLUMN items.tax_code_id IS 'Deferred FK to tax_codes — no constraint until PHASE-009 (MIGRATION_STRATEGY expand-migrate-contract)';

-- ── barcodes ──
CREATE TABLE IF NOT EXISTS barcodes (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  item_id uuid NOT NULL,
  code text NOT NULL,
  uom_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id),
  UNIQUE (tenant_id, code)
);
CREATE INDEX IF NOT EXISTS ix_barcodes_tenant ON barcodes (tenant_id);
CREATE INDEX IF NOT EXISTS ix_barcodes_tenant_item ON barcodes (tenant_id, item_id);
CREATE INDEX IF NOT EXISTS ix_barcodes_code_trgm ON barcodes USING gin (code gin_trgm_ops);
DO $$ BEGIN
  ALTER TABLE barcodes ADD CONSTRAINT fk_barcodes_item FOREIGN KEY (item_id, tenant_id) REFERENCES items (id, tenant_id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE barcodes ADD CONSTRAINT fk_barcodes_uom FOREIGN KEY (uom_id, tenant_id) REFERENCES uoms (id, tenant_id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE barcodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE barcodes FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON barcodes;
CREATE POLICY tenant_isolation ON barcodes USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON barcodes TO erp_app;

-- ── price_list_items ──
CREATE TABLE IF NOT EXISTS price_list_items (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  price_list_id uuid NOT NULL,
  item_id uuid NOT NULL,
  uom_id uuid NOT NULL,
  unit_price numeric(19,6) NOT NULL CHECK (unit_price >= 0),
  min_qty numeric(19,6) NOT NULL DEFAULT 1 CHECK (min_qty > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id),
  UNIQUE (tenant_id, price_list_id, item_id, uom_id, min_qty)
);
CREATE INDEX IF NOT EXISTS ix_price_list_items_tenant ON price_list_items (tenant_id);
CREATE INDEX IF NOT EXISTS ix_price_list_items_list ON price_list_items (tenant_id, price_list_id);
CREATE INDEX IF NOT EXISTS ix_price_list_items_item ON price_list_items (tenant_id, item_id);
DO $$ BEGIN
  ALTER TABLE price_list_items ADD CONSTRAINT fk_pli_list FOREIGN KEY (price_list_id, tenant_id) REFERENCES price_lists (id, tenant_id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE price_list_items ADD CONSTRAINT fk_pli_item FOREIGN KEY (item_id, tenant_id) REFERENCES items (id, tenant_id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE price_list_items ADD CONSTRAINT fk_pli_uom FOREIGN KEY (uom_id, tenant_id) REFERENCES uoms (id, tenant_id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE price_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_list_items FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON price_list_items;
CREATE POLICY tenant_isolation ON price_list_items USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON price_list_items TO erp_app;

-- ── partners ──
CREATE TABLE IF NOT EXISTS partners (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('CUSTOMER','SUPPLIER','BOTH')),
  code text NOT NULL,
  name text NOT NULL,
  name_ar text,
  tax_number text,
  credit_limit numeric(19,4) DEFAULT 0,
  credit_terms_id uuid,
  price_list_id uuid,
  branch_id uuid,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','ARCHIVED')),
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1,
  UNIQUE (id, tenant_id),
  UNIQUE (tenant_id, code)
);
CREATE INDEX IF NOT EXISTS ix_partners_tenant ON partners (tenant_id);
CREATE INDEX IF NOT EXISTS ix_partners_tenant_kind ON partners (tenant_id, kind);
CREATE INDEX IF NOT EXISTS ix_partners_tenant_status ON partners (tenant_id, status);
CREATE INDEX IF NOT EXISTS ix_partners_name_trgm ON partners USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS ix_partners_name_ar_trgm ON partners USING gin (name_ar gin_trgm_ops);
CREATE INDEX IF NOT EXISTS ix_partners_code_trgm ON partners USING gin (code gin_trgm_ops);
DO $$ BEGIN
  ALTER TABLE partners ADD CONSTRAINT fk_partners_credit_terms FOREIGN KEY (credit_terms_id, tenant_id) REFERENCES credit_terms (id, tenant_id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE partners ADD CONSTRAINT fk_partners_price_list FOREIGN KEY (price_list_id, tenant_id) REFERENCES price_lists (id, tenant_id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON partners;
CREATE POLICY tenant_isolation ON partners USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON partners TO erp_app;

-- ── partner_contacts ──
CREATE TABLE IF NOT EXISTS partner_contacts (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL,
  name text NOT NULL,
  phone text,
  email text,
  role text,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id)
);
CREATE INDEX IF NOT EXISTS ix_partner_contacts_tenant ON partner_contacts (tenant_id);
CREATE INDEX IF NOT EXISTS ix_partner_contacts_partner ON partner_contacts (tenant_id, partner_id);
DO $$ BEGIN
  ALTER TABLE partner_contacts ADD CONSTRAINT fk_contacts_partner FOREIGN KEY (partner_id, tenant_id) REFERENCES partners (id, tenant_id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE partner_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_contacts FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON partner_contacts;
CREATE POLICY tenant_isolation ON partner_contacts USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON partner_contacts TO erp_app;

-- ── partner_addresses ──
CREATE TABLE IF NOT EXISTS partner_addresses (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('BILLING','SHIPPING','BOTH')),
  line1 text NOT NULL,
  line2 text,
  city text,
  region text,
  country_code char(2),
  postal_code text,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id)
);
CREATE INDEX IF NOT EXISTS ix_partner_addresses_tenant ON partner_addresses (tenant_id);
CREATE INDEX IF NOT EXISTS ix_partner_addresses_partner ON partner_addresses (tenant_id, partner_id);
DO $$ BEGIN
  ALTER TABLE partner_addresses ADD CONSTRAINT fk_addresses_partner FOREIGN KEY (partner_id, tenant_id) REFERENCES partners (id, tenant_id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE partner_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_addresses FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON partner_addresses;
CREATE POLICY tenant_isolation ON partner_addresses USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON partner_addresses TO erp_app;

-- ── opening_balance_docs (DRAFT only in 006) ──
CREATE TABLE IF NOT EXISTS opening_balance_docs (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('PARTNER','ACCOUNT','STOCK')),
  partner_id uuid,
  account_id uuid,
  item_id uuid,
  amount numeric(19,4) NOT NULL,
  currency char(3) NOT NULL DEFAULT 'SAR',
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','POSTED','VOIDED')),
  doc_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1,
  UNIQUE (id, tenant_id)
);
CREATE INDEX IF NOT EXISTS ix_opening_docs_tenant ON opening_balance_docs (tenant_id);
CREATE INDEX IF NOT EXISTS ix_opening_docs_kind ON opening_balance_docs (tenant_id, kind);
ALTER TABLE opening_balance_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE opening_balance_docs FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON opening_balance_docs;
CREATE POLICY tenant_isolation ON opening_balance_docs USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON opening_balance_docs TO erp_app;
COMMENT ON TABLE opening_balance_docs IS 'Opening balance DRAFT capture — no posting in PHASE-006; POSTED arrives in PHASE-007 (G-16)';

-- ── partner_balances read model (draft-aware) ──
CREATE TABLE IF NOT EXISTS partner_balances (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL,
  open_balance numeric(19,4) NOT NULL DEFAULT 0,
  overdue_amount numeric(19,4) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id),
  UNIQUE (tenant_id, partner_id)
);
CREATE INDEX IF NOT EXISTS ix_partner_balances_tenant ON partner_balances (tenant_id);
DO $$ BEGIN
  ALTER TABLE partner_balances ADD CONSTRAINT fk_balances_partner FOREIGN KEY (partner_id, tenant_id) REFERENCES partners (id, tenant_id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE partner_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_balances FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON partner_balances;
CREATE POLICY tenant_isolation ON partner_balances USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON partner_balances TO erp_app;
COMMENT ON TABLE partner_balances IS 'Read model over opening_balance_docs drafts in 006; maintained from journal in 007+';

-- ── Seed UoMs (global, tenant_id NULL) ──
INSERT INTO uoms (id, tenant_id, code, name, name_ar) VALUES
  ('00000000-0000-0000-0000-000000000101', NULL, 'PCS', 'Piece', 'قطعة'),
  ('00000000-0000-0000-0000-000000000102', NULL, 'KG', 'Kilogram', 'كيلوغرام'),
  ('00000000-0000-0000-0000-000000000103', NULL, 'M', 'Meter', 'متر'),
  ('00000000-0000-0000-0000-000000000104', NULL, 'L', 'Liter', 'لتر'),
  ('00000000-0000-0000-0000-000000000105', NULL, 'BOX', 'Box', 'صندوق'),
  ('00000000-0000-0000-0000-000000000106', NULL, 'SET', 'Set', 'طقم')
ON CONFLICT DO NOTHING;
