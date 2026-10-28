-- 0014_reporting_core.sql — Reporting Engine (PHASE-013)
-- report_runs (run orchestration inline vs pg-boss) + print_templates (4 base templates)

CREATE TABLE IF NOT EXISTS report_runs (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  report_key text NOT NULL, contract_version integer NOT NULL,
  params jsonb NOT NULL DEFAULT '{}', params_hash text NOT NULL,
  status text NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED','RUNNING','SUCCEEDED','FAILED','ASSERTION_FAILED')),
  stage text, requested_by uuid NOT NULL,
  duration_ms integer, assertion_results jsonb, artifact_refs jsonb,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id), UNIQUE (tenant_id, report_key, params_hash, contract_version)
);
CREATE INDEX IF NOT EXISTS ix_report_runs_tenant_key ON report_runs (tenant_id, report_key, created_at DESC);
ALTER TABLE report_runs ENABLE ROW LEVEL SECURITY; ALTER TABLE report_runs FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON report_runs; CREATE POLICY tenant_isolation ON report_runs USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON report_runs TO erp_app;

CREATE TABLE IF NOT EXISTS print_templates (
  id uuid PRIMARY KEY, key text NOT NULL, locale text NOT NULL DEFAULT 'ar',
  version integer NOT NULL DEFAULT 1, content_html text NOT NULL, css text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (key, locale, version)
);
-- print_templates is global (no tenant_id) — no RLS needed, but add for consistency
ALTER TABLE print_templates ENABLE ROW LEVEL SECURITY; ALTER TABLE print_templates FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON print_templates; CREATE POLICY tenant_isolation ON print_templates USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON print_templates TO erp_app;

-- Seed 4 base templates version 1
INSERT INTO print_templates (id, key, locale, version, content_html, css) VALUES
  (gen_random_uuid(), 'a4-report', 'ar', 1, '<html>RTL a4-report</html>', '@page { margin: 10mm; } thead { display: table-header-group; }'),
  (gen_random_uuid(), 'a4-report', 'en', 1, '<html>LTR a4-report</html>', '@page { margin: 10mm; }'),
  (gen_random_uuid(), 'a4-document', 'ar', 1, '<html>RTL a4-document</html>', '@page { margin: 10mm; }'),
  (gen_random_uuid(), 'a4-document', 'en', 1, '<html>LTR a4-document</html>', '@page { margin: 10mm; }'),
  (gen_random_uuid(), 'receipt-80', 'ar', 1, '<html>80mm</html>', 'body { width:80mm; }'),
  (gen_random_uuid(), 'receipt-80', 'en', 1, '<html>80mm</html>', 'body { width:80mm; }'),
  (gen_random_uuid(), 'receipt-58', 'ar', 1, '<html>58mm</html>', 'body { width:58mm; }'),
  (gen_random_uuid(), 'receipt-58', 'en', 1, '<html>58mm</html>', 'body { width:58mm; }')
ON CONFLICT DO NOTHING;
