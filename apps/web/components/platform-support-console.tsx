"use client";

/**
 * P4-T12a — platform support-session console (§7): open a time-boxed session
 * (reason required; ticketRef OR tenant opt-in decides access — 403
 * tenancy/support-access-denied otherwise), close ACTIVE sessions (reason
 * required), and the enumerated read-data quick views (§7 rule 4) rendered
 * as raw JSON in a scrollable <pre>.
 */
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent, JSX } from "react";

import { getDictionary, type Dictionary, type Locale } from "../i18n/dictionaries";
import type { SupportSessionRow } from "../lib/api-types";
import { bffFetch } from "../lib/client-api";
import { formatDateTime, localizedStatus, localizedTenancyError, statusClass } from "../lib/messages";
import { SUPPORT_READ_RESOURCES, type SupportReadResource } from "../lib/constants";

const MIN_REASON_LENGTH = 3;
const MAX_HOURS: readonly number[] = [1, 2, 3, 4];

const RESOURCE_LABEL_KEYS: Record<SupportReadResource, keyof Dictionary> = {
  users: "resourceUsers",
  memberships: "resourceMemberships",
  roles: "resourceRoles",
  branches: "resourceBranches",
  settings: "resourceSettings",
  entitlements: "resourceEntitlements",
  subscription: "resourceSubscription",
  accounts: "resourceAccounts",
  "audit-events": "resourceAuditEvents",
};

export function PlatformSupportConsole({
  locale,
  tenantId,
  sessions,
}: {
  locale: Locale;
  tenantId: string;
  sessions: readonly SupportSessionRow[];
}): JSX.Element {
  const d = getDictionary(locale);
  const router = useRouter();

  const [reason, setReason] = useState("");
  const [ticketRef, setTicketRef] = useState("");
  const [maxHours, setMaxHours] = useState("4");
  const [openBusy, setOpenBusy] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);

  const activeSessions = sessions.filter((session) => session.status === "ACTIVE");
  const [sessionId, setSessionId] = useState<string>("");
  const effectiveSessionId =
    activeSessions.find((session) => session.id === sessionId)?.id ?? activeSessions[0]?.id ?? null;

  const [resource, setResource] = useState<SupportReadResource>("users");
  const [readBusy, setReadBusy] = useState(false);
  const [readError, setReadError] = useState<string | null>(null);
  const [readPayload, setReadPayload] = useState<string | null>(null);

  async function onOpen(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setOpenError(null);
    if (reason.trim().length < MIN_REASON_LENGTH) {
      setOpenError(d.errorsValidation);
      return;
    }
    const body: Record<string, unknown> = {
      reason: reason.trim(),
      maxHours: Number.parseInt(maxHours, 10),
    };
    if (ticketRef.trim() !== "") {
      body.ticketRef = ticketRef.trim();
    }
    setOpenBusy(true);
    const result = await bffFetch<SupportSessionRow>(
      `platform/tenants/${encodeURIComponent(tenantId)}/support-sessions`,
      { method: "POST", body },
    );
    setOpenBusy(false);
    if (!result.ok) {
      setOpenError(localizedTenancyError(d, result.error, result.retryAfterSeconds));
      return;
    }
    setReason("");
    setTicketRef("");
    setReadPayload(null);
    router.refresh();
  }

  async function onRead(): Promise<void> {
    if (effectiveSessionId === null) {
      setReadError(d.platformNoActiveSession);
      return;
    }
    setReadBusy(true);
    setReadError(null);
    setReadPayload(null);
    const result = await bffFetch<unknown>(
      `platform/tenants/${encodeURIComponent(tenantId)}/support-sessions/${encodeURIComponent(
        effectiveSessionId,
      )}/tenant-data/${resource}`,
    );
    setReadBusy(false);
    if (!result.ok) {
      setReadError(localizedTenancyError(d, result.error, result.retryAfterSeconds));
      return;
    }
    setReadPayload(
      typeof result.data === "string"
        ? result.data
        : JSON.stringify(result.data ?? null, null, 2),
    );
  }

  return (
    <section className="card" aria-label={d.platformSupportTitle}>
      <h2 style={{ marginBlockStart: 0 }}>{d.platformSupportTitle}</h2>

      <h3>{d.platformSupportOpenTitle}</h3>
      <form onSubmit={onOpen} noValidate className="stack" style={{ gap: "0.6rem", maxWidth: "34rem" }}>
        <div className="field">
          <label className="label" htmlFor={`support-reason-${tenantId}`}>
            {d.platformSupportReasonLabel}
          </label>
          <input
            id={`support-reason-${tenantId}`}
            className="input"
            type="text"
            maxLength={500}
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
            }}
          />
        </div>
        <div className="field">
          <label className="label" htmlFor={`support-ticket-${tenantId}`}>
            {d.platformSupportTicketLabel}
          </label>
          <input
            id={`support-ticket-${tenantId}`}
            className="input"
            type="text"
            maxLength={100}
            value={ticketRef}
            onChange={(event) => {
              setTicketRef(event.target.value);
            }}
          />
        </div>
        <div className="field">
          <label className="label" htmlFor={`support-hours-${tenantId}`}>
            {d.platformSupportHoursLabel}
          </label>
          <select
            id={`support-hours-${tenantId}`}
            className="input"
            style={{ maxInlineSize: "8rem" }}
            value={maxHours}
            onChange={(event) => {
              setMaxHours(event.target.value);
            }}
          >
            {MAX_HOURS.map((hours) => (
              <option key={hours} value={String(hours)}>
                {hours}
              </option>
            ))}
          </select>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={openBusy}>
            {openBusy ? d.loading : d.platformSupportOpenSubmit}
          </button>
        </div>
        {openError !== null && (
          <p className="alert alert-error" role="alert">
            {openError}
          </p>
        )}
      </form>

      <div className="section-gap">
        {sessions.length === 0 ? (
          <p className="muted">{d.supportEmpty}</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">{d.usersColStatus}</th>
                  <th scope="col">{d.supportColReason}</th>
                  <th scope="col">{d.supportColTicket}</th>
                  <th scope="col">{d.supportColOptIn}</th>
                  <th scope="col">{d.supportColOpened}</th>
                  <th scope="col">{d.usersColExpires}</th>
                  <th scope="col">{d.usersColActions}</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <SessionRow key={session.id} locale={locale} tenantId={tenantId} session={session} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="section-gap">
        <h3>{d.platformReadDataTitle}</h3>
        {effectiveSessionId === null ? (
          <p className="alert alert-info" role="note">
            {d.platformNoActiveSession}
          </p>
        ) : (
          <div className="stack" style={{ gap: "0.6rem" }}>
            <div className="inline-field">
              <label className="label" htmlFor={`read-session-${tenantId}`}>
                {d.platformSupportSessionLabel}
              </label>
              <select
                id={`read-session-${tenantId}`}
                className="input"
                style={{ maxInlineSize: "14rem" }}
                value={effectiveSessionId}
                onChange={(event) => {
                  setSessionId(event.target.value);
                }}
              >
                {activeSessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {formatDateTime(session.openedAt, locale)}
                  </option>
                ))}
              </select>
              <label className="label" htmlFor={`read-resource-${tenantId}`}>
                {d.platformReadResourceLabel}
              </label>
              <select
                id={`read-resource-${tenantId}`}
                className="input"
                style={{ maxInlineSize: "14rem" }}
                value={resource}
                onChange={(event) => {
                  setResource(event.target.value as SupportReadResource);
                }}
              >
                {SUPPORT_READ_RESOURCES.map((value) => (
                  <option key={value} value={value}>
                    {d[RESOURCE_LABEL_KEYS[value]]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-secondary btn-small"
                disabled={readBusy}
                onClick={() => {
                  void onRead();
                }}
              >
                {readBusy ? d.loading : d.platformReadSubmit}
              </button>
            </div>
            {readError !== null && (
              <p className="alert alert-error" role="alert">
                {readError}
              </p>
            )}
            {readPayload !== null && (
              <pre className="pre-scroll" aria-label={d.platformReadDataTitle}>
                {readPayload}
              </pre>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function SessionRow({
  locale,
  tenantId,
  session,
}: {
  locale: Locale;
  tenantId: string;
  session: SupportSessionRow;
}): JSX.Element {
  const d = getDictionary(locale);
  const router = useRouter();
  const [closeReason, setCloseReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClose(): Promise<void> {
    if (closeReason.trim().length < MIN_REASON_LENGTH) {
      setError(d.errorsValidation);
      return;
    }
    setBusy(true);
    setError(null);
    const result = await bffFetch<unknown>(
      `platform/tenants/${encodeURIComponent(tenantId)}/support-sessions/${encodeURIComponent(
        session.id,
      )}/close`,
      { method: "POST", body: { reason: closeReason.trim() } },
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
      <td>
        <span className={`badge ${statusClass(session.status)}`}>
          {localizedStatus(d, session.status)}
        </span>
      </td>
      <td>{session.reason}</td>
      <td className="mono small">{session.ticketRef ?? "—"}</td>
      <td>{session.optIn ? d.rolesYes : d.rolesNo}</td>
      <td>{formatDateTime(session.openedAt, locale)}</td>
      <td>{formatDateTime(session.expiresAt, locale)}</td>
      <td>
        {session.status === "ACTIVE" ? (
          <span className="inline-field">
            <input
              className="input"
              type="text"
              aria-label={d.platformSupportCloseReasonLabel}
              maxLength={500}
              value={closeReason}
              onChange={(event) => {
                setCloseReason(event.target.value);
              }}
            />
            <button
              type="button"
              className="btn btn-secondary btn-small"
              disabled={busy}
              onClick={() => {
                void onClose();
              }}
            >
              {busy ? d.loading : d.platformSupportClose}
            </button>
          </span>
        ) : (
          "—"
        )}
        {error !== null && <p className="small" role="alert">{error}</p>}
      </td>
    </tr>
  );
}
