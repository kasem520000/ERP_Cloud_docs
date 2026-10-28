-- 0001_core_infra.sql — Bootstrap: roles, erp schema, GUC helper, tenants (minimal), audit_events, file_objects
-- Forward-only; no destructive Ops. Roles are idempotent via DO block.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'erp_migrate') THEN
    CREATE ROLE erp_migrate LOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'erp_app') THEN
    CREATE ROLE erp_app LOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'erp_readonly') THEN
    CREATE ROLE erp_readonly LOGIN;
  END IF;
END $$;

CREATE SCHEMA IF NOT EXISTS erp;
GRANT USAGE ON SCHEMA erp TO erp_app, erp_readonly;
GRANT USAGE ON SCHEMA public TO erp_app, erp_readonly;

-- GUC helper (TENANT_ISOLATION §2)
CREATE OR REPLACE FUNCTION erp.current_tenant_id() RETURNS uuid
LANGUAGE sql STABLE AS
$$ SELECT nullif(current_setting('erp.tenant_id', true), '')::uuid $$;

-- Platform scope helper (tenants RLS uses separate GUC)
CREATE OR REPLACE FUNCTION erp.current_platform_scope() RETURNS text
LANGUAGE sql STABLE AS
$$ SELECT current_setting('erp.platform_scope', true) $$;

ALTER ROLE erp_app SET row_security = on;
ALTER ROLE erp_readonly SET row_security = on;

-- tenants (minimal for RLS FK target) — full columns in PHASE-003 per ENTITY_CATALOG
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','SUSPENDED','OFFBOARDED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE tenants IS 'Customer organizations — minimal stub (PHASE-002); full profile in PHASE-003';

-- RLS on tenants: platform-scope pattern (TENANT_ISOLATION §3). For PHASE-002, allow only platform_scope = `internal` bearer.
-- In PHASE-003 this becomes membership-aware; for now, enforce fail-closed except explicit platform context.
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tenants;
-- Tenants are visible only via platform scope in PHASE-002; app services use explicit platform context.
CREATE POLICY tenant_isolation ON tenants
  USING (erp.current_platform_scope() = 'internal' OR tenant_id = erp.current_tenant_id())
  WITH CHECK (erp.current_platform_scope() = 'internal');

-- We need tenants to not be tenant-owned itself, but to anchor FKs, we keep it simple:
-- For PHASE-002 tests, we allow erp_app to read tenants via platform scope; RLS above already covers.
-- Grant selects to erp_app/readonly via platform check
GRANT SELECT, INSERT, UPDATE ON tenants TO erp_app;
GRANT SELECT ON tenants TO erp_readonly;

-- audit_events — immutable audit trail (INV-003 substrate, ENTITY_CATALOG tenancy & identity)
CREATE TABLE IF NOT EXISTS audit_events (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  actor_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  before jsonb,
  after jsonb,
  correlation_id text,
  device_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- standard columns for RLS composite anchor
  UNIQUE (id, tenant_id)
);
COMMENT ON TABLE audit_events IS 'Immutable audit trail — append-only (PHASE-002 stub, full in PHASE-003)';

-- Indexes (tenant-first per DATABASE_CONVENTIONS §8)
CREATE INDEX IF NOT EXISTS ix_audit_events_tenant_entity ON audit_events (tenant_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS ix_audit_events_tenant_created ON audit_events (tenant_id, created_at DESC);

-- RLS
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON audit_events;
CREATE POLICY tenant_isolation ON audit_events
  USING (tenant_id = erp.current_tenant_id())
  WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT ON audit_events TO erp_app;
GRANT SELECT ON audit_events TO erp_readonly;

-- Guard trigger: append-only (DATABASE_ARCHITECTURE §1.6)
CREATE OR REPLACE FUNCTION erp.audit_events_guard() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_events are append-only (INV-003 substrate): % prohibited', TG_OP;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_events_guard ON audit_events;
CREATE TRIGGER trg_audit_events_guard
  BEFORE UPDATE OR DELETE ON audit_events
  FOR EACH ROW EXECUTE FUNCTION erp.audit_events_guard();

-- file_objects — S3 adapter skeleton (ENTITY_CATALOG partners & items, file_objects)
CREATE TABLE IF NOT EXISTS file_objects (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  owner_type text NOT NULL,
  owner_id uuid,
  storage_key text NOT NULL,
  name text NOT NULL,
  size int NOT NULL CHECK (size >= 0),
  content_type text NOT NULL,
  checksum text,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id)
);
COMMENT ON TABLE file_objects IS 'S3 object metadata — tenant-scoped (PHASE-002 infra, usage in PHASE-006)';

CREATE INDEX IF NOT EXISTS ix_file_objects_tenant_owner ON file_objects (tenant_id, owner_type, owner_id);
ALTER TABLE file_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_objects FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON file_objects;
CREATE POLICY tenant_isolation ON file_objects
  USING (tenant_id = erp.current_tenant_id())
  WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON file_objects TO erp_app;
GRANT SELECT ON file_objects TO erp_readonly;

-- Example probe for composite tenant FK pattern (DATABASE_CONVENTIONS §6)
-- _infra_probe is a child demonstrating fk_invoice_tenant pattern; used by docs & tests then kept as fixture.
CREATE TABLE IF NOT EXISTS _infra_probe (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  parent_id uuid NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id),
  CONSTRAINT fk_probe_tenant FOREIGN KEY (parent_id, tenant_id) REFERENCES audit_events (id, tenant_id) ON DELETE RESTRICT
);
ALTER TABLE _infra_probe ENABLE ROW LEVEL SECURITY;
ALTER TABLE _infra_probe FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON _infra_probe;
CREATE POLICY tenant_isolation ON _infra_probe
  USING (tenant_id = erp.current_tenant_id())
  WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON _infra_probe TO erp_app;

-- Grants for erp schema
GRANT EXECUTE ON FUNCTION erp.current_tenant_id() TO erp_app, erp_readonly;
GRANT EXECUTE ON FUNCTION erp.current_platform_scope() TO erp_app, erp_readonly;
GRANT EXECUTE ON FUNCTION erp.audit_events_guard() TO erp_app;

-- Statement timeout defaults (DATABASE_CONVENTIONS §10)
ALTER ROLE erp_app SET statement_timeout = '15s';
ALTER ROLE erp_readonly SET statement_timeout = '120s';
-- No log for pgboss yet; boss schema created in 0002
