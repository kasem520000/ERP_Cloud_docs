/**
 * Tenant-owned table registry (PHASE-003 T13; SECURITY_TEST_PLAN §2
 * "per-phase expansion rule"; extended by PHASE-004): every `tenant_id`-
 * bearing table in `public` must be registered here — the generated
 * A1–A10 suite iterates this list, and a registry CI check fails when a
 * new tenant-owned table ships without registering (the negative proof
 * the phase demands).
 *
 * Variant-policy tables (roles, role_permissions: system templates
 * readable with tenant_id IS NULL) are registered with their variant
 * flag so the generated suite applies their documented expectations
 * (A2 reads see template rows; writes still never cross tenants).
 *
 * PHASE-004 additions (migration 0006/0007): branches, tenant_settings,
 * subscriptions, entitlements, support_sessions, accounts,
 * account_purposes. `entitlements` additionally carries the DELETE grant
 * (the materialization upsert's symmetric half) — its A5 expectation is
 * "policy-confined delete touches 0 foreign rows" instead of the
 * grant-denial shape.
 */

export interface RegisteredTenantTable {
  readonly table: string;
  /** True for roles/role_permissions (template rows visible across tenants). */
  readonly variantTemplateRows?: boolean;
  /** True when the app role legitimately holds DELETE (entitlements). */
  readonly deleteGranted?: boolean;
}

export const TENANT_TABLES_REGISTRY: readonly RegisteredTenantTable[] = [
  { table: "audit_events" },
  { table: "memberships" },
  { table: "invitations" },
  { table: "roles", variantTemplateRows: true },
  { table: "role_permissions", variantTemplateRows: true },
  { table: "branches" },
  { table: "tenant_settings" },
  { table: "subscriptions" },
  { table: "entitlements", deleteGranted: true },
  { table: "support_sessions" },
  { table: "accounts" },
  { table: "account_purposes" },
];

export const TENANT_TABLE_NAMES: readonly string[] = TENANT_TABLES_REGISTRY.map(
  (row) => row.table,
);
