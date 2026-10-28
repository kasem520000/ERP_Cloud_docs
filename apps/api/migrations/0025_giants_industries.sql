-- 0025_giants_industries.sql — PHASE-028..033 industries (wholesale, electronics, healthcare, education, agriculture)
CREATE TABLE IF NOT EXISTS wholesale_prices (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  item_id uuid NOT NULL, tier text NOT NULL, price numeric(19,4) NOT NULL,
  UNIQUE (id, tenant_id)
);
ALTER TABLE wholesale_prices ENABLE ROW LEVEL SECURITY; ALTER TABLE wholesale_prices FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON wholesale_prices; CREATE POLICY tenant_isolation ON wholesale_prices USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE ON wholesale_prices TO erp_app;

CREATE TABLE IF NOT EXISTS warranty_claims (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  serial_id uuid, status text NOT NULL DEFAULT 'OPEN', UNIQUE (id, tenant_id)
);
ALTER TABLE warranty_claims ENABLE ROW LEVEL SECURITY; ALTER TABLE warranty_claims FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON warranty_claims; CREATE POLICY tenant_isolation ON warranty_claims USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE ON warranty_claims TO erp_app;

CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL, mrn text, UNIQUE (id, tenant_id)
);
ALTER TABLE patients ENABLE ROW LEVEL SECURITY; ALTER TABLE patients FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON patients; CREATE POLICY tenant_isolation ON patients USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE ON patients TO erp_app;

CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL, student_no text, UNIQUE (id, tenant_id)
);
ALTER TABLE students ENABLE ROW LEVEL SECURITY; ALTER TABLE students FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON students; CREATE POLICY tenant_isolation ON students USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE ON students TO erp_app;

CREATE TABLE IF NOT EXISTS farms (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL, area numeric(19,4), UNIQUE (id, tenant_id)
);
ALTER TABLE farms ENABLE ROW LEVEL SECURITY; ALTER TABLE farms FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON farms; CREATE POLICY tenant_isolation ON farms USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE ON farms TO erp_app;
