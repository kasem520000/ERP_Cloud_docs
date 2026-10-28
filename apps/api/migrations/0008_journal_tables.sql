-- 0008_journal_tables.sql — journal_entries/lines (append-only 🔒, INV-013 idempotency, triggers)
-- Forward-only. Triggers: immutability (INV-003), balanced-entry (INV-001/002), period-lock (INV-011)

-- ── journal_entries ──
CREATE TABLE IF NOT EXISTS journal_entries (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entry_no text,
  entry_date date NOT NULL,
  fiscal_period_id uuid NOT NULL,
  currency_code char(3) NOT NULL REFERENCES currencies(code),
  exchange_rate numeric(19,8) NOT NULL DEFAULT 1 CHECK (exchange_rate > 0),
  status text NOT NULL DEFAULT 'POSTED' CHECK (status IN ('POSTED','REVERSED')),
  source_type text NOT NULL,
  source_id uuid,
  operation text NOT NULL DEFAULT 'POST',
  reversal_of_id uuid,
  reversed_by_id uuid,
  description text,
  posted_at timestamptz NOT NULL DEFAULT now(),
  posted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1,
  UNIQUE (id, tenant_id),
  UNIQUE (tenant_id, entry_no),
  UNIQUE (tenant_id, source_type, source_id, operation) -- INV-013 idempotency: uq_journal_entries_tenant_source_op
);
CREATE INDEX IF NOT EXISTS ix_journal_entries_tenant_date ON journal_entries (tenant_id, entry_date);
CREATE INDEX IF NOT EXISTS ix_journal_entries_source ON journal_entries (tenant_id, source_type, source_id);
CREATE INDEX IF NOT EXISTS ix_journal_entries_period ON journal_entries (tenant_id, fiscal_period_id);
DO $$ BEGIN
  ALTER TABLE journal_entries ADD CONSTRAINT fk_je_period FOREIGN KEY (fiscal_period_id, tenant_id) REFERENCES fiscal_periods (id, tenant_id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE journal_entries ADD CONSTRAINT fk_je_reversal_of FOREIGN KEY (reversal_of_id, tenant_id) REFERENCES journal_entries (id, tenant_id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE journal_entries ADD CONSTRAINT fk_je_reversed_by FOREIGN KEY (reversed_by_id, tenant_id) REFERENCES journal_entries (id, tenant_id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON journal_entries;
CREATE POLICY tenant_isolation ON journal_entries USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
-- append-only: revoke UPDATE/DELETE from app role (INV-003)
REVOKE UPDATE, DELETE ON journal_entries FROM erp_app;
GRANT SELECT, INSERT ON journal_entries TO erp_app;
GRANT SELECT ON journal_entries TO erp_readonly;

-- ── journal_lines ──
CREATE TABLE IF NOT EXISTS journal_lines (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  journal_entry_id uuid NOT NULL,
  line_no integer NOT NULL,
  account_id uuid NOT NULL,
  direction text NOT NULL CHECK (direction IN ('DEBIT','CREDIT')),
  amount numeric(19,4) NOT NULL CHECK (amount > 0),
  base_amount numeric(19,4) NOT NULL CHECK (base_amount > 0),
  partner_id uuid,
  item_id uuid,
  cost_center_id uuid,
  tax_code_id uuid,
  memo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1,
  UNIQUE (id, tenant_id),
  UNIQUE (journal_entry_id, line_no)
);
CREATE INDEX IF NOT EXISTS ix_journal_lines_tenant ON journal_lines (tenant_id);
CREATE INDEX IF NOT EXISTS ix_journal_lines_entry ON journal_lines (tenant_id, journal_entry_id);
CREATE INDEX IF NOT EXISTS ix_journal_lines_account ON journal_lines (tenant_id, account_id);
CREATE INDEX IF NOT EXISTS ix_journal_lines_partner ON journal_lines (tenant_id, partner_id);
DO $$ BEGIN
  ALTER TABLE journal_lines ADD CONSTRAINT fk_jl_entry FOREIGN KEY (journal_entry_id, tenant_id) REFERENCES journal_entries (id, tenant_id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE journal_lines ADD CONSTRAINT fk_jl_account FOREIGN KEY (account_id, tenant_id) REFERENCES accounts (id, tenant_id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE journal_lines ADD CONSTRAINT fk_jl_partner FOREIGN KEY (partner_id, tenant_id) REFERENCES partners (id, tenant_id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE journal_lines ADD CONSTRAINT fk_jl_cost_center FOREIGN KEY (cost_center_id, tenant_id) REFERENCES cost_centers (id, tenant_id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-- tax_code_id FK deferred to PHASE-009 (no constraint here, expand-migrate-contract)
-- item_id FK (stock dimension)
DO $$ BEGIN
  ALTER TABLE journal_lines ADD CONSTRAINT fk_jl_item FOREIGN KEY (item_id, tenant_id) REFERENCES items (id, tenant_id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE journal_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_lines FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON journal_lines;
CREATE POLICY tenant_isolation ON journal_lines USING (tenant_id = erp.current_tenant_id()) WITH CHECK (tenant_id = erp.current_tenant_id());
-- append-only grants
REVOKE UPDATE, DELETE ON journal_lines FROM erp_app;
GRANT SELECT, INSERT ON journal_lines TO erp_app;
GRANT SELECT ON journal_lines TO erp_readonly;

-- ── triggers ──

-- INV-003: immutability guard — reject UPDATE/DELETE on journal_entries/lines
CREATE OR REPLACE FUNCTION erp.journal_immutability_guard() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'INV-003: journal_entries/journal_lines are append-only (immutable) — % on %', TG_OP, TG_TABLE_NAME;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_je_immutable ON journal_entries;
CREATE TRIGGER trg_je_immutable BEFORE UPDATE OR DELETE ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION erp.journal_immutability_guard();

DROP TRIGGER IF EXISTS trg_jl_immutable ON journal_lines;
CREATE TRIGGER trg_jl_immutable BEFORE UPDATE OR DELETE ON journal_lines
  FOR EACH ROW EXECUTE FUNCTION erp.journal_immutability_guard();

-- INV-001/002: balanced-entry double-check (deferrable constraint trigger at commit)
-- Ensures Σdebit = Σcredit in both currencies. Called as DEFERRABLE trigger on journal_entries.
CREATE OR REPLACE FUNCTION erp.journal_balanced_check() RETURNS trigger AS $$
DECLARE
  v_doc_debit numeric(19,4);
  v_doc_credit numeric(19,4);
  v_base_debit numeric(19,4);
  v_base_credit numeric(19,4);
BEGIN
  SELECT COALESCE(SUM(CASE WHEN direction='DEBIT' THEN amount ELSE 0 END),0),
         COALESCE(SUM(CASE WHEN direction='CREDIT' THEN amount ELSE 0 END),0),
         COALESCE(SUM(CASE WHEN direction='DEBIT' THEN base_amount ELSE 0 END),0),
         COALESCE(SUM(CASE WHEN direction='CREDIT' THEN base_amount ELSE 0 END),0)
    INTO v_doc_debit, v_doc_credit, v_base_debit, v_base_credit
  FROM journal_lines WHERE journal_entry_id = NEW.id;
  IF v_doc_debit <> v_doc_credit THEN
    RAISE EXCEPTION 'INV-001: entry not balanced in document currency: debit % credit % (entry %)', v_doc_debit, v_doc_credit, NEW.id;
  END IF;
  IF v_base_debit <> v_base_credit THEN
    RAISE EXCEPTION 'INV-002: entry not balanced in base currency: debit % credit % (entry %)', v_base_debit, v_base_credit, NEW.id;
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_je_balanced ON journal_entries;
CREATE CONSTRAINT TRIGGER trg_je_balanced
  AFTER INSERT ON journal_entries DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION erp.journal_balanced_check();

-- INV-011: period-lock double-check — reject INSERT when fiscal_period is LOCKED
CREATE OR REPLACE FUNCTION erp.journal_period_lock_guard() RETURNS trigger AS $$
DECLARE v_status text;
BEGIN
  SELECT status INTO v_status FROM fiscal_periods WHERE id = NEW.fiscal_period_id AND tenant_id = NEW.tenant_id;
  IF v_status = 'LOCKED' THEN
    RAISE EXCEPTION 'INV-011: cannot post into LOCKED period %', NEW.fiscal_period_id;
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_je_period_lock ON journal_entries;
CREATE TRIGGER trg_je_period_lock BEFORE INSERT ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION erp.journal_period_lock_guard();
