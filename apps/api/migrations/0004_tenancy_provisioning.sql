-- 0004_tenancy_provisioning.sql — Tenant profile expansion + branches + plans/subscriptions/entitlements/settings + support
-- Additive; forward-only. RLS on all tenant-owned tables.

-- Tenants profile expansion (additive, nullable where possible for rollout safety)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS name_ar text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS base_currency char(3);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS country_code char(2);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'UTC';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS industry_template_key text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Update status check to include SUSPENDED/OFFBOARDED (already present in 0001 but ensure)
DO $$ BEGIN
  ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_status_check;
EXCEPTION WHEN undefined_object THEN NULL; END $$;
ALTER TABLE tenants ADD CONSTRAINT tenants_status_check CHECK (status IN ('ACTIVE','SUSPENDED','OFFBOARDED'));

-- Branches
CREATE TABLE IF NOT EXISTS branches (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  name_ar text,
  address jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id),
  UNIQUE (tenant_id, code)
);
CREATE INDEX IF NOT EXISTS ix_branches_tenant ON branches (tenant_id);
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON branches;
CREATE POLICY tenant_isolation ON branches USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON branches TO erp_app;

-- Plans (platform-level, no tenant_id, no RLS)
CREATE TABLE IF NOT EXISTS plans (
  id uuid PRIMARY KEY,
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  price_amount numeric(19,4) NOT NULL CHECK (price_amount >= 0),
  currency_code char(3) NOT NULL DEFAULT 'SAR',
  billing_period text NOT NULL DEFAULT 'MONTHLY' CHECK (billing_period IN ('MONTHLY','YEARLY')),
  limits jsonb NOT NULL DEFAULT '{}'::jsonb,
  feature_keys text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON plans TO erp_app;

-- Subscriptions (minimal schema, tenant-owned)
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES plans(id),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','PAST_DUE','CANCELLED')),
  period_start date NOT NULL DEFAULT CURRENT_DATE,
  period_end date NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 month')::date CHECK (period_start <= period_end),
  provider_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id)
);
CREATE INDEX IF NOT EXISTS ix_subscriptions_tenant ON subscriptions (tenant_id);
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON subscriptions;
CREATE POLICY tenant_isolation ON subscriptions USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE ON subscriptions TO erp_app;

-- Entitlements (materialized)
CREATE TABLE IF NOT EXISTS entitlements (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  feature_key text NOT NULL,
  source text NOT NULL DEFAULT 'PLAN' CHECK (source IN ('PLAN','MANUAL','PROMO','TRIAL')),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id),
  UNIQUE (tenant_id, feature_key)
);
CREATE INDEX IF NOT EXISTS ix_entitlements_tenant ON entitlements (tenant_id);
ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE entitlements FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON entitlements;
CREATE POLICY tenant_isolation ON entitlements USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON entitlements TO erp_app;

-- Tenant settings (typed KV)
CREATE TABLE IF NOT EXISTS tenant_settings (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  key text NOT NULL,
  value jsonb NOT NULL,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id),
  UNIQUE (tenant_id, key)
);
CREATE INDEX IF NOT EXISTS ix_tenant_settings_tenant ON tenant_settings (tenant_id);
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_settings FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tenant_settings;
CREATE POLICY tenant_isolation ON tenant_settings USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON tenant_settings TO erp_app;

-- Support sessions (time-boxed audited access)
CREATE TABLE IF NOT EXISTS support_sessions (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  platform_user_id uuid NOT NULL,
  reason text NOT NULL,
  ticket_id text,
  opt_in boolean NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id)
);
CREATE INDEX IF NOT EXISTS ix_support_sessions_tenant ON support_sessions (tenant_id);
ALTER TABLE support_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_sessions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON support_sessions;
CREATE POLICY tenant_isolation ON support_sessions USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE ON support_sessions TO erp_app;

COMMENT ON TABLE support_sessions IS 'Time-boxed support access — default 4h, audited, via_platform_admin flag';
