-- 0024_giants_core.sql — PHASE-026 Fixed Assets + PHASE-027 HR Core
CREATE TABLE IF NOT EXISTS fixed_assets (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL, cost numeric(19,4) NOT NULL, status text NOT NULL DEFAULT 'ACTIVE',
  UNIQUE (id, tenant_id)
);
ALTER TABLE fixed_assets ENABLE ROW LEVEL SECURITY; ALTER TABLE fixed_assets FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON fixed_assets; CREATE POLICY tenant_isolation ON fixed_assets USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE ON fixed_assets TO erp_app;

CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL, national_id text, status text NOT NULL DEFAULT 'ACTIVE',
  UNIQUE (id, tenant_id)
);
ALTER TABLE employees ENABLE ROW LEVEL SECURITY; ALTER TABLE employees FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON employees; CREATE POLICY tenant_isolation ON employees USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE ON employees TO erp_app;
