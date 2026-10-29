/**
 * Wire types shared across the web app (BFF route handlers, server pages,
 * client forms). Mirrors the PHASE-003 identity + PHASE-004 tenancy/platform
 * API envelopes (docs/api/API_CONVENTIONS.md, docs/api/ERROR_MODEL.md):
 *
 *   success: `{ data, meta: { requestId } }`
 *   error:   `{ error: { code, message, details?, traceId? } }`
 *
 * Hand-written on purpose (ADR-0003): the web side adds no schema library —
 * manual narrowing helpers live next to the types they narrow.
 */

export const SESSION_COOKIE = "erp_session";
export const CSRF_COOKIE = "erp_csrf";

/** Methods that must not be CSRF-checked nor carry Idempotency-Key. */
export const SAFE_METHODS: ReadonlySet<string> = new Set(["GET", "HEAD", "OPTIONS"]);

export interface ApiMeta {
  requestId: string;
}

/**
 * Cursor-pagination meta (API_CONVENTIONS §4). Present on the PHASE-004
 * list endpoints (platform tenants + platform audit events) — surfaced by
 * the fetch wrappers as `ApiResult.meta` for next-page links (P4-T12a).
 */
export interface PaginatedMeta {
  requestId: string;
  count: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
  traceId?: string;
  retryable?: boolean;
}

/** Discriminated view of an envelope: either data (+ optional meta), or status+error. */
export type ApiResult<T> =
  | { ok: true; data: T; meta?: PaginatedMeta }
  | { ok: false; status: number; error: ApiErrorBody; retryAfterSeconds?: number };

// -- identity payloads (API surface §1–16) ---------------------------------

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  locale: string;
}

export interface LoginMembership {
  tenantId: string;
  tenantName: string;
  tenantNameAr: string | null;
  roleKey: string;
  roleName: string;
  roleNameAr: string | null;
  active: boolean;
}

/** POST /identity/sessions → data (token is stripped by the BFF before the browser sees it). */
export interface LoginResult {
  token: string;
  sessionId: string;
  expiresAt: string;
  user: SessionUser;
  memberships: LoginMembership[];
}

export interface CurrentMembership {
  tenantId: string;
  tenantName: string;
  tenantNameAr: string | null;
  roleKey: string;
  membershipStatus: string;
  tenantStatus: string;
}

/** GET /identity/sessions/current → data. */
export interface CurrentSession {
  user: SessionUser;
  activeTenantId: string | null;
  memberships: CurrentMembership[];
  permissions: string[];
}

/** POST /identity/sessions/switch-tenant → data (token stripped by the BFF). */
export interface SwitchTenantResult {
  token: string;
  sessionId: string;
  activeTenantId: string;
}

/** POST /identity/invitations/accept → data (token stripped by the BFF). */
export interface AcceptInvitationResult {
  userId: string;
  token: string;
  sessionId: string;
  expiresAt: string;
}

export interface InvitationView {
  invitationId: string;
  tenantId: string;
  tenantName: string;
  tenantNameAr: string | null;
  tenantStatus: string;
  email: string;
  roleId: string;
  roleKey: string;
  roleName: string;
  roleNameAr: string | null;
  status: string;
  expiresAt: string;
}

/** POST /identity/invitations → data. */
export interface IssuedInvitation {
  invitationId: string;
  expiresAt: string;
  acceptPath: string;
}

export interface TenantUserRow {
  membershipId: string;
  userId: string;
  email: string;
  fullName: string;
  status: string;
  locale: string;
  lastLoginAt: string | null;
  roleId: string;
  roleKey: string;
  roleName: string;
  roleNameAr: string | null;
  membershipStatus: string;
}

export interface RoleRow {
  id: string;
  tenantId: string | null;
  key: string;
  name: string;
  nameAr: string | null;
  isSystem: boolean;
}

/** GET /identity/roles → data. */
export interface RolesData {
  tenantRoles: RoleRow[];
  systemTemplates: RoleRow[];
}

/** GET /identity/sessions/tenant → rows (tokenHash is never rendered). */
export interface TenantSessionRow {
  id: string;
  userId: string;
  tokenHash: string;
  activeTenantId: string | null;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
  ip: string | null;
  lastSeenAt: string;
}

/** POST /identity/mfa/totp/enroll → data. */
export interface MfaEnrollResult {
  factorId: string;
  secret: string;
  otpauth: string;
}

export interface RevokedResult {
  revoked: boolean;
}

export interface AcceptedResult {
  accepted: boolean;
}

export interface ChangedResult {
  changed: boolean;
}

export interface ConfirmedResult {
  confirmed: boolean;
}

export interface RecoveryCodesResult {
  codes: string[];
}

// -- PHASE-004 tenancy + platform payloads (P4-T12a) ---------------------------

/** GET /platform/register/options → data (public; seeded reference data). */
export interface RegistrationCountry {
  code: string;
  name: string;
  nameAr: string | null;
  currencyCode: string;
  defaultLocale: string;
}

export interface RegistrationCurrency {
  code: string;
  name: string;
  nameAr: string | null;
  minorUnits: number;
}

export interface IndustryTemplateOption {
  key: string;
  name: string;
  nameAr: string | null;
  version: number;
}

export interface RegistrationOptions {
  countries: RegistrationCountry[];
  currencies: RegistrationCurrency[];
  industryTemplates: IndustryTemplateOption[];
}

/** POST /platform/register → data (no session is issued — owner signs in). */
export interface RegisterResult {
  tenantId: string;
  ownerEmail: string;
  trialExpiresAt: string;
  next: string;
}

/** GET /tenancy/profile → data (own-tenant profile row). */
export interface TenantProfile {
  id: string;
  name: string;
  nameAr: string | null;
  status: string;
  baseCurrency: string;
  countryCode: string;
  timezone: string;
  industryTemplateKey: string | null;
  createdAt: string;
}

/** GET /tenancy/settings → effective-config snapshot (registry defaults ∪ stored rows). */
export type TenantSettingsMap = Record<string, unknown>;

/** Branch wire row (GET /tenancy/branches, POST /tenancy/branches). */
export interface BranchRow {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  nameAr: string | null;
  isActive: boolean;
  createdAt: string;
}

/** POST /tenancy/onboarding/provision → data (idempotent provision diff). */
export interface ProvisionDiff {
  tenantId: string;
  roles: { created: string[]; existing: string[] };
  accounts: { created: number; existing: number };
  purposes: { created: number; existing: number };
  settings: { created: string[]; existing: string[] };
}

/** GET /tenancy/entitlements → data (BR-039 derived payload, every member). */
export interface DerivedEntitlements {
  featureKeys: string[];
  sources: Array<{ featureKey: string; source: string; expiresAt: string | null }>;
}

/** Support-session wire row (tenant + platform planes). */
export interface SupportSessionRow {
  id: string;
  tenantId: string;
  platformUserId: string;
  optIn: boolean;
  ticketRef: string | null;
  reason: string;
  openedAt: string;
  expiresAt: string;
  closedAt: string | null;
  closedBy: string | null;
  status: string;
}

/** GET /platform/tenants → rows (cursor-paginated; the UI requests limit=200). */
export interface ConsoleTenantSummary {
  id: string;
  name: string;
  nameAr: string | null;
  status: string;
  countryCode: string;
  baseCurrency: string;
  industryTemplateKey: string | null;
  createdAt: string;
  isPlatformTenant: boolean;
}

export interface ConsoleEntitlement {
  id: string;
  tenantId: string;
  featureKey: string;
  source: string;
  expiresAt: string | null;
}

export interface ConsoleSubscription {
  id: string;
  tenantId: string;
  planId: string;
  status: string;
  periodStart: string;
  periodEnd: string;
  providerRef: string | null;
}

export interface ConsoleMembership {
  membershipId: string;
  userId: string;
  email: string;
  fullName: string;
  roleKey: string;
  membershipStatus: string;
}

/** GET /platform/tenants/:id → data. */
export interface ConsoleTenantDetail extends ConsoleTenantSummary {
  subscription: ConsoleSubscription | null;
  plan: { key: string; name: string; nameAr: string } | null;
  entitlements: ConsoleEntitlement[];
  branches: BranchRow[];
  memberships: ConsoleMembership[];
}

/** POST /platform/tenants/:id/plan → data. */
export interface PlanAssignResult {
  planKey: string;
  grantedKeys: number;
}

/** POST /platform/tenants/:id/suspend → data. */
export interface SuspendResult {
  tenantId: string;
  status: string;
  killedSessions: number;
}

/** POST /platform/tenants/:id/restore → data. */
export interface RestoreResult {
  tenantId: string;
  status: string;
}

/** Audit event wire row (GET /platform/audit/events). tenantId is null on platform-scope rows. */
export interface PlatformAuditEvent {
  id: string;
  tenantId: string | null;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  at: string;
  viaPlatformAdmin: boolean;
}

// -- envelope narrowing ------------------------------------------------------

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isSuccessEnvelope(value: unknown): value is { data: unknown } {
  return isRecord(value) && "data" in value;
}

export function isErrorEnvelope(value: unknown): value is { error: ApiErrorBody } {
  if (!isRecord(value) || !("error" in value)) {
    return false;
  }
  const error = value.error;
  return isRecord(error) && typeof error.code === "string" && typeof error.message === "string";
}

/** Best-effort error body from an arbitrary upstream JSON value. */
export function errorBodyOf(value: unknown): ApiErrorBody {
  if (isErrorEnvelope(value)) {
    return value.error;
  }
  return { code: "INTERNAL", message: "unexpected upstream response" };
}

/** Narrows an envelope's `meta` into a PaginatedMeta when present (P4-T12a). */
export function paginatedMetaOf(value: unknown): PaginatedMeta | undefined {
  if (!isRecord(value) || !("meta" in value) || !isRecord(value.meta)) {
    return undefined;
  }
  const meta = value.meta;
  const requestId = typeof meta.requestId === "string" ? meta.requestId : "";
  const count = typeof meta.count === "number" ? meta.count : 0;
  const hasMore = typeof meta.hasMore === "boolean" ? meta.hasMore : false;
  if (typeof meta.nextCursor === "string" && meta.nextCursor !== "") {
    return { requestId, count, hasMore, nextCursor: meta.nextCursor };
  }
  return { requestId, count, hasMore };
}

/** A success payload that carries a bearer token (login/switch/accept). */
export function hasToken(value: unknown): value is { token: string } & Record<string, unknown> {
  return isRecord(value) && typeof value.token === "string" && value.token !== "";
}

export function parseJsonOrUndefined(text: string): unknown {
  if (text === "") {
    return undefined;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

/** `details.retryAfterSeconds` (account-lockout / rate-limit payloads). */
export function retrySecondsFrom(details: unknown): number | undefined {
  if (isRecord(details) && typeof details.retryAfterSeconds === "number") {
    return details.retryAfterSeconds;
  }
  return undefined;
}

export function retrySecondsFromHeader(header: string | null): number | undefined {
  if (header === null) {
    return undefined;
  }
  const seconds = Number.parseInt(header, 10);
  return Number.isNaN(seconds) ? undefined : seconds;
}
