"use client";

/**
 * P4-T12a — platform entitlements panel: the granted-keys table with inline
 * revocation (DELETE /api/bff/platform/tenants/:id/entitlements/:featureKey
 * ?reason=…, reason required) + the grant form (POST
 * /api/bff/platform/tenants/:id/entitlements). Error contract highlights:
 * 422 tenancy/feature-dependencies-missing (details.missing listed),
 * 422 tenancy/manual-grant-expiry-required, 422 tenancy/unknown-feature-key.
 */
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent, JSX } from "react";

import { getDictionary, type Locale } from "../i18n/dictionaries";
import type { ConsoleEntitlement } from "../lib/api-types";
import { bffFetch } from "../lib/client-api";
import { formatDateTime, localizedTenancyError } from "../lib/messages";
import { ENTITLEMENT_SOURCES, type EntitlementSource } from "../lib/constants";

const MIN_REASON_LENGTH = 3;

export function PlatformEntitlementsPanel({
  locale,
  tenantId,
  entitlements,
}: {
  locale: Locale;
  tenantId: string;
  entitlements: readonly ConsoleEntitlement[];
}): JSX.Element {
  const d = getDictionary(locale);
  const router = useRouter();

  const [featureKey, setFeatureKey] = useState("");
  const [source, setSource] = useState<EntitlementSource>("MANUAL");
  const [expiresAt, setExpiresAt] = useState("");
  const [reason, setReason] = useState("");
  const [grantBusy, setGrantBusy] = useState(false);
  const [grantNotice, setGrantNotice] = useState<string | null>(null);
  const [grantError, setGrantError] = useState<string | null>(null);

  async function onGrant(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setGrantError(null);
    setGrantNotice(null);
    if (featureKey.trim() === "" || reason.trim().length < MIN_REASON_LENGTH) {
      setGrantError(d.errorsValidation);
      return;
    }
    if (source === "MANUAL" && expiresAt === "") {
      setGrantError(d.platformGrantExpiryRequired);
      return;
    }
    const body: Record<string, unknown> = {
      featureKey: featureKey.trim(),
      source,
      reason: reason.trim(),
    };
    if (expiresAt !== "") {
      // The API validates a full ISO datetime — a bare date input is expanded.
      const parsed = new Date(expiresAt);
      if (!Number.isNaN(parsed.getTime())) {
        body.expiresAt = parsed.toISOString();
      }
    }
    setGrantBusy(true);
    const result = await bffFetch<ConsoleEntitlement>(
      `platform/tenants/${encodeURIComponent(tenantId)}/entitlements`,
      { method: "POST", body },
    );
    setGrantBusy(false);
    if (!result.ok) {
      setGrantError(localizedTenancyError(d, result.error, result.retryAfterSeconds));
      return;
    }
    setGrantNotice(d.platformGrantDone);
    setFeatureKey("");
    setExpiresAt("");
    setReason("");
    router.refresh();
  }

  return (
    <section className="card" aria-label={d.platformEntitlementsTitle}>
      <h2 style={{ marginBlockStart: 0 }}>{d.platformEntitlementsTitle}</h2>
      {entitlements.length === 0 ? (
        <p className="muted">{d.platformEntitlementsEmpty}</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">{d.platformColFeatureKey}</th>
                <th scope="col">{d.platformColSource}</th>
                <th scope="col">{d.usersColExpires}</th>
                <th scope="col">{d.usersColActions}</th>
              </tr>
            </thead>
            <tbody>
              {entitlements.map((entitlement) => (
                <RevokeRow
                  key={entitlement.id}
                  locale={locale}
                  tenantId={tenantId}
                  entitlement={entitlement}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="section-gap">
        <h3>{d.platformGrantTitle}</h3>
        <form onSubmit={onGrant} noValidate className="stack" style={{ gap: "0.6rem", maxWidth: "34rem" }}>
          <div className="field">
            <label className="label" htmlFor={`grant-feature-${tenantId}`}>
              {d.platformGrantFeatureLabel}
            </label>
            <input
              id={`grant-feature-${tenantId}`}
              className="input"
              type="text"
              maxLength={100}
              value={featureKey}
              onChange={(event) => {
                setFeatureKey(event.target.value);
              }}
            />
          </div>
          <div className="field">
            <label className="label" htmlFor={`grant-source-${tenantId}`}>
              {d.platformGrantSourceLabel}
            </label>
            <select
              id={`grant-source-${tenantId}`}
              className="input"
              style={{ maxInlineSize: "12rem" }}
              value={source}
              onChange={(event) => {
                setSource(event.target.value as EntitlementSource);
              }}
            >
              {ENTITLEMENT_SOURCES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor={`grant-expires-${tenantId}`}>
              {d.platformGrantExpiresLabel}
            </label>
            <input
              id={`grant-expires-${tenantId}`}
              className="input"
              type="date"
              style={{ maxInlineSize: "12rem" }}
              value={expiresAt}
              onChange={(event) => {
                setExpiresAt(event.target.value);
              }}
            />
            <span className="muted small">{d.platformGrantExpiresHint}</span>
          </div>
          <div className="field">
            <label className="label" htmlFor={`grant-reason-${tenantId}`}>
              {d.platformGrantReasonLabel}
            </label>
            <input
              id={`grant-reason-${tenantId}`}
              className="input"
              type="text"
              maxLength={500}
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
              }}
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={grantBusy}>
              {grantBusy ? d.loading : d.platformGrantSubmit}
            </button>
          </div>
          {grantNotice !== null && (
            <p className="alert alert-success" role="status">
              {grantNotice}
            </p>
          )}
          {grantError !== null && (
            <p className="alert alert-error" role="alert">
              {grantError}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}

function RevokeRow({
  locale,
  tenantId,
  entitlement,
}: {
  locale: Locale;
  tenantId: string;
  entitlement: ConsoleEntitlement;
}): JSX.Element {
  const d = getDictionary(locale);
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onRevoke(): Promise<void> {
    if (reason.trim().length < MIN_REASON_LENGTH) {
      setError(d.errorsValidation);
      return;
    }
    setBusy(true);
    setError(null);
    const result = await bffFetch<unknown>(
      `platform/tenants/${encodeURIComponent(tenantId)}/entitlements/${encodeURIComponent(
        entitlement.featureKey,
      )}?reason=${encodeURIComponent(reason.trim())}`,
      { method: "DELETE" },
    );
    setBusy(false);
    if (!result.ok) {
      setError(localizedTenancyError(d, result.error, result.retryAfterSeconds));
      return;
    }
    router.refresh();
  }

  return (
    <tr>
      <td className="mono small">{entitlement.featureKey}</td>
      <td className="mono small">{entitlement.source}</td>
      <td>{formatDateTime(entitlement.expiresAt, locale)}</td>
      <td>
        <span className="inline-field">
          <input
            className="input"
            type="text"
            aria-label={d.platformRevokeReasonLabel}
            maxLength={500}
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
            }}
          />
          <button
            type="button"
            className="btn btn-danger btn-small"
            disabled={busy}
            onClick={() => {
              void onRevoke();
            }}
          >
            {busy ? d.loading : d.platformRevoke}
          </button>
        </span>
        {error !== null && <p className="small" role="alert">{error}</p>}
      </td>
    </tr>
  );
}
