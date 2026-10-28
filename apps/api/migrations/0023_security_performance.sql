-- 0023_security_performance.sql — PHASE-024/025 Hardening & GA
CREATE TABLE IF NOT EXISTS security_audits (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  kind text NOT NULL, findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (id, tenant_id)
);
ALTER TABLE security_audits ENABLE ROW LEVEL SECURITY; ALTER TABLE security_audits FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON security_audits; CREATE POLICY tenant_isolation ON security_audits USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT ON security_audits TO erp_app;

CREATE TABLE IF NOT EXISTS performance_benchmarks (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  scenario text NOT NULL, p95_ms integer NOT NULL, status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (id, tenant_id)
);
ALTER TABLE performance_benchmarks ENABLE ROW LEVEL SECURITY; ALTER TABLE performance_benchmarks FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON performance_benchmarks; CREATE POLICY tenant_isolation ON performance_benchmarks USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT ON performance_benchmarks TO erp_app;
