/**
 * P4-T12a — /{locale}/support-sessions (session, tenancy.settings.manage):
 * the tenant-side review trail. Lists every support session with status
 * badges (ACTIVE/CLOSED/EXPIRED/TERMINATED), reason, ticket ref, opt-in flag
 * and the opened→expires window; ACTIVE opt-in sessions carry a terminate
 * button (DELETE /api/bff/tenancy/support-sessions/:id).
 */
import { notFound, redirect } from "next/navigation";
import type { JSX } from "react";

import { AppShell } from "../../../components/app-shell";
import { SupportSessionTerminateButton } from "../../../components/support-session-terminate-button";
import { getDictionary, isLocale, type Locale } from "../../../i18n/dictionaries";
import type { SupportSessionRow } from "../../../lib/api-types";
import { formatDateTime, localizedApiError, localizedStatus, statusClass } from "../../../lib/messages";
import { fetchApi, requireSessionToken } from "../../../lib/server-api";

export default async function SupportSessionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<JSX.Element> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  const localeValue = locale as Locale;
  const d = getDictionary(localeValue);

  await requireSessionToken(localeValue);

  const sessions = await fetchApi<readonly SupportSessionRow[]>("tenancy/support-sessions");
  if (!sessions.ok && sessions.status === 401) {
    redirect(`/${locale}/login`);
  }

  let content: JSX.Element;
  if (!sessions.ok) {
    content =
      sessions.status === 403 || sessions.error.code === "FORBIDDEN" ? (
        <p className="alert alert-error" role="alert">
          {d.errorsForbidden}
        </p>
      ) : (
        <p className="alert alert-error" role="alert">
          {localizedApiError(d, sessions.error, sessions.retryAfterSeconds)}
        </p>
      );
  } else {
    content = (
      <div className="stack">
        <p className="muted" style={{ margin: 0 }}>
          {d.supportSessionsHint}
        </p>
        {sessions.data.length === 0 ? (
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
                  <th scope="col">{d.supportColClosed}</th>
                  <th scope="col">{d.usersColActions}</th>
                </tr>
              </thead>
              <tbody>
                {sessions.data.map((session) => (
                  <tr key={session.id}>
                    <td>
                      <span className={`badge ${statusClass(session.status)}`}>
                        {localizedStatus(d, session.status)}
                      </span>
                    </td>
                    <td>{session.reason}</td>
                    <td className="mono small">{session.ticketRef ?? "—"}</td>
                    <td>{session.optIn ? d.rolesYes : d.rolesNo}</td>
                    <td>{formatDateTime(session.openedAt, localeValue)}</td>
                    <td>{formatDateTime(session.expiresAt, localeValue)}</td>
                    <td>{formatDateTime(session.closedAt, localeValue)}</td>
                    <td>
                      {session.status === "ACTIVE" && session.optIn ? (
                        <SupportSessionTerminateButton locale={localeValue} sessionId={session.id} />
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <AppShell locale={localeValue} pagePath="support-sessions" title={d.supportSessionsTitle}>
      {content}
    </AppShell>
  );
}
