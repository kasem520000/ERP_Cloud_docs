-- 0002_boss_and_rls_macro.sql — pg-boss schema + RLS macro + statement timeout verification seed
-- pg-boss will create its own `boss` schema via JS init; this migration ensures the schema exists and is owned correctly.

CREATE SCHEMA IF NOT EXISTS boss;
GRANT USAGE ON SCHEMA boss TO erp_app;
-- pg-boss tables are not RLS (no tenant data) — grant all to erp_app
GRANT ALL ON ALL TABLES IN SCHEMA boss TO erp_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA boss GRANT ALL ON TABLES TO erp_app;

-- RLS macro: apply_tenant_policy(table_name text)
-- Called as SELECT erp.apply_tenant_policy('my_table'::regclass);
-- Enforces the standard tenant_isolation policy (TENANT_ISOLATION §2).
CREATE OR REPLACE FUNCTION erp.apply_tenant_policy(target_table regclass) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  pol_exists bool;
BEGIN
  -- Enable RLS unconditionally (idempotent)
  EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', target_table);
  EXECUTE format('ALTER TABLE %s FORCE ROW LEVEL SECURITY', target_table);
  -- Drop existing tenant_isolation policy if present (re-apply is idempotent)
  SELECT EXISTS(
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename::regclass = target_table AND policyname = 'tenant_isolation'
  ) INTO pol_exists;
  IF pol_exists THEN
    EXECUTE format('DROP POLICY tenant_isolation ON %s', target_table);
  END IF;
  EXECUTE format('CREATE POLICY tenant_isolation ON %s USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id())', target_table);
END $$;
COMMENT ON FUNCTION erp.apply_tenant_policy(regclass) IS 'Applies standard tenant_isolation RLS policy to a table (PHASE-002 macro)';

GRANT EXECUTE ON FUNCTION erp.apply_tenant_policy(regclass) TO erp_app, erp_migrate;

-- Re-apply macro to existing tenant tables to prove it works (idempotent re-apply)
SELECT erp.apply_tenant_policy('tenants'::regclass) WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='tenant_id');
-- tenants uses platform scope, so we restore its custom policy after macro test:
DROP POLICY IF EXISTS tenant_isolation ON tenants;
CREATE POLICY tenant_isolation ON tenants
  USING (erp.current_platform_scope() = 'internal' OR tenant_id = erp.current_tenant_id())
  WITH CHECK (erp.current_platform_scope() = 'internal');

-- Ensure audit_events, file_objects, _infra_probe are via macro (re-apply)
SELECT erp.apply_tenant_policy('audit_events'::regclass);
SELECT erp.apply_tenant_policy('file_objects'::regclass);
SELECT erp.apply_tenant_policy('_infra_probe'::regclass);

-- Pool/concurrency baseline comment (not SQL)
COMMENT ON SCHEMA boss IS 'pg-boss queue — no RLS, payload tenant scoping via handlers (ADR-0008)';

-- Verification helper view for CI RLS check
CREATE OR REPLACE VIEW erp.tenant_tables AS
SELECT c.relname AS table_name
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r' AND EXISTS (
  SELECT 1 FROM information_schema.columns WHERE table_name = c.relname AND column_name = 'tenant_id'
);
GRANT SELECT ON erp.tenant_tables TO erp_app;
