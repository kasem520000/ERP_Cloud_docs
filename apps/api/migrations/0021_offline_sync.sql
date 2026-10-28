-- 0021_offline_sync.sql — PHASE-020 Offline Sync Foundation (scoped)
CREATE TABLE IF NOT EXISTS offline_devices (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  device_code text NOT NULL, platform text NOT NULL CHECK (platform IN ('DESKTOP','ANDROID','POS')),
  last_sync_at timestamptz, UNIQUE (id, tenant_id), UNIQUE (tenant_id, device_code)
);
ALTER TABLE offline_devices ENABLE ROW LEVEL SECURITY; ALTER TABLE offline_devices FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON offline_devices; CREATE POLICY tenant_isolation ON offline_devices USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE ON offline_devices TO erp_app;

CREATE TABLE IF NOT EXISTS sync_cursors (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  device_id uuid REFERENCES offline_devices(id), entity text NOT NULL, cursor_ts timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id)
);
ALTER TABLE sync_cursors ENABLE ROW LEVEL SECURITY; ALTER TABLE sync_cursors FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON sync_cursors; CREATE POLICY tenant_isolation ON sync_cursors USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE ON sync_cursors TO erp_app;
