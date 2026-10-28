-- 0010_tax.sql — Tax treatments (global), jurisdictions, rates, tenant tax_codes/registrations, einvoicing registry
-- Global reference tables: no tenant_id, no RLS, read-only to erp_app

-- tax_treatments (global)
CREATE TABLE IF NOT EXISTS tax_treatments (
  key text PRIMARY KEY, name text NOT NULL, name_ar text, description text, gl_effect text
);
GRANT SELECT ON tax_treatments TO erp_app; REVOKE INSERT, UPDATE, DELETE ON tax_treatments FROM erp_app;

-- jurisdictions (global)
CREATE TABLE IF NOT EXISTS jurisdictions (
  country_code char(2) PRIMARY KEY, name text NOT NULL, name_ar text,
  vat_status text NOT NULL CHECK (vat_status IN ('VAT_IN_FORCE','VAT_PLANNED','NO_VAT')),
  pack_version text NOT NULL DEFAULT '1.0.0',
  regulatory_notes text, official_source text
);
GRANT SELECT ON jurisdictions TO erp_app; REVOKE INSERT, UPDATE, DELETE ON jurisdictions FROM erp_app;

-- jurisdiction_tax_rates (global versioned)
CREATE TABLE IF NOT EXISTS jurisdiction_tax_rates (
  id uuid PRIMARY KEY, country_code char(2) NOT NULL REFERENCES jurisdictions(country_code),
  treatment text NOT NULL REFERENCES tax_treatments(key),
  rate numeric(7,4) NOT NULL CHECK (rate >= 0 AND rate <= 1),
  effective_from date NOT NULL, effective_to date,
  source_ref text NOT NULL, verified_at timestamptz,
  CHECK (effective_to IS NULL OR effective_to > effective_from)
);
CREATE INDEX IF NOT EXISTS ix_jtr_country_treatment_date ON jurisdiction_tax_rates (country_code, treatment, effective_from);
GRANT SELECT ON jurisdiction_tax_rates TO erp_app; REVOKE INSERT, UPDATE, DELETE ON jurisdiction_tax_rates FROM erp_app;

-- tenant tax_codes
CREATE TABLE IF NOT EXISTS tax_codes (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code text NOT NULL, name text NOT NULL, name_ar text,
  jurisdiction_code char(2) NOT NULL REFERENCES jurisdictions(country_code),
  treatment text NOT NULL REFERENCES tax_treatments(key),
  rate numeric(7,4) NOT NULL, is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), version integer NOT NULL DEFAULT 1,
  UNIQUE (id, tenant_id), UNIQUE (tenant_id, code)
);
CREATE INDEX IF NOT EXISTS ix_tax_codes_tenant ON tax_codes (tenant_id);
ALTER TABLE tax_codes ENABLE ROW LEVEL SECURITY; ALTER TABLE tax_codes FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tax_codes; CREATE POLICY tenant_isolation ON tax_codes USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON tax_codes TO erp_app;

-- tenant tax_registrations (migrated from tax.registration.* settings)
CREATE TABLE IF NOT EXISTS tax_registrations (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  jurisdiction_code char(2) NOT NULL REFERENCES jurisdictions(country_code),
  status text NOT NULL CHECK (status IN ('REGISTERED','NOT_REGISTERED','DEREGISTERED')),
  registration_no text, effective_from date NOT NULL DEFAULT CURRENT_DATE, effective_to date,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), version integer NOT NULL DEFAULT 1,
  UNIQUE (id, tenant_id), UNIQUE (tenant_id, jurisdiction_code)
);
CREATE INDEX IF NOT EXISTS ix_tax_reg_tenant ON tax_registrations (tenant_id);
ALTER TABLE tax_registrations ENABLE ROW LEVEL SECURITY; ALTER TABLE tax_registrations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tax_registrations; CREATE POLICY tenant_isolation ON tax_registrations USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON tax_registrations TO erp_app;

-- e_invoicing_submissions (schema only, impl PHASE-023)
CREATE TABLE IF NOT EXISTS e_invoicing_submissions (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  doc_type text NOT NULL, doc_id uuid NOT NULL, adapter_id text, status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','GENERATED','SUBMITTED','ACCEPTED','REJECTED')),
  payload_file text, response_file text, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tenant_id)
);
CREATE INDEX IF NOT EXISTS ix_einv_tenant ON e_invoicing_submissions (tenant_id);
ALTER TABLE e_invoicing_submissions ENABLE ROW LEVEL SECURITY; ALTER TABLE e_invoicing_submissions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON e_invoicing_submissions; CREATE POLICY tenant_isolation ON e_invoicing_submissions USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
GRANT SELECT, INSERT, UPDATE, DELETE ON e_invoicing_submissions TO erp_app;

-- Add FK from items.tax_code_id to tax_codes (expand step, nullable since PHASE-006)
DO $$ BEGIN
  ALTER TABLE items ADD CONSTRAINT fk_items_tax_code FOREIGN KEY (tax_code_id, tenant_id) REFERENCES tax_codes (id, tenant_id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_column THEN NULL; END $$;

-- item_categories default tax_code
DO $$ BEGIN
  ALTER TABLE item_categories ADD COLUMN IF NOT EXISTS default_tax_code_id uuid;
  ALTER TABLE item_categories ADD CONSTRAINT fk_cat_tax_code FOREIGN KEY (default_tax_code_id, tenant_id) REFERENCES tax_codes (id, tenant_id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Enforce global tables read-only via revoke already; ensure no RLS on them
