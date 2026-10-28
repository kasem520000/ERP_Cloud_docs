-- 0019_manufacturing.sql — PHASE-018 Manufacturing (BOMs + work orders)
CREATE TABLE IF NOT EXISTS manufacturing_boms (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  item_id uuid NOT NULL, version integer NOT NULL DEFAULT 1,
  components jsonb NOT NULL DEFAULT '[]'::jsonb,
  UNIQUE (id, tenant_id), UNIQUE (tenant_id, item_id, version)
);
ALTER TABLE manufacturing_boms ENABLE ROW LEVEL SECURITY; ALTER TABLE manufacturing_boms FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON manufacturing_boms; CREATE POLICY tenant_isolation ON manufacturing_boms USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE ON manufacturing_boms TO erp_app;

CREATE TABLE IF NOT EXISTS work_orders (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  bom_id uuid REFERENCES manufacturing_boms(id), qty numeric(19,4) NOT NULL,
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','RELEASED','IN_PROGRESS','COMPLETED')),
  UNIQUE (id, tenant_id)
);
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY; ALTER TABLE work_orders FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON work_orders; CREATE POLICY tenant_isolation ON work_orders USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE ON work_orders TO erp_app;

INSERT INTO industry_templates (id, key, name, name_ar, version, manifest, manifest_hash) VALUES
  ('00000000-0000-0000-0000-000000000306','industry.food_manufacturing','Food Manufacturing','تصنيع غذائي','1.0.0',
   '{"key":"industry.food_manufacturing","version":"1.0.0","required_feature_keys":["manufacturing.boms","manufacturing.work_orders","inventory.batch_tracking"],"navigation_manifest":[{"group":"manufacturing","items":["manufacturing.boms"]}],"numbering_series":["BOM","WO"],"report_pins":["manufacturing.costing"],"inventory_defaults":{}}'::jsonb,'sha256-foodmfg-v1')
ON CONFLICT (key) DO UPDATE SET version=EXCLUDED.version, manifest=EXCLUDED.manifest, manifest_hash=EXCLUDED.manifest_hash;
