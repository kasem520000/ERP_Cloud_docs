-- 0026_group_consolidation.sql — PHASE-034 Group Consolidation hyperscale
CREATE TABLE IF NOT EXISTS consolidation_groups (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL, UNIQUE (id, tenant_id)
);
ALTER TABLE consolidation_groups ENABLE ROW LEVEL SECURITY; ALTER TABLE consolidation_groups FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON consolidation_groups; CREATE POLICY tenant_isolation ON consolidation_groups USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE ON consolidation_groups TO erp_app;
