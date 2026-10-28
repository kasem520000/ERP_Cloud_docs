-- 0016_industry_registry.sql — PHASE-015 Industry Configuration Framework
-- Additive only. Ten-layer config engine registry + tenant applied state + supporting features.

CREATE TABLE IF NOT EXISTS industry_templates (
  id uuid PRIMARY KEY,
  key text NOT NULL UNIQUE CHECK (key ~ '^industry\.[a-z_]+$'),
  name text NOT NULL,
  name_ar text NOT NULL,
  version text NOT NULL CHECK (version ~ '^[0-9]+\.[0-9]+\.[0-9]+$'),
  manifest jsonb NOT NULL,
  manifest_hash text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','DEPRECATED','ARCHIVED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON industry_templates TO erp_app;

CREATE TABLE IF NOT EXISTS tenant_industry_config (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  template_key text NOT NULL REFERENCES industry_templates(key),
  applied_version text NOT NULL,
  applied_manifest_hash text NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now(),
  overrides jsonb NOT NULL DEFAULT '{}'::jsonb,
  archived_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  UNIQUE (id, tenant_id),
  UNIQUE (tenant_id, template_key)
);
CREATE INDEX IF NOT EXISTS ix_tic_tenant ON tenant_industry_config (tenant_id);
ALTER TABLE tenant_industry_config ENABLE ROW LEVEL SECURITY; ALTER TABLE tenant_industry_config FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tenant_industry_config; CREATE POLICY tenant_isolation ON tenant_industry_config USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON tenant_industry_config TO erp_app;

CREATE TABLE IF NOT EXISTS feature_flags (
  id uuid PRIMARY KEY,
  key text NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT false,
  rollout jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON feature_flags TO erp_app;

CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  kind text NOT NULL,
  channel text NOT NULL DEFAULT 'in_app' CHECK (channel IN ('in_app','email','none')),
  enabled boolean NOT NULL DEFAULT true,
  UNIQUE (id, tenant_id),
  UNIQUE (tenant_id, user_id, kind)
);
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY; ALTER TABLE notification_preferences FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON notification_preferences; CREATE POLICY tenant_isolation ON notification_preferences USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON notification_preferences TO erp_app;

-- Supporting: composite products (T9) — definition table
CREATE TABLE IF NOT EXISTS composite_definitions (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  parent_item_id uuid NOT NULL,
  component_item_id uuid NOT NULL,
  qty numeric(19,4) NOT NULL CHECK (qty > 0),
  UNIQUE (id, tenant_id),
  UNIQUE (tenant_id, parent_item_id, component_item_id)
);
ALTER TABLE composite_definitions ENABLE ROW LEVEL SECURITY; ALTER TABLE composite_definitions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON composite_definitions; CREATE POLICY tenant_isolation ON composite_definitions USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON composite_definitions TO erp_app;

-- Seed 3 templates v1.0.0 with manifests (simplified but schema-valid per industries/README §3)
INSERT INTO industry_templates (id, key, name, name_ar, version, manifest, manifest_hash) VALUES
  ('00000000-0000-0000-0000-000000000301','industry.retail','Retail','التجزئة','1.0.0',
   '{"key":"industry.retail","version":"1.0.0","required_feature_keys":["industry.template_engine","items.barcodes","pos.terminals"],"optional_feature_keys":["pos.sales"],"phase_gated":["pos.offline_queue"],"navigation_manifest":[{"group":"sales","items":["pos.sales","pos.receipts"]}],"terminology_overrides":{"ar":{"pos.sales":"مبيعات"}},"numbering_series":["INV","POS","CN","TRF"],"report_pins":["pos.sales_by_terminal","inventory.stock_valuation"],"inventory_defaults":{"costing_method":"WAC","allow_negative_stock":false}}'::jsonb,
   'sha256-retail-v1'),
  ('00000000-0000-0000-0000-000000000302','industry.grocery','Grocery','البقالة','1.0.0',
   '{"key":"industry.grocery","version":"1.0.0","required_feature_keys":["inventory.batch_tracking","pos.barcode_scanning"],"optional_feature_keys":["distribution.customer_tiers"],"phase_gated":["distribution.customer_tiers"],"navigation_manifest":[{"group":"inventory","items":["inventory.expiry_list","inventory.counts"]}],"terminology_overrides":{"ar":{"inventory.expiry_list":"قائمة الانتهاء"}},"numbering_series":["INV","POS","GRN","ADJ"],"report_pins":["inventory.expiry_list","grocery.expiry_writeoff"],"inventory_defaults":{"costing_method":"FIFO","fefo_for_expiry_items":true}}'::jsonb,
   'sha256-grocery-v1'),
  ('00000000-0000-0000-0000-000000000303','industry.restaurant','Restaurant','المطاعم','1.0.0',
   '{"key":"industry.restaurant","version":"1.0.0","required_feature_keys":["items.composite_products","pos.table_service"],"optional_feature_keys":[],"phase_gated":["pos.table_service","pos.kitchen_display"],"navigation_manifest":[{"group":"service","items":["pos.table_service","treasury.shift_cash_reconciliation"]}],"terminology_overrides":{"ar":{"pos.table_service":"خدمة الطاولات"}},"numbering_series":["RC","PO","GRN","ADJ"],"report_pins":["restaurant.sales_by_table","treasury.shift_cash_reconciliation"],"inventory_defaults":{"costing_method":"WAC","unpaid_table_holds_no_ledger":true}}'::jsonb,
   'sha256-restaurant-v1')
ON CONFLICT (key) DO UPDATE SET version=EXCLUDED.version, manifest=EXCLUDED.manifest, manifest_hash=EXCLUDED.manifest_hash, updated_at=now();
