import { beforeAll, describe, expect, it } from "vitest";

import { appClient, ensureTestDb, seedTenants, superuserClient, TENANT_A, TENANT_B } from "../test-db";
import {
  TENANT_TABLE_NAMES,
  TENANT_TABLES_REGISTRY,
} from "./tables.registry";

/**
 * PHASE-003 T13 — the FIRST FULL RUN of the tenant-isolation attack suite
 * (TENANT_ISOLATION_TESTS §2; SECURITY_TEST_PLAN §2) over every registered
 * tenant-owned table, generated from the registry:
 *
 * - A1 no-GUC reads fail closed                     - A7 id-based probes see nothing
 * - A2 foreign-GUC reads never leak this tenant     - A8 aggregates stay empty
 * - A3 mismatched-tenant INSERTs are policy-denied  - A9 join shapes stay confined
 * - A4 foreign-GUC UPDATEs touch 0 rows             - A10 union/CTE shapes confined
 * - A5 DELETE is denied by grants (no DELETE grant)
 * - Structural: FORCE RLS + USING/WITH CHECK per table; registry completeness
 *   (a tenant-owned table missing from the registry fails the build).
 *
 * Fixtures are seeded by the bootstrap role (superuser) exactly like a
 * migration would; every ATTACK runs as `erp_app` (RLS enforced).
 *
 * Variant-policy tables (roles, role_permissions): template rows
 * (tenant_id IS NULL) are intentionally readable by every tenant — the
 * generated A2 expectation for them counts ONLY tenant-owned rows, and the
 * write attacks still must not cross tenants. Dedicated template-guard
 * tests prove the app role can never INSERT/UPDATE/DELETE a template row.
 */

const VARIANT = new Set(
  TENANT_TABLES_REGISTRY.filter((row) => row.variantTemplateRows).map((row) => row.table),
);

/** Tables whose app-role DELETE grant is by-design (A5: 0 foreign rows). */
const DELETE_GRANTED = new Set(
  TENANT_TABLES_REGISTRY.filter((row) => row.deleteGranted).map((row) => row.table),
);

/** A tenant-owned row per registered table, seeded as the bootstrap role. */
async function seedFixtures(superuser: {
  query: (sql: string, values?: unknown[]) => Promise<{ rowCount: number | null }>;
}): Promise<void> {
  await seedTenants(superuser as never);
  await superuser.query(
    `INSERT INTO roles (id, tenant_id, key, name, name_ar, is_system)
     VALUES
       ('dddddddd-0000-4000-8000-000000000001', $1, 'owner_a', 'Owner A', 'مالك أ', false),
       ('dddddddd-0000-4000-8000-000000000002', $2, 'owner_b', 'Owner B', 'مالك ب', false)
     ON CONFLICT (id) DO NOTHING`,
    [TENANT_A, TENANT_B],
  );
  await superuser.query(
    `INSERT INTO role_permissions (role_id, tenant_id, permission_id)
     VALUES ('dddddddd-0000-4000-8000-000000000001', $1, 'partners.view'),
            ('dddddddd-0000-4000-8000-000000000002', $2, 'partners.view')
     ON CONFLICT (role_id, permission_id) DO NOTHING`,
    [TENANT_A, TENANT_B],
  );
  // users are global; one per tenant for memberships/invitations/sessions.
  await superuser.query(
    `INSERT INTO users (id, email, full_name, password_hash, status)
     VALUES
       ('eeeeeeee-0000-4000-8000-000000000001', 'iso-a@test', 'A', 'x', 'ACTIVE'),
       ('eeeeeeee-0000-4000-8000-000000000002', 'iso-b@test', 'B', 'x', 'ACTIVE')
     ON CONFLICT (id) DO NOTHING`,
  );
  // PHASE-004 fixtures (migrations 0006/0007): one row per registered
  // table per tenant, FK-consistent, idempotent.
  await superuser.query(
    `INSERT INTO branches (id, tenant_id, code, name, name_ar)
     VALUES
       ('abababab-0000-4000-8000-000000000001', $1, 'MAIN', 'Branch A', 'فرع أ'),
       ('abababab-0000-4000-8000-000000000002', $2, 'MAIN', 'Branch B', 'فرع ب')
     ON CONFLICT (id) DO NOTHING`,
    [TENANT_A, TENANT_B],
  );
  await superuser.query(
    `INSERT INTO tenant_settings (id, tenant_id, key, value)
     VALUES
       ('acacacac-0000-4000-8000-000000000001', $1, 'general.default_locale', '"ar"'::jsonb),
       ('acacacac-0000-4000-8000-000000000002', $2, 'general.default_locale', '"ar"'::jsonb)
     ON CONFLICT (id) DO NOTHING`,
    [TENANT_A, TENANT_B],
  );
  await superuser.query(
    `INSERT INTO subscriptions (id, tenant_id, plan_id, period_start, period_end)
     VALUES
       ('adadadad-0000-4000-8000-000000000001', $1,
        '30000000-0000-4000-8000-000000000002', '2026-01-01', '2026-12-31'),
       ('adadadad-0000-4000-8000-000000000002', $2,
        '30000000-0000-4000-8000-000000000002', '2026-01-01', '2026-12-31')
     ON CONFLICT (id) DO NOTHING`,
    [TENANT_A, TENANT_B],
  );
  await superuser.query(
    `INSERT INTO entitlements (id, tenant_id, feature_key, source)
     VALUES
       ('aeaeaeae-0000-4000-8000-000000000001', $1, 'platform.branches', 'PLAN'),
       ('aeaeaeae-0000-4000-8000-000000000002', $2, 'platform.branches', 'PLAN')
     ON CONFLICT (id) DO NOTHING`,
    [TENANT_A, TENANT_B],
  );
  await superuser.query(
    `INSERT INTO support_sessions (id, tenant_id, platform_user_id, opt_in, ticket_ref, reason, expires_at)
     VALUES
       ('afafafaf-0000-4000-8000-000000000001', $1,
        'eeeeeeee-0000-4000-8000-000000000001', false, 'ISO-1', 'iso fixture',
        now() + interval '4 hours'),
       ('afafafaf-0000-4000-8000-000000000002', $2,
        'eeeeeeee-0000-4000-8000-000000000002', false, 'ISO-2', 'iso fixture',
        now() + interval '4 hours')
     ON CONFLICT (id) DO NOTHING`,
    [TENANT_A, TENANT_B],
  );
  await superuser.query(
    `INSERT INTO accounts (id, tenant_id, code, name, name_ar, type, is_postable)
     VALUES
       ('b0b0b0b0-0000-4000-8000-000000000001', $1, '1000', 'Assets A', 'الأصول', 'ASSET', false),
       ('b0b0b0b0-0000-4000-8000-000000000002', $2, '1000', 'Assets B', 'الأصول', 'ASSET', false)
     ON CONFLICT (id) DO NOTHING`,
    [TENANT_A, TENANT_B],
  );
  await superuser.query(
    `INSERT INTO account_purposes (id, tenant_id, purpose_key, account_id, active_from)
     VALUES
       ('b1b1b1b1-0000-4000-8000-000000000001', $1, 'AR_CONTROL',
        'b0b0b0b0-0000-4000-8000-000000000001', '2026-01-01'),
       ('b1b1b1b1-0000-4000-8000-000000000002', $2, 'AR_CONTROL',
        'b0b0b0b0-0000-4000-8000-000000000002', '2026-01-01')
     ON CONFLICT (id) DO NOTHING`,
    [TENANT_A, TENANT_B],
  );
  await superuser.query(
    `INSERT INTO memberships (id, tenant_id, user_id, role_id)
     VALUES
       ('ffffffff-0000-4000-8000-000000000001', $1, 'eeeeeeee-0000-4000-8000-000000000001',
        'dddddddd-0000-4000-8000-000000000001'),
       ('ffffffff-0000-4000-8000-000000000002', $2, 'eeeeeeee-0000-4000-8000-000000000002',
        'dddddddd-0000-4000-8000-000000000002')
     ON CONFLICT (id) DO NOTHING`,
    [TENANT_A, TENANT_B],
  );
  await superuser.query(
    `INSERT INTO invitations (id, tenant_id, email, role_id, token_hash, expires_at, invited_by)
     VALUES
       ('eeeeeeee-1000-4000-8000-000000000001', $1, 'iso-a@test',
        'dddddddd-0000-4000-8000-000000000001', 'iso-token-a', now() + interval '72 hours',
        'eeeeeeee-0000-4000-8000-000000000001'),
       ('eeeeeeee-1000-4000-8000-000000000002', $2, 'iso-b@test',
        'dddddddd-0000-4000-8000-000000000002', 'iso-token-b', now() + interval '72 hours',
        'eeeeeeee-0000-4000-8000-000000000002')
     ON CONFLICT (id) DO NOTHING`,
    [TENANT_A, TENANT_B],
  );
  await superuser.query(
    `INSERT INTO audit_events (id, tenant_id, action, entity_type, entity_id)
     VALUES
       ('eeeeeeee-2000-4000-8000-000000000001', $1, 'iso.seed', 'iso_fixture', $1),
       ('eeeeeeee-2000-4000-8000-000000000002', $2, 'iso.seed', 'iso_fixture', $2)
     ON CONFLICT (id) DO NOTHING`,
    [TENANT_A, TENANT_B],
  );
}

/** Where each table's tenant-owned row id lives, per table. */
const OWN_ROW: Record<string, [string, string]> = {
  audit_events: ["eeeeeeee-2000-4000-8000-000000000001", "eeeeeeee-2000-4000-8000-000000000002"],
  memberships: ["ffffffff-0000-4000-8000-000000000001", "ffffffff-0000-4000-8000-000000000002"],
  invitations: ["eeeeeeee-1000-4000-8000-000000000001", "eeeeeeee-1000-4000-8000-000000000002"],
  roles: ["dddddddd-0000-4000-8000-000000000001", "dddddddd-0000-4000-8000-000000000002"],
  role_permissions: [
    "dddddddd-0000-4000-8000-000000000001",
    "dddddddd-0000-4000-8000-000000000002",
  ],
  branches: ["abababab-0000-4000-8000-000000000001", "abababab-0000-4000-8000-000000000002"],
  tenant_settings: ["acacacac-0000-4000-8000-000000000001", "acacacac-0000-4000-8000-000000000002"],
  subscriptions: ["adadadad-0000-4000-8000-000000000001", "adadadad-0000-4000-8000-000000000002"],
  entitlements: ["aeaeaeae-0000-4000-8000-000000000001", "aeaeaeae-0000-4000-8000-000000000002"],
  support_sessions: ["afafafaf-0000-4000-8000-000000000001", "afafafaf-0000-4000-8000-000000000002"],
  accounts: ["b0b0b0b0-0000-4000-8000-000000000001", "b0b0b0b0-0000-4000-8000-000000000002"],
  account_purposes: ["b1b1b1b1-0000-4000-8000-000000000001", "b1b1b1b1-0000-4000-8000-000000000002"],
};

/** Mismatched-tenant INSERT shapes per table (A3) — explicit columns so the
 * attack isolates the RLS WITH CHECK, never an incidental PK conflict.
 * Single parameter $1 = the FOREIGN tenant id, applied under the caller's
 * own GUC. */
const MISMATCHED_INSERT: Record<string, string> = {
  audit_events: `INSERT INTO audit_events (id, tenant_id, action, entity_type, entity_id)
     VALUES ('eeeeeeee-3000-4000-8000-000000000003', $1, 'iso.attack', 'iso_fixture', $1)`,
  memberships: `INSERT INTO memberships (id, tenant_id, user_id, role_id)
     VALUES ('ffffffff-3000-4000-8000-000000000003', $1,
             'eeeeeeee-0000-4000-8000-000000000002', 'dddddddd-0000-4000-8000-000000000002')`,
  invitations: `INSERT INTO invitations (id, tenant_id, email, role_id, token_hash, expires_at, invited_by)
     VALUES ('eeeeeeee-4000-4000-8000-000000000003', $1, 'iso-attack@test',
             'dddddddd-0000-4000-8000-000000000002', 'iso-attack-token', now() + interval '72 hours',
             'eeeeeeee-0000-4000-8000-000000000002')`,
  roles: `INSERT INTO roles (id, tenant_id, key, name)
     VALUES ('dddddddd-3000-4000-8000-000000000003', $1, 'attack_role', 'Attack Role')`,
  role_permissions: `INSERT INTO role_permissions (role_id, tenant_id, permission_id)
     VALUES ('dddddddd-0000-4000-8000-000000000002', $1, 'partners.view')`,
  branches: `INSERT INTO branches (id, tenant_id, code, name)
     VALUES ('abababab-3000-4000-8000-000000000003', $1, 'ATK', 'Attack Branch')`,
  tenant_settings: `INSERT INTO tenant_settings (id, tenant_id, key, value)
     VALUES ('acacacac-3000-4000-8000-000000000003', $1, 'sales.credit_limit_action', '"warn"'::jsonb)`,
  subscriptions: `INSERT INTO subscriptions (id, tenant_id, plan_id, period_start, period_end)
     VALUES ('adadadad-3000-4000-8000-000000000003', $1,
             '30000000-0000-4000-8000-000000000002', '2026-01-01', '2026-12-31')`,
  entitlements: `INSERT INTO entitlements (id, tenant_id, feature_key, source)
     VALUES ('aeaeaeae-3000-4000-8000-000000000003', $1, 'pos.sales', 'MANUAL')`,
  support_sessions: `INSERT INTO support_sessions (id, tenant_id, platform_user_id, opt_in, ticket_ref, reason, expires_at)
     VALUES ('afafafaf-3000-4000-8000-000000000003', $1,
             'eeeeeeee-0000-4000-8000-000000000001', false, 'ISO-ATK', 'attack fixture',
             now() + interval '4 hours')`,
  accounts: `INSERT INTO accounts (id, tenant_id, code, name, name_ar, type, is_postable)
     VALUES ('b0b0b0b0-3000-4000-8000-000000000003', $1, '2000', 'Attack Account', 'حساب هجوم', 'ASSET', false)`,
  account_purposes: `INSERT INTO account_purposes (id, tenant_id, purpose_key, account_id, active_from)
     VALUES ('b1b1b1b1-3000-4000-8000-000000000003', $1, 'AP_CONTROL',
             'b0b0b0b0-0000-4000-8000-000000000002', '2026-01-01')`,
};

beforeAll(async () => {
  ensureTestDb();
  const su = await superuserClient();
  await seedFixtures(su);
  await su.end();
});

describe("registry completeness (negative proof — new tenant table must register)", () => {
  it("every public table with a tenant_id column is registered", async () => {
    const su = await superuserClient();
    const tables = await su.query<{ table_name: string }>(
      `SELECT DISTINCT table_name FROM information_schema.columns
        WHERE table_schema = 'public' AND column_name = 'tenant_id'`,
    );
    const inDb = tables.rows.map((row) => row.table_name).sort();
    await su.end();
    expect(inDb).toEqual([...TENANT_TABLE_NAMES].sort());
  });

  it("registered names resolve to real tables (no stale registry rows)", async () => {
    const su = await superuserClient();
    const tables = await su.query<{ table_name: string }>(
      `SELECT tablename AS table_name FROM pg_tables WHERE schemaname = 'public'`,
    );
    const names = new Set(tables.rows.map((row) => row.table_name));
    await su.end();
    for (const name of TENANT_TABLE_NAMES) {
      expect(names.has(name)).toBe(true);
    }
  });
});

describe("structural catalog assertions (FORCE RLS + USING/WITH CHECK)", () => {
  it("every registered table: ENABLE+FORCE RLS with the macro policy applicable to erp_app", async () => {
    const su = await superuserClient();
    const rows = await su.query<{
      tablename: string;
      rls_forced: boolean;
      usings: string | null;
      with_checks: string | null;
      applies: boolean | null;
    }>(
      `SELECT c.relname AS tablename, c.relforcerowsecurity AS rls_forced,
              (SELECT string_agg(p.qual, ' OR ') FROM pg_policies p
                WHERE p.schemaname='public' AND p.tablename=c.relname AND p.policyname='tenant_isolation') AS usings,
              (SELECT string_agg(p.with_check, ' OR ') FROM pg_policies p
                WHERE p.schemaname='public' AND p.tablename=c.relname AND p.policyname='tenant_isolation') AS with_checks,
              (SELECT bool_or('erp_app' = ANY(p.roles)) FROM pg_policies p
                WHERE p.schemaname='public' AND p.tablename=c.relname AND p.policyname='tenant_isolation') AS applies
         FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname='public' AND c.relname = ANY($1)`,
      [TENANT_TABLE_NAMES],
    );
    await su.end();
    expect(rows.rows).toHaveLength(TENANT_TABLE_NAMES.length);
    for (const row of rows.rows) {
      expect(row.rls_forced, `${row.tablename} FORCE RLS`).toBe(true);
      expect(row.applies, `${row.tablename} policy TO erp_app`).toBe(true);
      expect(row.usings, `${row.tablename} USING`).toMatch(/tenant_id = erp\.current_tenant_id\(\)/);
      expect(row.with_checks, `${row.tablename} WITH CHECK`).toMatch(
        /tenant_id = erp\.current_tenant_id\(\)/,
      );
    }
  });
});

describe("generated attack suite A1–A10 — as erp_app", () => {
  for (const table of TENANT_TABLE_NAMES) {
    const [, foreignRow] = OWN_ROW[table]!;
    const idColumn = table === "role_permissions" ? "role_id" : "id";

    it(`A1 ${table}: SELECT without GUC → 0 tenant rows`, async () => {
      const app = await appClient();
      const result = await app.query<{ n: number }>(
        `SELECT count(*)::int AS n FROM ${table} WHERE tenant_id IS NOT NULL`,
      );
      await app.end();
      expect(result.rows[0]?.n).toBe(0);
    });

    it(`A2 ${table}: foreign GUC never exposes this tenant's rows`, async () => {
      const app = await appClient();
      await app.query("BEGIN");
      await app.query("SELECT set_config('erp.tenant_id', $1, true)", [TENANT_B]);
      const own = await app.query<{ n: number }>(
        `SELECT count(*)::int AS n FROM ${table} WHERE tenant_id = $1`,
        [TENANT_A],
      );
      const total = await app.query<{ n: number }>(
        `SELECT count(*)::int AS n FROM ${table} WHERE tenant_id IS NOT NULL`,
      );
      await app.query("COMMIT");
      await app.end();
      expect(own.rows[0]?.n).toBe(0);
      // Only tenant B's own rows (variant tables additionally expose the
      // tenant_id IS NULL templates — never tenant A's rows).
      if (VARIANT.has(table)) {
        expect(total.rows[0]?.n).toBe(1);
      } else {
        expect(total.rows[0]?.n).toBe(1);
      }
    });

    it(`A3 ${table}: INSERT with mismatched tenant_id → 42501`, async () => {
      const app = await appClient();
      await app.query("BEGIN");
      await app.query("SELECT set_config('erp.tenant_id', $1, true)", [TENANT_A]);
      await expect(app.query(MISMATCHED_INSERT[table]!, [TENANT_B])).rejects.toMatchObject({
        code: "42501",
      });
      await app.query("ROLLBACK");
      await app.end();
    });

    it(`A4/A7 ${table}: UPDATE and id-probe under own GUC touch 0 foreign rows`, async () => {
      const app = await appClient();
      await app.query("BEGIN");
      await app.query("SELECT set_config('erp.tenant_id', $1, true)", [TENANT_A]);
      const probe = await app.query<{ n: number }>(
        `SELECT count(*)::int AS n FROM ${table} WHERE ${idColumn} = $1`,
        [foreignRow],
      );
      if (table === "audit_events") {
        // UPDATE is grant-denied (A5 shape, proven in rls-attacks.db.spec):
        // the denial itself proves the row cannot be touched.
        await expect(
          app.query(`UPDATE ${table} SET action = 'hacked' WHERE id = $1`, [foreignRow]),
        ).rejects.toMatchObject({ code: "42501" });
      } else if (table === "role_permissions") {
        // Association table: no UPDATE grant by design (grants change via
        // delete + insert — migration 0003) → any UPDATE is grant-denied.
        await expect(
          app.query(`UPDATE ${table} SET granted_at = granted_at WHERE role_id = $1`, [
            foreignRow,
          ]),
        ).rejects.toMatchObject({ code: "42501" });
      } else {
        const touched = await app.query(
          `UPDATE ${table} SET updated_at = now() WHERE id = $1`,
          [foreignRow],
        );
        expect(touched.rowCount).toBe(0);
      }
      await app.query("COMMIT");
      await app.end();
      expect(probe.rows[0]?.n).toBe(0);
    });

    it(`A5 ${table}: DELETE of the OTHER tenant's row is denied or touches 0 rows`, async () => {
      const app = await appClient();
      await app.query("BEGIN");
      await app.query("SELECT set_config('erp.tenant_id', $1, true)", [TENANT_A]);
      if (VARIANT.has(table) || DELETE_GRANTED.has(table)) {
        // roles/role_permissions DO carry DELETE (custom-role lifecycle,
        // migration 0003) and entitlements carry it too (the materiali-
        // zation upsert's symmetric half) — the policy confines deletes to
        // own-tenant rows, so a foreign-row DELETE affects exactly 0 rows.
        const result = await app.query(`DELETE FROM ${table} WHERE ${idColumn} = $1`, [
          foreignRow,
        ]);
        expect(result.rowCount).toBe(0);
      } else {
        // audit_events/memberships/invitations: no DELETE grant by design.
        await expect(
          app.query(`DELETE FROM ${table} WHERE ${idColumn} = $1`, [foreignRow]),
        ).rejects.toMatchObject({ code: "42501" });
      }
      await app.query("ROLLBACK");
      await app.end();
    });

    it(`A8/A9/A10 ${table}: aggregates, joins, and union/CTE shapes stay confined`, async () => {
      const app = await appClient();
      const aggregate = await app.query<{ n: number }>(
        `SELECT count(*)::int AS n FROM ${table} WHERE tenant_id IS NOT NULL`,
      );
      const joined = await app.query<{ n: number }>(
        `SELECT count(*)::int AS n FROM ${table} t JOIN tenants x ON x.id = t.tenant_id`,
      );
      const unioned = await app.query<{ n: number }>(
        `WITH u AS (SELECT tenant_id FROM ${table} UNION ALL SELECT tenant_id FROM ${table})
         SELECT count(*)::int AS n FROM u WHERE tenant_id IS NOT NULL`,
      );
      await app.end();
      expect(aggregate.rows[0]?.n).toBe(0);
      expect(joined.rows[0]?.n).toBe(0);
      expect(unioned.rows[0]?.n).toBe(0);
    });
  }
});

describe("template guards (roles/role_permissions variant policy)", () => {
  it("erp_app can never INSERT, UPDATE, or DELETE a system-template row", async () => {
    // Each rejection runs in its OWN transaction: a denied statement aborts
    // the surrounding transaction, so a shared BEGIN would mask later codes
    // (25P02) — the same discipline as the PHASE-002 append-only proofs.
    const app = await appClient();
    const expectRejectedInTx = async (sql: string) => {
      await app.query("BEGIN");
      await app.query("SELECT set_config('erp.tenant_id', $1, true)", [TENANT_A]);
      try {
        await app.query(sql);
        expect.unreachable("must be rejected");
      } catch (error) {
        expect((error as { code?: string }).code).toBe("42501");
      } finally {
        await app.query("ROLLBACK");
      }
    };

    // INSERT forging a template row → WITH CHECK requires the own tenant.
    await expectRejectedInTx(
      `INSERT INTO roles (id, tenant_id, key, name, is_system)
       VALUES ('dddddddd-9999-4999-8999-999999999999', NULL, 'forged', 'Forged', true)`,
    );
    // UPDATE of a template row → WITH CHECK denies the NULL-tenant result.
    await expectRejectedInTx(
      `UPDATE roles SET name = 'HACKED' WHERE tenant_id IS NULL AND key = 'owner'`,
    );

    // DELETE attacks: the delete-guard policy makes template rows
    // INVISIBLE to the DELETE command — the statement succeeds but must
    // affect exactly 0 rows (nothing silently disappears for any tenant).
    const delApp = await appClient();
    await delApp.query("BEGIN");
    await delApp.query("SELECT set_config('erp.tenant_id', $1, true)", [TENANT_A]);
    const rolesDeleted = await delApp.query(
      `DELETE FROM roles WHERE tenant_id IS NULL AND key = 'owner'`,
    );
    const grantsDeleted = await delApp.query(
      `DELETE FROM role_permissions rp
         USING roles r
        WHERE r.id = rp.role_id AND r.tenant_id IS NULL AND r.key = 'owner'`,
    );
    await delApp.query("ROLLBACK");
    await delApp.end();
    expect(rolesDeleted.rowCount).toBe(0);
    expect(grantsDeleted.rowCount).toBe(0);
  });

  it("erp_migrate CAN seed template rows (template_seed policy) — and only NULL-tenant rows", async () => {
    const su = await superuserClient();
    await su.query("SET ROLE erp_migrate");
    await su.query("BEGIN");
    await expect(
      su.query(
        `INSERT INTO roles (id, tenant_id, key, name, is_system)
         VALUES ('dddddddd-8888-4888-8888-888888888888', NULL, 'seed_probe', 'Seed Probe', true)`,
      ),
    ).resolves.toBeTruthy();
    // But erp_migrate cannot forge a TENANT row through the seed path.
    await expect(
      su.query(
        `INSERT INTO roles (id, tenant_id, key, name, is_system)
         VALUES ('dddddddd-7777-4777-8777-777777777777', $1, 'tenant_probe', 'Tenant Probe', false)`,
        [TENANT_A],
      ),
    ).rejects.toMatchObject({ code: "42501" });
    await su.query("ROLLBACK");
    await su.query("RESET ROLE");
    await su.end();
  });

  it("A6 composite FK: membership cannot reference another tenant's role", async () => {
    const su = await superuserClient();
    await expect(
      su.query(
        `INSERT INTO memberships (id, tenant_id, user_id, role_id)
         VALUES ('ffffffff-1111-4111-8111-111111111111', $1,
                 'eeeeeeee-0000-4000-8000-000000000002',
                 'dddddddd-0000-4000-8000-000000000002')`,
        [TENANT_A], // tenant A membership pointing at tenant B's role id
      ),
    ).rejects.toMatchObject({ code: "23503" });
    await su.end();
  });
});
