/**
 * Pure presentation helpers shared by server pages and client forms:
 * message templates, error-code localization, status localization,
 * bilingual (EN/AR) name selection and date formatting.
 */
import { isRecord, type ApiErrorBody } from "./api-types";
import type { Dictionary, Locale } from "../i18n/dictionaries";

/** Replaces `{placeholder}` tokens — the only templating the UI needs. */
export function formatMessage(template: string, vars: Record<string, string | number>): string {
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    out = out.replaceAll(`{${key}}`, String(value));
  }
  return out;
}

/** Generic localized message for an API error (code → dictionary string). */
export function localizedApiError(
  d: Dictionary,
  error: ApiErrorBody,
  retryAfterSeconds?: number,
): string {
  switch (error.code) {
    case "NETWORK_ERROR":
      return d.errorsNetwork;
    case "UNAUTHENTICATED":
      return d.errorsUnauthorized;
    case "FORBIDDEN":
      return d.errorsForbidden;
    case "RATE_LIMITED":
      return formatMessage(d.errorsRateLimited, { seconds: retryAfterSeconds ?? 0 });
    case "VALIDATION_ERROR":
      return d.errorsValidation;
    case "NOT_FOUND":
      return d.errorsNotFound;
    default:
      return d.errorsGeneric;
  }
}

/** Login-specific mapping (INVALID_CREDENTIALS / MFA_REQUIRED / lockout). */
export function localizedLoginError(
  d: Dictionary,
  error: ApiErrorBody,
  retryAfterSeconds?: number,
): string {
  switch (error.code) {
    case "INVALID_CREDENTIALS":
      return d.loginErrorInvalidCredentials;
    case "MFA_REQUIRED":
      return d.loginErrorMfaRequired;
    case "RATE_LIMITED":
      return formatMessage(d.loginErrorRateLimited, { seconds: retryAfterSeconds ?? 0 });
    case "UNAUTHENTICATED":
      // On the login route a 401 UNAUTHENTICATED means the account is
      // temporarily locked (details.retryAfterSeconds carries the window).
      return formatMessage(d.loginErrorAccountLocked, { seconds: retryAfterSeconds ?? 0 });
    default:
      return d.loginErrorGeneric;
  }
}

/** Invitation-specific mapping (not acceptable: expired / revoked / accepted). */
export function localizedInvitationError(d: Dictionary, error: ApiErrorBody): string {
  switch (error.code) {
    case "NOT_FOUND":
      return d.acceptErrorNotFound;
    case "VALIDATION_ERROR": {
      const reason = reasonOf(error.details);
      if (reason === "expired") {
        return d.acceptErrorExpired;
      }
      if (reason === "revoked") {
        return d.acceptErrorRevoked;
      }
      if (reason === "accepted") {
        return d.acceptErrorAccepted;
      }
      return d.acceptErrorGeneric;
    }
    default:
      return d.acceptErrorGeneric;
  }
}

/**
 * P4-T12a — tenancy/platform error mapping. Known contract codes get a
 * localized message; unknown codes fall back to the API's display-safe
 * `error.message` (ERROR_MODEL §2), then to the generic message.
 */
export function localizedTenancyError(
  d: Dictionary,
  error: ApiErrorBody,
  retryAfterSeconds?: number,
): string {
  switch (error.code) {
    case "NETWORK_ERROR":
      return d.errorsNetwork;
    case "UNAUTHENTICATED":
      return d.errorsUnauthorized;
    case "FORBIDDEN":
      return d.errorsForbidden;
    case "RATE_LIMITED":
      return formatMessage(d.errorsRateLimited, { seconds: retryAfterSeconds ?? 0 });
    case "VALIDATION_ERROR":
      return d.errorsValidation;
    case "NOT_FOUND":
      return d.errorsNotFound;
    case "tenancy/email-already-registered":
      return d.registerErrorEmailTaken;
    case "tenancy/invalid-registration-input":
      // The API guarantees this message is display-safe (contract §T4).
      return error.message !== "" ? error.message : d.errorsValidation;
    case "tenancy/branch-code-taken":
      return d.branchesErrorCodeTaken;
    case "tenancy/feature-not-entitled":
      return d.tenancyErrorFeatureNotEntitled;
    case "tenancy/feature-dependencies-missing":
      return formatMessage(d.tenancyErrorDependenciesMissing, {
        keys: missingKeysOf(error.details).join(", ") || "—",
      });
    case "tenancy/manual-grant-expiry-required":
      return d.platformGrantExpiryRequired;
    case "tenancy/unknown-feature-key":
      return d.platformGrantUnknownKey;
    case "tenancy/invalid-setting-value":
      return d.settingsErrorInvalidValue;
    case "tenancy/unknown-setting-key":
      return d.errorsGeneric;
    case "tenancy/support-access-denied":
      return d.supportErrorAccessDenied;
    case "tenancy/support-session-expired":
      return d.supportErrorExpired;
    case "tenancy/support-session-not-active":
      return d.supportErrorNotActive;
    case "tenancy/invalid-tenant-transition":
      return d.platformErrorInvalidTransition;
    case "tenancy/plan-not-found":
      return d.platformErrorPlanNotFound;
    default:
      return error.message !== "" ? error.message : d.errorsGeneric;
  }
}

/** `details.missing` (dependency-closure rejections list the keys). */
export function missingKeysOf(details: unknown): string[] {
  if (isRecord(details) && Array.isArray(details.missing)) {
    return details.missing.filter((key: unknown): key is string => typeof key === "string");
  }
  return [];
}

function reasonOf(details: unknown): string | undefined {
  if (typeof details === "object" && details !== null && "reason" in details) {
    const value = (details as { reason: unknown }).reason;
    if (typeof value === "string") {
      return value;
    }
  }
  return undefined;
}

/** Localizes row statuses; unknown statuses pass through verbatim. */
export function localizedStatus(d: Dictionary, status: string): string {
  switch (status.toUpperCase()) {
    case "ACTIVE":
      return d.statusActive;
    case "PENDING":
    case "INVITED":
      return d.statusPending;
    case "REVOKED":
      return d.statusRevoked;
    case "EXPIRED":
      return d.statusExpired;
    case "ACCEPTED":
      return d.statusAccepted;
    case "SUSPENDED":
      return d.statusSuspended;
    case "CLOSED":
      return d.statusClosed;
    case "TERMINATED":
      return d.statusTerminated;
    default:
      return status;
  }
}

/** Badge modifier for a row status. */
export function statusClass(status: string): string {
  switch (status.toUpperCase()) {
    case "ACTIVE":
      return "badge-active";
    case "PENDING":
    case "INVITED":
      return "badge-pending";
    case "REVOKED":
    case "SUSPENDED":
    case "TERMINATED":
      return "badge-revoked";
    case "EXPIRED":
    case "CLOSED":
      return "badge-expired";
    case "ACCEPTED":
      return "badge-accepted";
    default:
      return "";
  }
}

/** Picks the localized variant of a bilingual name (tenant/role). */
export function localizedName(name: string, nameAr: string | null, locale: Locale): string {
  return locale === "ar" && nameAr !== null && nameAr !== "" ? nameAr : name;
}

/** Medium date+time in the page locale; dashes for missing values. */
export function formatDateTime(iso: string | null | undefined, locale: Locale): string {
  if (iso === null || iso === undefined || iso === "") {
    return "—";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
