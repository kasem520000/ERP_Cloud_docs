-- 0005_accounts_schema.sql — CoA tables for onboarding instantiation (schema+template in 004, posting readiness in 007)
-- Tenant-owned; RLS.

CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  name_ar text,
  type text NOT NULL CHECK (type IN ('ASSET','LIABILITY','EQUITY','REVENUE','EXPENSE')),
  parent_id uuid,
  is_postable boolean NOT NULL DEFAULT true,
  is_system boolean NOT NULL DEFAULT false,
  currency char(3),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','ARCHIVED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id),
  UNIQUE (tenant_id, code)
);
CREATE INDEX IF NOT EXISTS ix_accounts_tenant ON accounts (tenant_id);
CREATE INDEX IF NOT EXISTS ix_accounts_tenant_parent ON accounts (tenant_id, parent_id);
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON accounts;
CREATE POLICY tenant_isolation ON accounts USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON accounts TO erp_app;
-- Self-referential FK after RLS
DO $$ BEGIN
  ALTER TABLE accounts ADD CONSTRAINT fk_accounts_parent FOREIGN KEY (parent_id, tenant_id) REFERENCES accounts (id, tenant_id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS account_purposes (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  purpose_key text NOT NULL,
  account_id uuid NOT NULL,
  active_from date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id),
  UNIQUE (tenant_id, purpose_key),
  CONSTRAINT fk_purpose_account FOREIGN KEY (account_id, tenant_id) REFERENCES accounts (id, tenant_id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS ix_account_purposes_tenant ON account_purposes (tenant_id);
ALTER TABLE account_purposes ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_purposes FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON account_purposes;
CREATE POLICY tenant_isolation ON account_purposes USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON account_purposes TO erp_app;

COMMENT ON TABLE accounts IS 'CoA nodes — leaf-only posting (INV-004), instantiated from template in 004';
COMMENT ON TABLE account_purposes IS 'Purpose→account mapping 1:1 per tenant, fail-closed PURPOSE_NOT_MAPPED';
