-- 0020_crm_projects.sql — PHASE-019 CRM/Service/Projects
CREATE TABLE IF NOT EXISTS crm_leads (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL, status text NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW','QUALIFIED','WON','LOST')),
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (id, tenant_id)
);
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY; ALTER TABLE crm_leads FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON crm_leads; CREATE POLICY tenant_isolation ON crm_leads USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE ON crm_leads TO erp_app;

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL, status text NOT NULL DEFAULT 'ACTIVE',
  budget numeric(19,4), UNIQUE (id, tenant_id)
);
ALTER TABLE projects ENABLE ROW LEVEL SECURITY; ALTER TABLE projects FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON projects; CREATE POLICY tenant_isolation ON projects USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE ON projects TO erp_app;

INSERT INTO industry_templates (id, key, name, name_ar, version, manifest, manifest_hash) VALUES
  ('00000000-0000-0000-0000-000000000307','industry.professional_services','Professional Services','خدمات احترافية','1.0.0',
   '{"key":"industry.professional_services","version":"1.0.0","required_feature_keys":["crm.leads","accounting.projects"],"navigation_manifest":[{"group":"crm","items":["crm.leads"]}],"numbering_series":["LEAD","PRJ"],"report_pins":["crm.pipeline"],"inventory_defaults":{}}'::jsonb,'sha256-profsrv-v1')
ON CONFLICT (key) DO UPDATE SET version=EXCLUDED.version, manifest=EXCLUDED.manifest, manifest_hash=EXCLUDED.manifest_hash;
