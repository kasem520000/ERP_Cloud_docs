# TABLES — Tenancy & Identity Cluster

> **Status:** STABLE · **Owner:** Database Architecture · **Updated:** 2026-10-27 · **Phases:** 002–004 (subscriptions 014, devices-sync 020)

Column-level specification for the tenancy & identity cluster, consistent with
[ENTITY_CATALOG.md](../ENTITY_CATALOG.md), [DATABASE_CONVENTIONS.md](../DATABASE_CONVENTIONS.md),
[DATA_DICTIONARY.md](../DATA_DICTIONARY.md) (standard columns, enums, code rules), and
the [ERD/tenancy-identity.md](../ERD/tenancy-identity.md) diagram. Drizzle schema is the
machine-readable mirror (sync rule, [README.md](../README.md)). All tables below are
tenant-owned + RLS unless noted.

Standard columns (`id uuid PK UUIDv7`, `created_at`, `updated_at`, `version`, and
`created_by` where a user context exists) apply per [DATABASE_CONVENTIONS.md](../DATABASE_CONVENTIONS.md) §5
and are **listed once here, not repeated per table** unless a table deviates. Types per
[ADR-0009](../../architecture/ADR/ADR-0009-money-precision.md); enums per
[DATA_DICTIONARY.md](../DATA_DICTIONARY.md) §9.

## `tenants` — customer organizations (PHASE-003)

| Column | Type | Null | Default | Constraints | Description |
|--------|------|------|---------|-------------|-------------|
| `id` | uuid | no | — | PK (UUIDv7) | Technical identity |
| `name` | text | no | — | — | Primary (EN or AR) display name |
| `name_ar` | text | yes | — | — | Arabic name (bilingual pattern) |
| `status` | text | no | `ACTIVE` | ck: `ACTIVE \| SUSPENDED \| OFFBOARDED` | Suspension blocks logins+jobs; OFFBOARDED = retention window state (OQ-009) |
| `base_currency` | char(3) | no | — | FK → `currencies.code` | The single bookkeeping currency (A-003) |
| `country_code` | char(2) | no | — | FK → seeded countries | Primary jurisdiction (pack default) |
| `timezone` | text | no | `'UTC'` | IANA name (validated) | Display timezone for reports/audit |
| `industry_template_key` | text | yes | — | references seeded `industry_templates.key` | Applied template (nullable until onboarding picks one, PHASE-004/015) |
| `deleted_at` | timestamptz | yes | — | — | Offboarding soft-delete (data enters retention window) |

RLS: platform-scope GUC path ([TENANT_ISOLATION.md](../TENANT_ISOLATION.md) §3) — the
tenancy module's services are the only readers/writers.

## `branches` — operating units (PHASE-004)

| Column | Type | Null | Default | Constraints | Description |
|--------|------|------|---------|-------------|-------------|
| `id`, `tenant_id` + standard | — | — | — | `UNIQUE (id, tenant_id)` | composite-FK anchor |
| `code` | text | no | — | `uq_branches_tenant_code` | Per-tenant code |
| `name` / `name_ar` | text | no / yes | — | — | Bilingual name |
| `address` | jsonb | yes | — | — | Structured address (line/city/country) — display data only |
| `is_active` | boolean | no | `true` | — | Inactive branches block new documents, keep history |

## `users` — global identity (PHASE-003)

| Column | Type | Null | Default | Constraints | Description |
|--------|------|------|---------|-------------|-------------|
| `id` | uuid | no | — | PK (UUIDv7) | Global (not tenant-scoped — no `tenant_id`) |
| `email` | text | no | — | `uq_users_email` (case-insensitive) | Login identity |
| `phone` | text | yes | — | `uq_users_phone` (where not null) | Optional second factor / recovery channel |
| `full_name` | text | no | — | — | Display name (single field; locale display is enough) |
| `password_hash` | text | no | — | — | Argon2id per [ADR-0015](../../architecture/ADR/ADR-0015-authentication.md); never logged |
| `status` | text | no | `PENDING` | ck: `PENDING \| ACTIVE \| LOCKED \| DEACTIVATED` | PENDING = invited/never logged in; LOCKED = failed-login lockout (`locked_until`) |
| `locale` | text | no | `'ar'` | `ar \| en` | UI default; users switch per session |
| `failed_login_count` | int | no | `0` | — | Reset on success; drives lockout |
| `locked_until` | timestamptz | yes | — | — | Transient lockout timestamp |
| `last_login_at` | timestamptz | yes | — | — | Security monitoring |

## `memberships` — user ↔ tenant with role (PHASE-003)

| Column | Type | Null | Default | Constraints | Description |
|--------|------|------|---------|-------------|-------------|
| `id`, `tenant_id` + standard | — | — | — | composite FKs | — |
| `user_id` | uuid | no | — | FK → `users(id)` | — |
| `role_id` | uuid | no | — | composite FK → `roles(id, tenant_id)` | Tenant role at join time |
| `branch_scope` | uuid[] | yes | — | all branches if null; else branch id list | Branch-scoped authorization (documents filtered per branch) |
| `status` | text | no | `ACTIVE` | ck: `ACTIVE \| REVOKED` | REVOKED preserves audit linkage |

`UNIQUE (user_id, tenant_id)` — one membership row per user per tenant (role changes are
updates, audited).

## `roles` — tenant roles + system templates (PHASE-003)

| Column | Type | Null | Default | Constraints | Description |
|--------|------|------|---------|-------------|-------------|
| `id` | uuid | no | — | PK | — |
| `tenant_id` | uuid | yes | — | `uq_roles_tenant_key (tenant_id, key)`; system templates have `tenant_id IS NULL` (partial unique) | NULL = seeded system template (admin, accountant, cashier…) |
| `key` | text | no | — | — | Machine key (`tenant_admin`) |
| `name` / `name_ar` | text | no / yes | — | — | Display labels |
| `is_system` | boolean | no | `false` | — | System roles can't be deleted; permissions editable only within template rules |

## `permissions` — atomic action catalog (seeded, PHASE-003)

| Column | Type | Null | Default | Constraints | Description |
|--------|------|------|---------|-------------|-------------|
| `key` | text | no | — | **PK** (natural: `sales.invoices.post`) | Global reference table: no `tenant_id`, no RLS; read-only to app role |
| `module` | text | no | — | — | Owning module (matches feature-key prefix) |
| `description` | text | no | — | — | Review UI copy |
| `created_at` | timestamptz | no | now() | — | Seed version marker |

## `role_permissions` — grants (PHASE-003)

| Column | Type | Null | Default | Constraints | Description |
|--------|------|------|---------|-------------|-------------|
| `role_id` | uuid | no | — | composite FK → `roles(id, tenant_id)`; `UNIQUE (role_id, permission_id)`; ON DELETE CASCADE | — |
| `permission_id` | text | no | — | FK → `permissions.key` | — |
| `granted_at` | timestamptz | no | now() | — | — |
| `granted_by` | uuid | yes | — | — | NULL for template seed grants |

## `sessions` — web sessions (PHASE-003)

| Column | Type | Null | Default | Constraints | Description |
|--------|------|------|---------|-------------|-------------|
| `id` | uuid | no | — | PK | — |
| `user_id` | uuid | no | — | FK → `users(id)`; `ix_sessions_user_expires` | — |
| `token_hash` | text | no | — | `uq_sessions_token_hash` | Server stores hash only ([ADR-0015](../../architecture/ADR/ADR-0015-authentication.md)) |
| `active_tenant_id` | uuid | yes | — | FK → `tenants(id)` | Selected tenant **convenience only** — authorization derives from `memberships`, never this column |
| `expires_at` | timestamptz | no | — | — | Sliding window per auth policy |
| `revoked_at` | timestamptz | yes | — | — | Explicit logout / security revoke |
| `ip` | inet | yes | — | — | Security audit |
| `device_id` | uuid | yes | — | FK → `devices(id)` | Native-client sessions |
| `last_seen_at` | timestamptz | no | now() | — | Session reaping + anomaly detection |

## `devices` — registered offline-capable clients (schema PHASE-003, sync PHASE-020)

| Column | Type | Null | Default | Constraints | Description |
|--------|------|------|---------|-------------|-------------|
| `id` | uuid | no | — | PK | — |
| `user_id` | uuid | no | — | FK → `users(id)` | Owning user (personal account device) |
| `platform` | text | no | — | ck: `DESKTOP \| ANDROID` | Client channel (PHASE-021/022) |
| `name` | text | yes | — | — | User label ("Samsung Tab A9") |
| `device_key_hash` | text | no | — | `uq_devices_key_hash` | Device credential (hash only) |
| `last_seen_at` | timestamptz | yes | — | — | Sync health per device |
| `revoked_at` | timestamptz | yes | — | — | Lost/stolen device revocation |

## `mfa_factors` — TOTP enrollment (PHASE-003)

| Column | Type | Null | Default | Constraints | Description |
|--------|------|------|---------|-------------|-------------|
| `id`, `user_id` (+standard) | — | — | — | FK → `users(id)` | One active TOTP factor per user |
| `kind` | text | no | `'TOTP'` | ck: `TOTP` (extensible by decision record) | Factor type |
| `secret_enc` | text | no | — | — | Encrypted TOTP secret per [../../security/SECRETS_MANAGEMENT.md](../../security/SECRETS_MANAGEMENT.md) envelope rules |
| `confirmed_at` | timestamptz | yes | — | — | Enrollment complete only after code verification |
| `enrolled_at` / `last_used_at` | timestamptz | no / yes | now() / — | — | Rotation + re-use detection stats |
| `recovery_codes_hash` | text[] | yes | — | — | Hashed one-time recovery codes |

## `invitations` — membership invitations (PHASE-004)

| Column | Type | Null | Default | Constraints | Description |
|--------|------|------|---------|-------------|-------------|
| `id`, `tenant_id` (+standard) | — | — | — | — | — |
| `email` | text | no | — | — | Invite target (case-insensitive match to users.email) |
| `role_id` | uuid | no | — | composite FK → `roles(id, tenant_id)` | Granted role on acceptance |
| `token_hash` | text | no | — | `uq_invitations_token_hash` | One-time acceptance token (hash only) |
| `expires_at` | timestamptz | no | — | — | Default 72 h |
| `accepted_at` | timestamptz | yes | — | — | Set on acceptance; membership created |
| `status` | text | no | `PENDING` | ck: `PENDING \| ACCEPTED \| EXPIRED \| REVOKED` | — |
| `invited_by` | uuid | no | — | — | Auditable actor |

## `plans` — subscription plans (seeded + admin, PHASE-004)

| Column | Type | Null | Default | Constraints | Description |
|--------|------|------|---------|-------------|-------------|
| `id` | uuid | no | — | PK | Platform-level table (no tenant) |
| `key` | text | no | — | `uq_plans_key` | `starter / business / enterprise` ([product/DR-001](../../decisions/product/DR-001-pricing-tier-structure.md)) |
| `name` | text | no | — | — | Display label |
| `price_amount` | numeric(19,4) | no | — | `CHECK (price_amount >= 0)` | Recurring price |
| `currency_code` | char(3) | no | — | FK → `currencies.code` | Price currency |
| `billing_period` | text | no | `'MONTHLY'` | ck: `MONTHLY \| YEARLY` | — |
| `limits` | jsonb | no | — | — | Tier limits: seats, documents/month, storage, reports (schema owned by billing module; DR-001 makes values concrete) |
| `feature_keys` | text[] | no | — | — | Entitlement keys granted by this plan |
| `is_active` | boolean | no | `true` | — | Retired plans keep history |

## `subscriptions` — tenant plan assignment (PHASE-014; schema minimal earlier)

| Column | Type | Null | Default | Constraints | Description |
|--------|------|------|---------|-------------|-------------|
| `id`, `tenant_id` (+standard) | — | — | — | — | — |
| `plan_id` | uuid | no | — | FK → `plans(id)` | Current plan |
| `status` | text | no | `ACTIVE` | ck: `ACTIVE \| PAST_DUE \| CANCELLED` | PAST_DUE drives dunning + soft entitlement expiry |
| `period_start` / `period_end` | date | no / no | — | `CHECK (period_start <= period_end)` | Billed period |
| `provider_ref` | text | yes | — | — | Payment-provider subscription id ([product/DR-002](../../decisions/product/DR-002-payment-provider-selection.md)); NULL = manual invoicing |

## `entitlements` — materialized feature grants (PHASE-004)

| Column | Type | Null | Default | Constraints | Description |
|--------|------|------|---------|-------------|-------------|
| `id`, `tenant_id` (+standard) | — | — | — | `uq_entitlements_tenant_feature` | Re-materialized by the entitlement service (upsert) |
| `feature_key` | text | no | — | — | `module.feature` (permissions catalog prefix space) |
| `source` | text | no | `'PLAN'` | ck: `PLAN \| MANUAL \| PROMO \| TRIAL` | Manual overrides are audited admin actions |
| `expires_at` | timestamptz | yes | — | — | NULL = while source holds; TRIAL/PROMO carry expiry |

## `tenant_settings` — typed key-value config (PHASE-004)

| Column | Type | Null | Default | Constraints | Description |
|--------|------|------|---------|-------------|-------------|
| `id`, `tenant_id` (+standard) | — | — | — | `uq_tenant_settings_tenant_key` | — |
| `key` | text | no | — | — | Setting key; value schema validated by owning module (INV-022: settings configure, never override math) |
| `value` | jsonb | no | — | — | Typed JSON value; changes write `audit_events` (before/after) |
| `updated_by` | uuid | yes | — | — | Last actor |

## `audit_events` — immutable audit trail (PHASE-002, append-only 🔒)

| Column | Type | Null | Default | Constraints | Description |
|--------|------|------|---------|-------------|-------------|
| `id` | uuid | no | — | PK (UUIDv7) | — |
| `tenant_id` | uuid | yes | — | FK → `tenants(id)`; NULL = platform-scope event | RLS via tenant GUC; platform events via platform-scope path |
| `actor_id` | uuid | yes | — | — | NULL = system/job action (never "unknown user" — the action column says who/what) |
| `action` | text | no | — | — | `entity.updated`, `document.posted`, `user.login`, … (catalog of actions owned by modules) |
| `entity_type` | text | no | — | — | `sales_invoice`, `journal_entry`, `tenant_setting`, … |
| `entity_id` | uuid | yes | — | — | Polymorphic target (audit-only; consumers use `ix_audit_events_tenant_entity_at`) |
| `before` / `after` | jsonb | yes | — | — | State snapshots (redacted per [../../architecture/OBSERVABILITY.md](../../architecture/OBSERVABILITY.md) rules — no secrets, no file bodies) |
| `correlation_id` | uuid | yes | — | — | Request/job correlation (quoted by support) |
| `device_id` | uuid | yes | — | — | Offline-client origin where applicable |
| `at` | timestamptz | no | now() | — | Event time (this is domain data, not a log — OBSERVABILITY §audit-vs-telemetry) |

**Append-only enforcement:** no UPDATE/DELETE grants for `erp_app` + guard triggers
(INV-003 pattern) + RLS both ways. `audit_events` is the substrate every module's audit
requirement builds on ([ENTITY_CATALOG.md](../ENTITY_CATALOG.md) §tenancy).
