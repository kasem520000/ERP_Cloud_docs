-- 0003_identity_core.sql — Identity cluster: users (global), roles/permissions, memberships, sessions, devices, mfa_factors, invitations
-- Global reference tables have NO RLS (read-only to erp_app). Tenant-owned: memberships, invitations, sessions (tenant-aware via active_tenant_id)

-- users — global identity (no tenant_id)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  phone text,
  full_name text NOT NULL,
  password_hash text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','ACTIVE','LOCKED','DEACTIVATED')),
  locale text NOT NULL DEFAULT 'ar' CHECK (locale IN ('ar','en')),
  failed_login_count int NOT NULL DEFAULT 0,
  locked_until timestamptz,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email ON users (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_phone ON users (phone) WHERE phone IS NOT NULL;
GRANT SELECT, INSERT, UPDATE ON users TO erp_app;

-- roles — system templates have tenant_id IS NULL
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  key text NOT NULL,
  name text NOT NULL,
  name_ar text,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_roles_tenant_key ON roles (tenant_id, key);
CREATE UNIQUE INDEX IF NOT EXISTS uq_roles_system_key ON roles (key) WHERE tenant_id IS NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON roles TO erp_app;

-- permissions — global reference, no tenant_id, no RLS
CREATE TABLE IF NOT EXISTS permissions (
  key text PRIMARY KEY,
  module text NOT NULL,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON permissions TO erp_app, erp_readonly;

-- role_permissions
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id text NOT NULL REFERENCES permissions(key),
  granted_at timestamptz NOT NULL DEFAULT now(),
  granted_by uuid REFERENCES users(id),
  PRIMARY KEY (role_id, permission_id)
);
GRANT SELECT, INSERT, DELETE ON role_permissions TO erp_app;

-- memberships — tenant-owned
CREATE TABLE IF NOT EXISTS memberships (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  branch_scope uuid[],
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','REVOKED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tenant_id),
  UNIQUE (id, tenant_id)
);
CREATE INDEX IF NOT EXISTS ix_memberships_tenant_user ON memberships (tenant_id, user_id);
CREATE INDEX IF NOT EXISTS ix_memberships_user ON memberships (user_id);
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON memberships;
CREATE POLICY tenant_isolation ON memberships USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON memberships TO erp_app;

-- sessions — per-user, with tenant convenience
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  active_tenant_id uuid REFERENCES tenants(id),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  ip inet,
  device_id uuid,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_sessions_user_expires ON sessions (user_id, expires_at);
CREATE INDEX IF NOT EXISTS ix_sessions_token_hash ON sessions (token_hash);
GRANT SELECT, INSERT, UPDATE, DELETE ON sessions TO erp_app;

-- devices — schema only
CREATE TABLE IF NOT EXISTS devices (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('DESKTOP','ANDROID')),
  name text,
  device_key_hash text NOT NULL UNIQUE,
  last_seen_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON devices TO erp_app;

-- mfa_factors — encrypted secret + recovery hashes
CREATE TABLE IF NOT EXISTS mfa_factors (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'TOTP' CHECK (kind = 'TOTP'),
  secret_enc text NOT NULL,
  confirmed_at timestamptz,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  recovery_codes_hash text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_mfa_user_kind ON mfa_factors (user_id, kind);
GRANT SELECT, INSERT, UPDATE, DELETE ON mfa_factors TO erp_app;

-- invitations — tenant-owned
CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email text NOT NULL,
  role_id uuid NOT NULL REFERENCES roles(id),
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id)
);
CREATE INDEX IF NOT EXISTS ix_invitations_tenant_email ON invitations (tenant_id, lower(email));
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON invitations;
CREATE POLICY tenant_isolation ON invitations USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON invitations TO erp_app;

-- seeds will populate permissions + roles via separate migration seeds

-- Composite FKs for future child tables (examples)
-- memberships.role_id references roles(id, tenant_id) requires unique (id, tenant_id) on roles
CREATE UNIQUE INDEX IF NOT EXISTS uq_roles_id_tenant ON roles (id, tenant_id);
