-- 0018_industry_automotive_distribution.sql — PHASE-017
INSERT INTO industry_templates (id, key, name, name_ar, version, manifest, manifest_hash) VALUES
  ('00000000-0000-0000-0000-000000000304','industry.automotive','Automotive','السيارات','1.0.0',
   '{"key":"industry.automotive","version":"1.0.0","required_feature_keys":["crm.service_orders","inventory.serial_tracking","accounting.cost_centers"],"phase_gated":[],"navigation_manifest":[{"group":"service","items":["crm.service_orders","inventory.serial_tracking"]}],"terminology_overrides":{"ar":{"crm.service_orders":"أوامر الصيانة"}},"numbering_series":["SO","INV","SR"],"report_pins":["crm.service_profit","inventory.serial_ledger"],"inventory_defaults":{"costing_method":"FIFO"}}'::jsonb, 'sha256-auto-v1'),
  ('00000000-0000-0000-0000-000000000305','industry.distribution','Distribution','التوزيع','1.0.0',
   '{"key":"industry.distribution","version":"1.0.0","required_feature_keys":["distribution.settlements","sales.commissions","offline.android_app"],"phase_gated":[],"navigation_manifest":[{"group":"distribution","items":["distribution.settlements","sales.commissions"]}],"terminology_overrides":{"ar":{"distribution.settlements":"التسويات"}},"numbering_series":["SO","DLV","INV","STL"],"report_pins":["distribution.settlement_summary","sales.commission_report"],"inventory_defaults":{"costing_method":"WAC"}}'::jsonb, 'sha256-dist-v1')
ON CONFLICT (key) DO UPDATE SET version=EXCLUDED.version, manifest=EXCLUDED.manifest, manifest_hash=EXCLUDED.manifest_hash, updated_at=now();

-- Supporting: service orders (automotive) + settlements (distribution) stubs
CREATE TABLE IF NOT EXISTS service_orders (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id uuid, vehicle_serial_id uuid, status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','IN_PROGRESS','CLOSED')),
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (id, tenant_id)
);
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY; ALTER TABLE service_orders FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON service_orders; CREATE POLICY tenant_isolation ON service_orders USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE ON service_orders TO erp_app;

CREATE TABLE IF NOT EXISTS distribution_settlements (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  rep_id uuid, period text, total numeric(19,4) NOT NULL DEFAULT 0, status text NOT NULL DEFAULT 'DRAFT',
  UNIQUE (id, tenant_id)
);
ALTER TABLE distribution_settlements ENABLE ROW LEVEL SECURITY; ALTER TABLE distribution_settlements FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON distribution_settlements; CREATE POLICY tenant_isolation ON distribution_settlements USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE ON distribution_settlements TO erp_app;
