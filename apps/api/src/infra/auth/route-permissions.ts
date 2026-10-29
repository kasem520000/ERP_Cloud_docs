/**
 * Route → permission registry (PHASE-003 T10; matrix §8 layer 1): the single
 * machine-readable source the controllers declare and the generated
 * checklist test (route × role template → 2xx/403) iterates. Adding a
 * protected route without a registry row is the review blocker the phase
 * document names — the checklist fails until it lands here.
 */

export interface RoutePermissionRule {
  readonly method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  readonly path: string;
  /** AUTHORIZATION_MATRIX key — routes without one are public and listed in PUBLIC_ROUTES. */
  readonly permission: string;
  /** Self-scoped keys: granted to every authenticated user for own resources. */
  readonly self?: boolean;
}

/** PHASE-003 live routes (identity + audit plane). */
export const ROUTE_PERMISSIONS: readonly RoutePermissionRule[] = [
  {
    method: "GET",
    path: "/api/v1/identity/users",
    permission: "identity.users.view",
  },
  {
    method: "POST",
    path: "/api/v1/identity/invitations",
    permission: "identity.users.invite",
  },
  {
    method: "GET",
    path: "/api/v1/identity/invitations",
    permission: "identity.users.view",
  },
  {
    method: "POST",
    path: "/api/v1/identity/invitations/:id/revoke",
    permission: "identity.users.invite",
  },
  {
    method: "POST",
    path: "/api/v1/identity/memberships/:id/revoke",
    permission: "identity.users.manage",
  },
  {
    method: "GET",
    path: "/api/v1/identity/sessions/tenant",
    permission: "identity.sessions.revoke",
  },
  {
    method: "POST",
    path: "/api/v1/identity/sessions/:id/revoke",
    permission: "identity.sessions.revoke",
  },
  {
    method: "GET",
    path: "/api/v1/identity/roles",
    permission: "identity.roles.assign",
  },
  {
    method: "POST",
    path: "/api/v1/identity/roles/clone-template",
    permission: "identity.roles.assign",
  },
  {
    method: "POST",
    path: "/api/v1/identity/roles/:id/grants",
    permission: "identity.roles.assign",
  },
  {
    method: "GET",
    path: "/api/v1/audit/events",
    permission: "audit.view",
  },
  // -- PHASE-004: tenancy tenant-plane routes (matrix §3.9) ---------------
  {
    method: "GET",
    path: "/api/v1/tenancy/profile",
    permission: "tenancy.settings.manage",
  },
  {
    method: "PUT",
    path: "/api/v1/tenancy/profile",
    permission: "tenancy.settings.manage",
  },
  {
    method: "GET",
    path: "/api/v1/tenancy/settings",
    permission: "tenancy.settings.manage",
  },
  {
    method: "PUT",
    path: "/api/v1/tenancy/settings/:key",
    permission: "tenancy.settings.manage",
  },
  {
    method: "GET",
    path: "/api/v1/tenancy/branches",
    permission: "tenancy.branches.manage",
  },
  {
    method: "POST",
    path: "/api/v1/tenancy/branches",
    permission: "tenancy.branches.manage",
  },
  {
    method: "PATCH",
    path: "/api/v1/tenancy/branches/:id",
    permission: "tenancy.branches.manage",
  },
  {
    method: "POST",
    path: "/api/v1/tenancy/onboarding/provision",
    permission: "tenancy.settings.manage",
  },
  {
    method: "GET",
    path: "/api/v1/tenancy/support-sessions",
    permission: "tenancy.settings.manage",
  },
  {
    method: "DELETE",
    path: "/api/v1/tenancy/support-sessions/:id",
    permission: "tenancy.settings.manage",
  },
  // -- PHASE-004: platform console routes (matrix §3.10, S-07) -----------
  {
    method: "GET",
    path: "/api/v1/platform/tenants",
    permission: "platform.tenants.view",
  },
  {
    method: "GET",
    path: "/api/v1/platform/tenants/:id",
    permission: "platform.tenants.view",
  },
  {
    method: "POST",
    path: "/api/v1/platform/tenants/:id/suspend",
    permission: "platform.tenants.suspend",
  },
  {
    method: "POST",
    path: "/api/v1/platform/tenants/:id/restore",
    permission: "platform.tenants.restore",
  },
  {
    method: "GET",
    path: "/api/v1/platform/tenants/:id/entitlements",
    permission: "platform.entitlements.manage",
  },
  {
    method: "POST",
    path: "/api/v1/platform/tenants/:id/entitlements",
    permission: "platform.entitlements.manage",
  },
  {
    method: "DELETE",
    path: "/api/v1/platform/tenants/:id/entitlements/:featureKey",
    permission: "platform.entitlements.manage",
  },
  {
    method: "POST",
    path: "/api/v1/platform/tenants/:id/plan",
    permission: "platform.subscriptions.manage",
  },
  {
    method: "GET",
    path: "/api/v1/platform/audit/events",
    permission: "platform.audit.view",
  },
  {
    method: "GET",
    path: "/api/v1/platform/tenants/:id/support-sessions",
    permission: "platform.support.access",
  },
  {
    method: "POST",
    path: "/api/v1/platform/tenants/:id/support-sessions",
    permission: "platform.support.access",
  },
  {
    method: "POST",
    path: "/api/v1/platform/tenants/:id/support-sessions/:sessionId/close",
    permission: "platform.support.access",
  },
  {
    method: "GET",
    path: "/api/v1/platform/tenants/:id/support-sessions/:sessionId/tenant-data/:resource",
    permission: "platform.support.access",
  },
];

/**
 * Session-authenticated but permission-free routes (self plane):
 * introspection, logout, rotation, switch, MFA self-management, password
 * change. identity.mfa.manage is "every user (self)" (matrix §3.9) — the
 * evaluator grants it to every authenticated user on self-targeted routes.
 */
export const SESSION_ROUTES: readonly { method: string; path: string }[] = [
  { method: "GET", path: "/api/v1/identity/sessions/current" },
  // PHASE-004: BR-039 derived-only UI payload — every tenant member reads it.
  { method: "GET", path: "/api/v1/tenancy/entitlements" },
  { method: "DELETE", path: "/api/v1/identity/sessions/current" },
  { method: "POST", path: "/api/v1/identity/sessions/refresh" },
  { method: "POST", path: "/api/v1/identity/sessions/switch-tenant" },
  { method: "POST", path: "/api/v1/identity/mfa/totp/enroll" },
  { method: "POST", path: "/api/v1/identity/mfa/totp/verify" },
  { method: "DELETE", path: "/api/v1/identity/mfa/totp" },
  { method: "POST", path: "/api/v1/identity/mfa/recovery-codes" },
  { method: "POST", path: "/api/v1/identity/password-change" },
];

/**
 * Public (pre-auth) routes — login/refresh are ALSO exempt from the
 * Idempotency-Key requirement (IDEMPOTENCY §1.5: session-creating endpoints
 * legitimately create new state per execution).
 */
export const PUBLIC_ROUTES: readonly { method: string; path: string }[] = [
  { method: "POST", path: "/api/v1/identity/sessions" },
  { method: "POST", path: "/api/v1/identity/sessions/refresh" },
  { method: "POST", path: "/api/v1/identity/password-resets" },
  { method: "PUT", path: "/api/v1/identity/password-resets/:token" },
  { method: "GET", path: "/api/v1/identity/invitations/accept" },
  { method: "POST", path: "/api/v1/identity/invitations/accept" },
  // PHASE-004: public registration (rate-limited inside the service).
  { method: "GET", path: "/api/v1/platform/register/options" },
  { method: "POST", path: "/api/v1/platform/register" },
];

/** Routes whose POSTs require an Idempotency-Key header (IDEMPOTENCY §1). */
export function isIdempotencyExempt(method: string, path: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => route.method === method && (route.path.endsWith(":token") || pathMatches(route.path, path)),
  );
}

function pathMatches(pattern: string, path: string): boolean {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = path.split("/").filter(Boolean);
  if (patternParts.length !== pathParts.length) {
    return false;
  }
  return patternParts.every((part, index) => part.startsWith(":") || part === pathParts[index]);
}

/** Route matching helper shared by guard + checklist test. */
export function routeMatches(rule: RoutePermissionRule, method: string, path: string): boolean {
  return rule.method === method && pathMatches(rule.path, path);
}
