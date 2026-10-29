import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * PHASE-002 infrastructure + PHASE-003 identity cluster (ADR-0004/0005,
 * DATABASE_CONVENTIONS §3–5; TABLES/tenancy-identity.md).
 *
 * Only infrastructure exists at this phase: the minimal `tenants` row (full
 * profile arrives with PHASE-004) and the append-only `audit_events` trail.
 * The PHASE-003 identity tables mirror migration `0003_identity_core.sql`
 * (sync rule, docs/database/README.md). Every tenant-owned table carries
 * `tenant_id uuid not null`, RLS policies, and `FORCE ROW LEVEL SECURITY` —
 * enforced by `scripts/check-rls.ts` in CI. Global/user-owned tables
 * (`users`, `permissions`, `sessions`, `devices`, `mfa_factors`) carry no
 * tenant RLS by design (PHASE-003 §4: service-mediated, permission-checked).
 */

/** Standard columns (DATABASE_CONVENTIONS §5). */
const standardColumns = {
  id: uuid("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull(),
  version: integer("version").notNull().default(1),
} as const;

/**
 * PHASE-002 minimal tenant row: id, name (bilingual per conventions §4), status.
 * The full tenant profile (currency, country, timezone, industry template,
 * deleted_at) arrives with PHASE-003 per the phase plan §2 item 5.
 *
 * RLS: `tenant_isolation` policy via `erp.current_tenant_id()` plus the
 * platform-scope GUC path for admin-plane access (TENANT_ISOLATION §3.2).
 */
export const tenants = pgTable(
  "tenants",
  {
    ...standardColumns,
    name: text("name").notNull(),
    nameAr: text("name_ar"),
    status: text("status").notNull().default("ACTIVE"),
    // PHASE-004 profile expansion (migration 0006; TABLES/tenancy-identity.md)
    baseCurrency: varchar("base_currency", { length: 3 }).notNull(),
    countryCode: varchar("country_code", { length: 2 }).notNull(),
    timezone: text("timezone").notNull().default("UTC"),
    industryTemplateKey: text("industry_template_key"),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
  },
  (table) => [index("ix_tenants_status").on(table.status)],
);

/**
 * Append-only audit trail (TENANT_ISOLATION, OBSERVABILITY §Audit vs telemetry;
 * INV-003 substrate). UPDATE/DELETE are denied by both grants and the
 * `erp.audit_events_guard()` trigger — enforced by attack tests A1–A5/A10.
 *
 * `actor_id`/`device_id` have no FK until users (PHASE-003) and devices
 * (PHASE-020) exist — expand-phase pattern (MIGRATION_STRATEGY §3).
 */
export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").primaryKey(),
    // PHASE-004: NULL carries platform-scope rows (migration 0006 widening).
    tenantId: uuid("tenant_id"),
    actorId: uuid("actor_id"),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    before: jsonb("before"),
    after: jsonb("after"),
    correlationId: uuid("correlation_id"),
    deviceId: uuid("device_id"),
    at: timestamp("at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    // PHASE-004 (matrix §3.10/§7): true on every platform-admin-path action.
    viaPlatformAdmin: boolean("via_platform_admin").notNull().default(false),
  },
  (table) => [
    index("ix_audit_events_tenant_at").on(table.tenantId, table.at),
    index("ix_audit_events_tenant_entity_at").on(
      table.tenantId,
      table.entityType,
      table.entityId,
      table.at,
    ),
  ],
);

/**
 * PHASE-003 identity cluster (TABLES/tenancy-identity.md; migration 0003).
 * users/permissions/sessions/devices/mfa_factors: global or user-owned — no
 * tenant RLS (service-mediated, permission-checked). roles/role_permissions
 * carry the documented template-variant RLS policy; memberships/invitations
 * the standard macro policy.
 */
export const users = pgTable(
  "users",
  {
    ...standardColumns,
    email: text("email").notNull(),
    phone: text("phone"),
    fullName: text("full_name").notNull(),
    passwordHash: text("password_hash").notNull(),
    status: text("status").notNull().default("PENDING"),
    locale: text("locale").notNull().default("ar"),
    failedLoginCount: integer("failed_login_count").notNull().default(0),
    lockedUntil: timestamp("locked_until", { withTimezone: true, mode: "string" }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true, mode: "string" }),
  },
  (table) => [index("ix_users_status").on(table.status)],
);

export const permissions = pgTable(
  "permissions",
  {
    key: text("key").primaryKey(),
    module: text("module").notNull(),
    description: text("description").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("ix_permissions_module").on(table.module)],
);

export const roles = pgTable(
  "roles",
  {
    ...standardColumns,
    tenantId: uuid("tenant_id"),
    key: text("key").notNull(),
    name: text("name").notNull(),
    nameAr: text("name_ar"),
    isSystem: boolean("is_system").notNull().default(false),
  },
  (table) => [index("ix_roles_tenant").on(table.tenantId)],
);

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id").notNull(),
    tenantId: uuid("tenant_id"),
    permissionId: text("permission_id").notNull(),
    grantedAt: timestamp("granted_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    grantedBy: uuid("granted_by"),
  },
  (table) => [index("ix_role_permissions_tenant").on(table.tenantId)],
);

export const memberships = pgTable(
  "memberships",
  {
    ...standardColumns,
    tenantId: uuid("tenant_id").notNull(),
    createdBy: uuid("created_by"),
    userId: uuid("user_id").notNull(),
    roleId: uuid("role_id").notNull(),
    branchScope: uuid("branch_scope").array(),
    status: text("status").notNull().default("ACTIVE"),
  },
  (table) => [
    index("ix_memberships_tenant_user").on(table.tenantId, table.userId),
    index("ix_memberships_user").on(table.userId),
  ],
);

export const devices = pgTable("devices", {
  ...standardColumns,
  userId: uuid("user_id").notNull(),
  platform: text("platform").notNull(),
  name: text("name"),
  deviceKeyHash: text("device_key_hash").notNull(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true, mode: "string" }),
  revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "string" }),
});

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id").notNull(),
    tokenHash: text("token_hash").notNull(),
    activeTenantId: uuid("active_tenant_id"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "string" }),
    ip: varchar("ip", { length: 45 }),
    deviceId: uuid("device_id"),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("ix_sessions_user_expires").on(table.userId, table.expiresAt),
    index("ix_sessions_active_tenant").on(table.activeTenantId),
  ],
);

export const mfaFactors = pgTable(
  "mfa_factors",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id").notNull(),
    kind: text("kind").notNull().default("TOTP"),
    secretEnc: text("secret_enc").notNull(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true, mode: "string" }),
    enrolledAt: timestamp("enrolled_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true, mode: "string" }),
    recoveryCodesHash: text("recovery_codes_hash").array(),
  },
  (table) => [index("ix_mfa_factors_user").on(table.userId)],
);

export const invitations = pgTable(
  "invitations",
  {
    ...standardColumns,
    tenantId: uuid("tenant_id").notNull(),
    createdBy: uuid("created_by"),
    email: text("email").notNull(),
    roleId: uuid("role_id").notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true, mode: "string" }),
    status: text("status").notNull().default("PENDING"),
    invitedBy: uuid("invited_by").notNull(),
  },
  (table) => [index("ix_invitations_tenant_status").on(table.tenantId, table.status)],
);

// ---------------------------------------------------------------------------
// PHASE-004 tenancy provisioning cluster (migrations 0006–0008;
// TABLES/tenancy-identity.md + TABLES/core-accounting.md).
// ---------------------------------------------------------------------------

/** Global reference: ISO-4217 currencies (no tenant_id, no RLS — read-only). */
export const currencies = pgTable("currencies", {
  code: varchar("code", { length: 3 }).primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  minorUnits: integer("minor_units").notNull().default(2),
  symbol: text("symbol"),
  isActive: boolean("is_active").notNull().default(true),
});

/** Global reference: in-scope countries + display defaults. */
export const countries = pgTable("countries", {
  code: varchar("code", { length: 2 }).primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  defaultLocale: text("default_locale").notNull().default("ar"),
  currencyCode: varchar("currency_code", { length: 3 }).notNull(),
  dateFormat: text("date_format").notNull().default("dd/MM/yyyy"),
  timeZone: text("time_zone").notNull().default("UTC"),
  isActive: boolean("is_active").notNull().default(true),
});

/** Global reference: industry-template index (list only; engine = PHASE-015). */
export const industryTemplates = pgTable("industry_templates", {
  key: text("key").primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  version: text("version").notNull().default("1.0.0"),
  manifest: jsonb("manifest").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

/** Global reference: default bilingual CoA template (CHART_OF_ACCOUNTS §3). */
export const chartOfAccountsTemplate = pgTable("chart_of_accounts_template", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  type: text("type").notNull(),
  isGroup: boolean("is_group").notNull().default(false),
  parentCode: text("parent_code"),
  purposeKey: text("purpose_key"),
});

/** Operating units (tenant-owned, macro RLS; deactivate — never delete). */
export const branches = pgTable(
  "branches",
  {
    ...standardColumns,
    tenantId: uuid("tenant_id").notNull(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    nameAr: text("name_ar"),
    address: jsonb("address"),
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => [
    index("ix_branches_tenant").on(table.tenantId),
    uniqueIndex("uq_branches_tenant_code").on(table.tenantId, table.code),
  ],
);

/** Typed key-value tenant settings (L5; macro RLS). */
export const tenantSettings = pgTable(
  "tenant_settings",
  {
    ...standardColumns,
    tenantId: uuid("tenant_id").notNull(),
    key: text("key").notNull(),
    value: jsonb("value").notNull(),
    updatedBy: uuid("updated_by"),
  },
  (table) => [
    index("ix_tenant_settings_tenant").on(table.tenantId),
    uniqueIndex("uq_tenant_settings_tenant_key").on(table.tenantId, table.key),
  ],
);

/** Platform-level subscription plans (RLS: tenant read + platform write path). */
export const plans = pgTable(
  "plans",
  {
    ...standardColumns,
    key: text("key").notNull(),
    name: text("name").notNull(),
    nameAr: text("name_ar").notNull(),
    priceAmount: numeric("price_amount", { precision: 19, scale: 4 }).notNull(),
    currencyCode: varchar("currency_code", { length: 3 }).notNull(),
    billingPeriod: text("billing_period").notNull().default("MONTHLY"),
    limits: jsonb("limits").notNull(),
    featureKeys: text("feature_keys").array().notNull(),
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => [uniqueIndex("uq_plans_key").on(table.key)],
);

/** Tenant plan assignment (minimal — billing columns land PHASE-014). */
export const subscriptions = pgTable(
  "subscriptions",
  {
    ...standardColumns,
    tenantId: uuid("tenant_id").notNull(),
    planId: uuid("plan_id").notNull(),
    status: text("status").notNull().default("ACTIVE"),
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),
    providerRef: text("provider_ref"),
  },
  (table) => [index("ix_subscriptions_tenant").on(table.tenantId)],
);

/** Materialized feature grants (macro RLS; upserted by the entitlement service). */
export const entitlements = pgTable(
  "entitlements",
  {
    ...standardColumns,
    tenantId: uuid("tenant_id").notNull(),
    featureKey: text("feature_key").notNull(),
    source: text("source").notNull().default("PLAN"),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }),
  },
  (table) => [
    index("ix_entitlements_tenant").on(table.tenantId),
    uniqueIndex("uq_entitlements_tenant_feature").on(table.tenantId, table.featureKey),
  ],
);

/** Time-boxed audited support sessions (matrix §7; macro RLS). */
export const supportSessions = pgTable(
  "support_sessions",
  {
    ...standardColumns,
    tenantId: uuid("tenant_id").notNull(),
    platformUserId: uuid("platform_user_id").notNull(),
    optIn: boolean("opt_in").notNull().default(false),
    ticketRef: text("ticket_ref"),
    reason: text("reason").notNull(),
    openedAt: timestamp("opened_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }).notNull(),
    closedAt: timestamp("closed_at", { withTimezone: true, mode: "string" }),
    closedBy: uuid("closed_by"),
    status: text("status").notNull().default("ACTIVE"),
  },
  (table) => [index("ix_support_sessions_tenant_status").on(table.tenantId, table.status)],
);

/** CoA nodes (created in 004 for onboarding instantiation; posting = 007). */
export const accounts = pgTable(
  "accounts",
  {
    ...standardColumns,
    tenantId: uuid("tenant_id").notNull(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    nameAr: text("name_ar").notNull(),
    type: text("type").notNull(),
    parentId: uuid("parent_id"),
    isPostable: boolean("is_postable").notNull().default(false),
    currencyCode: varchar("currency_code", { length: 3 }),
    status: text("status").notNull().default("ACTIVE"),
  },
  (table) => [
    index("ix_accounts_tenant_parent").on(table.tenantId, table.parentId),
    index("ix_accounts_tenant_type").on(table.tenantId, table.type),
    uniqueIndex("uq_accounts_tenant_code").on(table.tenantId, table.code),
  ],
);

/** Purpose → account mapping (posting engine resolution substrate, 007). */
export const accountPurposes = pgTable(
  "account_purposes",
  {
    ...standardColumns,
    tenantId: uuid("tenant_id").notNull(),
    purposeKey: text("purpose_key").notNull(),
    accountId: uuid("account_id").notNull(),
    activeFrom: date("active_from").notNull(),
    activeTo: date("active_to"),
  },
  (table) => [
    index("ix_account_purposes_tenant").on(table.tenantId),
    uniqueIndex("uq_account_purposes_tenant_purpose_active")
      .on(table.tenantId, table.purposeKey)
      .where(sql`${table.activeTo} IS NULL`),
  ],
);
