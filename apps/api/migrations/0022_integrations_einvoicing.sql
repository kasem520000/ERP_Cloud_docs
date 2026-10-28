-- 0022_integrations_einvoicing.sql — PHASE-023 Integrations & E-Invoicing production
CREATE TABLE IF NOT EXISTS integrations (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider text NOT NULL, config jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'ACTIVE', UNIQUE (id, tenant_id)
);
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY; ALTER TABLE integrations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON integrations; CREATE POLICY tenant_isolation ON integrations USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE ON integrations TO erp_app;

CREATE TABLE IF NOT EXISTS einvoicing_documents (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL, provider text NOT NULL, submission_id text,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SUBMITTED','ACCEPTED','REJECTED')),
  payload jsonb, UNIQUE (id, tenant_id)
);
ALTER TABLE einvoicing_documents ENABLE ROW LEVEL SECURITY; ALTER TABLE einvoicing_documents FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON einvoicing_documents; CREATE POLICY tenant_isolation ON einvoicing_documents USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE ON einvoicing_documents TO erp_app;
